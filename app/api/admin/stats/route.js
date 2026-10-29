import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Company from '../../../../models/Company';
import User from '../../../../models/User';
import Submission from '../../../../models/Submission';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';
import {
  SUBMISSION_STATUSES,
  buildCardTrends,
  buildStatusBreakdown,
  buildYearlyTrend,
  getCardTrendPeriods,
  getCurrentTaxPeriod,
  getKarachiMonthStart,
  parseReportYear,
} from '../../../../lib/admin/dashboardStats';

export const dynamic = 'force-dynamic';

function dashboardJson(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) {
      error.headers.set('Cache-Control', 'no-store');
      return error;
    }

    const currentPeriod = getCurrentTaxPeriod();
    const { searchParams } = new URL(request.url);
    const year = parseReportYear(searchParams.get('year'), currentPeriod.year);
    if (year === null) return dashboardJson({ error: 'Choose a valid reporting year' }, 400);

    const isCurrentPeriod = {
      $and: [
        { $eq: ['$taxPeriodMonth', currentPeriod.month] },
        { $eq: ['$taxPeriodYear', currentPeriod.year] },
      ],
    };
    const summaryGroup = {
      _id: null,
      totalSubmissions: { $sum: 1 },
      totalSaleValue: { $sum: '$totalSaleValue' },
      totalTaxAmount: { $sum: '$totalTaxAmount' },
      totalBillAmount: { $sum: '$totalBillAmount' },
    };
    for (const [status, field] of SUBMISSION_STATUSES) {
      const isStatus = { $eq: ['$status', status] };
      summaryGroup[field] = { $sum: { $cond: [isStatus, 1, 0] } };
      summaryGroup[`currentMonth${field[0].toUpperCase()}${field.slice(1)}`] = {
        $sum: { $cond: [{ $and: [isStatus, isCurrentPeriod] }, 1, 0] },
      };
    }

    const cardTrendPeriods = getCardTrendPeriods(currentPeriod);
    const nextMonth = {
      year: currentPeriod.year + (currentPeriod.month === 12 ? 1 : 0),
      month: currentPeriod.month === 12 ? 1 : currentPeriod.month + 1,
    };
    const registrationDates = {
      $gte: getKarachiMonthStart(cardTrendPeriods[0]),
      $lt: getKarachiMonthStart(nextMonth),
    };
    const registrationMonth = {
      $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Karachi' },
    };
    const trendSubmissionGroup = {
      _id: { year: '$taxPeriodYear', month: '$taxPeriodMonth' },
      totalSubmissions: { $sum: 1 },
      totalSaleValue: { $sum: '$totalSaleValue' },
      totalTaxAmount: { $sum: '$totalTaxAmount' },
    };
    for (const [status, field] of SUBMISSION_STATUSES) {
      trendSubmissionGroup[field] = { $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } };
    }

    await connectDB();
    const [totalCompanies, activeCompanies, totalUsers, summaries, monthlyTotals, performance, recent, companyMonths, userMonths, submissionMonths] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'company_user' }),
      Submission.aggregate([{ $group: summaryGroup }]),
      Submission.aggregate([
        { $match: { taxPeriodYear: year } },
        {
          $group: {
            _id: '$taxPeriodMonth',
            saleValue: { $sum: '$totalSaleValue' },
            taxAmount: { $sum: '$totalTaxAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Submission.aggregate([
        { $match: { taxPeriodYear: year } },
        {
          $group: {
            _id: '$companyId',
            saleValue: { $sum: '$totalSaleValue' },
            taxAmount: { $sum: '$totalTaxAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { saleValue: -1, _id: 1 } },
        { $limit: 5 },
        { $lookup: { from: Company.collection.name, localField: '_id', foreignField: '_id', as: 'company' } },
        { $project: { saleValue: 1, taxAmount: 1, count: 1, companyName: { $arrayElemAt: ['$company.companyName', 0] } } },
      ]),
      Submission.find({})
        .sort({ updatedAt: -1, _id: -1 })
        .limit(5)
        .select('invoiceNumber companyId submissionType taxPeriodMonth taxPeriodYear totalSaleValue totalTaxAmount totalBillAmount status submittedAt updatedAt')
        .populate('companyId', 'companyName')
        .lean(),
      Company.aggregate([
        { $match: { createdAt: registrationDates } },
        {
          $group: {
            _id: registrationMonth,
            totalCompanies: { $sum: 1 },
            activeCompanies: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          },
        },
      ]),
      User.aggregate([
        { $match: { role: 'company_user', createdAt: registrationDates } },
        { $group: { _id: registrationMonth, totalUsers: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { $or: cardTrendPeriods.map(({ year: periodYear, month }) => ({ taxPeriodYear: periodYear, taxPeriodMonth: month })) } },
        { $group: trendSubmissionGroup },
      ]),
    ]);

    const summary = summaries[0] || {};
    const statusBreakdown = buildStatusBreakdown(summary);
    return dashboardJson({
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalSubmissions: summary.totalSubmissions || 0,
      ...Object.fromEntries(SUBMISSION_STATUSES.map(([status, field]) => [field, statusBreakdown[status]])),
      // Headline totals cover every tax period and submission status.
      totalSaleValue: summary.totalSaleValue || 0,
      totalTaxAmount: summary.totalTaxAmount || 0,
      totalBillAmount: summary.totalBillAmount || 0,
      statusBreakdown,
      statusBreakdowns: { all: statusBreakdown, currentMonth: buildStatusBreakdown(summary, 'currentMonth') },
      currentPeriod,
      cardTrendPeriods,
      cardTrends: buildCardTrends({ periods: cardTrendPeriods, companies: companyMonths, users: userMonths, submissions: submissionMonths }),
      year,
      monthlyTrend: buildYearlyTrend(monthlyTotals),
      companyPerformance: performance.map((company) => ({
        id: String(company._id),
        name: company.companyName || 'Unavailable company',
        saleValue: company.saleValue || 0,
        taxAmount: company.taxAmount || 0,
        count: company.count || 0,
      })),
      recentSubmissions: recent.map((submission) => ({
        id: String(submission._id),
        invoiceNumber: submission.invoiceNumber || '',
        companyId: submission.companyId?._id ? String(submission.companyId._id) : null,
        companyName: submission.companyId?.companyName || 'Unavailable company',
        submissionType: submission.submissionType,
        taxPeriodMonth: submission.taxPeriodMonth,
        taxPeriodYear: submission.taxPeriodYear,
        totalSaleValue: submission.totalSaleValue || 0,
        totalTaxAmount: submission.totalTaxAmount || 0,
        totalBillAmount: submission.totalBillAmount || 0,
        status: submission.status,
        submittedAt: submission.submittedAt || null,
        updatedAt: submission.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to load admin dashboard statistics:', error);
    return dashboardJson({ error: 'Unable to load dashboard statistics' }, 500);
  }
}
