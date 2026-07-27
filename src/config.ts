/**
 * Lifetrenz Portal - Independent App Configuration
 * Houses all default settings, credentials, and API endpoints for the browser-only client.
 */

export interface EhrSettings {
  hostUrl: string
  customerId: number
  userId: number
  siteId: number
  corsProxy?: string
}

export const DEFAULT_SETTINGS: EhrSettings = {
  hostUrl: 'https://me-alpha.pulsehealthtech.com',
  customerId: 4,
  userId: 0, // Recommended User ID 0 for read-only queries
  siteId: 11, // Standard default site (BJ branch default, MK is 10)
  corsProxy: ''
}

export const EHR_ENDPOINTS = {
  nursingSearch: 'out/patient/op/nursing/search/get',
  rcmCasesSearch: 'claim/all/cases/get',
  summaryPreview: 'outpatient/summary/preview/get',
  uploadedImages: 'patient/encounter/uploaded/image/item/get',
  allEncounters: 'apmgnt/outpatient/all/encounter/get',
  authorizationDetails: 'op/nursing/patient/autherization/details/get',
  remittanceHistory: 'claim/remittance/advice/history/get',
  insuranceDetails: 'claim/insurance/details/replicate/get',
  diseaseget: 'tb/patient/diseaseget',
  claimRemarks: 'claim/remarks/get',
  resubmissionFiles: 'claim/history/file/details/get',
  resubmissionReasons: 'resubmission/reason/get',
  addResubmissionReason: 'add/resubmission/reason',
  saveClaimRemarks: 'claim/marked/for/write/off/update',
  writeOffLedger: 'accrec/account/receivable/write/off',

  // PDF summary print endpoint route builder
  pdfSummaryPath: (
    patientId: number | string,
    siteId: number | string,
    encounterId: number | string,
    userId: number | string
  ) => `pdf/patient/${patientId}/site/${siteId}/encounter/${encounterId}/createdby/${userId}/type/null/op/print/summary`
}
