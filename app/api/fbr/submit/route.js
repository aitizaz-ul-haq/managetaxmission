import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import connectDB from '../../../../lib/mongodb';
import FbrReceipt from '../../../../models/FbrReceipt';
import Submission from '../../../../models/Submission';
import { requireCompanyUser } from '../../../../lib/auth/requireCompanyUser';
import { submitInvoice } from '../../../../lib/fbr/bridgeClient';
import { buildExampleInvoice } from '../../../../lib/fbr/exampleInvoice';
import { mapSubmissionToInvoice } from '../../../../lib/fbr/mapSubmissionToInvoice';

/**
 * POST /api/fbr/submit
 * Body (all optional):
 *   { submissionRef?: string, invoice?: object, submissionId?: string, useExample?: boolean }
 * Resolution order for the invoice payload:
 *   1. submissionRef  -> load that Submission, map it to the FBR invoice shape
 *   2. invoice        -> use the supplied invoice as-is
 *   3. otherwise / useExample -> use the built-in example payload
 */
export async function POST(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  await connectDB();

  let invoice;
  let submissionDoc = null;

  if (body.submissionRef) {
    submissionDoc = await Submission.findOne({
      _id: body.submissionRef,
      companyId: user.companyId,
    });
    if (!submissionDoc) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    invoice = mapSubmissionToInvoice(submissionDoc.toObject());
  } else if (body.useExample || !body.invoice) {
    invoice = buildExampleInvoice();
  } else {
    invoice = body.invoice;
  }

  const submissionId = body.submissionId || String(submissionDoc?._id || randomUUID());

  const { ok, status, envelope } = await submitInvoice({ submissionId, invoice });

  const receipt = await FbrReceipt.create({
    companyId: user.companyId,
    createdBy: user.userId,
    submissionRef: submissionDoc?._id || null,
    submissionId,
    action: 'submit',
    invoicePayload: invoice,
    success: Boolean(envelope?.success),
    mock: Boolean(envelope?.mock),
    environment: envelope?.environment || '',
    requestId: envelope?.requestId || '',
    httpStatus: envelope?.httpStatus ?? status ?? null,
    fbrResponse: envelope?.fbrResponse ?? null,
    errorCode: envelope?.error?.code || '',
    errorMessage: envelope?.error?.message || '',
    rawEnvelope: envelope,
    receivedAt: envelope?.receivedAt ? new Date(envelope.receivedAt) : new Date(),
  });

  if (submissionDoc) {
    submissionDoc.status = envelope?.success ? 'submitted' : 'failed';
    submissionDoc.fbrResponse = envelope || null;
    submissionDoc.fbrPayload = invoice;
    if (envelope?.success) submissionDoc.submittedAt = new Date();
    await submissionDoc.save();
  }

  return NextResponse.json(
    { success: Boolean(envelope?.success), envelope, receipt },
    { status: ok && envelope?.success ? 200 : 502 }
  );
}
