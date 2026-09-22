export const SCENARIO_PROFILES = {
  SN019: {
    scenarioId: 'SN019',
    submissionType: 'sale_tax_fed',
    saleType: 'Services',
    defaultHsCode: '9815.9000',
    defaultTaxRate: 16,
    defaultSroScheduleNo: 'ICTO TABLE II',
    defaultSroItemSerialNo: '1(i)',
  },
  SN018: {
    scenarioId: 'SN018',
    submissionType: 'services_fed_st_mode',
    saleType: 'Services (FED in ST Mode)',
    defaultHsCode: '',
    defaultTaxRate: null,
    defaultSroScheduleNo: '',
    defaultSroItemSerialNo: '',
  },
};

export function getScenarioProfile(scenarioId) {
  const key = String(scenarioId || '').trim();
  return SCENARIO_PROFILES[key] || null;
}
