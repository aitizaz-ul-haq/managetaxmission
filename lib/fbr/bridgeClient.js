import { randomUUID } from 'crypto';

/**
 * Server-only client for the FBR bridge.
 * The browser must NEVER call the bridge directly — always go through our own
 * /api/fbr/* routes which use this module.
 */

const BASE_URL = process.env.FBR_BRIDGE_BASE_URL;
const API_KEY = process.env.FBR_BRIDGE_API_KEY;
const TIMEOUT_MS = Number(process.env.FBR_BRIDGE_TIMEOUT_MS || 35000);

const PREFIX = '/api/v1/fbr/invoices';

function assertConfig() {
  if (!BASE_URL) throw new Error('FBR_BRIDGE_BASE_URL is not configured');
  if (!API_KEY) throw new Error('FBR_BRIDGE_API_KEY is not configured');
}

/**
 * @param {'validate'|'submit'} action
 * @param {{ submissionId: string, invoice: object, idempotencyKey?: string, fbrToken?: string }} params
 * @returns {Promise<{ ok: boolean, status: number, envelope: any }>}
 */
async function callBridge(action, { submissionId, invoice, idempotencyKey, fbrToken }) {
  assertConfig();

  const url = `${BASE_URL}${PREFIX}/${action}`;
  const requestId = randomUUID();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
    'X-Request-ID': requestId,
    'X-Idempotency-Key': idempotencyKey || `${submissionId}:${action}`,
  };
  // Per-company FBR token overrides the bridge's default env token so each
  // company's invoices are submitted under its own seller NTN.
  if (fbrToken) headers['X-FBR-Token'] = fbrToken;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ submissionId, invoice }),
      signal: controller.signal,
    });

    let envelope;
    try {
      envelope = await res.json();
    } catch {
      envelope = { success: false, error: { code: 'FBR_UNEXPECTED_RESPONSE', message: 'Non-JSON response from bridge' } };
    }

    return { ok: res.ok, status: res.status, envelope };
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      envelope: {
        success: false,
        error: {
          code: isAbort ? 'FBR_TIMEOUT' : 'FBR_NETWORK_ERROR',
          message: isAbort ? `Bridge request timed out after ${TIMEOUT_MS}ms` : (err?.message || 'Network error contacting bridge'),
        },
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export function validateInvoice(params) {
  return callBridge('validate', params);
}

export function submitInvoice(params) {
  return callBridge('submit', params);
}
