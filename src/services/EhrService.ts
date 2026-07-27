import ky from 'ky'
import dayjs from 'dayjs'
import { EhrSettings, DEFAULT_SETTINGS, EHR_ENDPOINTS } from '../config'
export type { EhrSettings }

const REQUEST_TIMEOUT = 30000

class EhrService {
  private settings: EhrSettings = { ...DEFAULT_SETTINGS }

  constructor() {
    this.loadSettings()
  }

  getSettings(): EhrSettings { return { ...this.settings } }

  saveSettings(newSettings: Partial<EhrSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    localStorage.setItem('mini_app_ehr_settings', JSON.stringify(this.settings))
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem('mini_app_ehr_settings')
      if (stored) this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS }
    }
  }

  private serviceEnvelope(body: any, customHeader?: any): any {
    return {
      body,
      head: customHeader || { reqtime: new Date().toDateString(), srvseqno: '', reqtype: 'POST' }
    }
  }

  private async ehrPost(endpoint: string, body: any, envelopeBuilder?: (body: any) => any): Promise<any> {
    const cleanEndpoint = endpoint.replace(/^\//, '')
    const cleanHost = this.settings.hostUrl.replace(/\/$/, '')
    const directUrl = `${cleanHost}/SCMS/web/app.php/${cleanEndpoint}`

    const proxyPrefix = (this.settings.corsProxy || '').trim()
    const targetUrl = proxyPrefix
      ? proxyPrefix.includes('?')
        ? `${proxyPrefix}${encodeURIComponent(directUrl)}`
        : `${proxyPrefix.replace(/\/$/, '')}/${directUrl}`
      : directUrl

    const envelope = envelopeBuilder ? envelopeBuilder(body) : this.serviceEnvelope(body)

    try {
      return await ky.post(targetUrl, {
        json: envelope,
        timeout: REQUEST_TIMEOUT,
        headers: { 'Accept-Encoding': 'gzip, deflate, br', Accept: 'application/json, text/plain, */*' },
        retry: { limit: 2, methods: ['post'], statusCodes: [408, 500, 502, 503, 504] }
      }).json()
    } catch (err: any) {
      if (err.name === 'TimeoutError') throw new Error('Request timeout')
      if (err.name === 'TypeError' || String(err.message || '').includes('Failed to fetch')) {
        throw new Error(`Failed to fetch from ${cleanHost}. Ensure CORS extension is active or configure CORS Proxy in Settings.`)
      }
      throw err
    }
  }

  async warmupConnection(): Promise<void> {
    this.ehrPost(EHR_ENDPOINTS.claimRemarks, { encounterId: 0 }).catch(() => {})
  }

  async searchEncounter(encounterNo: string): Promise<any> {
    const candidate = encounterNo.toUpperCase().trim()
    const matchSuffix = (candidate.match(/(\d+)\s*$/) || [])[1] || candidate
    const yearMatch = (candidate.match(/\b(20\d{2})\b/) || [])[1]
    const year = yearMatch ? Number(yearMatch) : 0

    const fromDate = year > 0 ? `${year}-01-01` : dayjs().subtract(5, 'year').format('YYYY-MM-DD')
    const toDate = year > 0 ? `${year + 1}-01-05` : dayjs().add(1, 'year').format('YYYY-MM-DD')

    const branchMatch = candidate.match(/^(MK|BJ)/i)
    const primarySiteIds = branchMatch ? (branchMatch[1].toUpperCase() === 'MK' ? [10] : [11, 9]) : [this.settings.siteId]
    const allSiteIds = [10, 11, 9]

    const querySites = async (siteIds: number[], encs: string[], from: string, to: string) => {
      const map = new Map<string, any>()
      // Nursing Channel
      const nursingTasks = siteIds.flatMap((sid) =>
        encs.map((enc) =>
          this.ehrPost(EHR_ENDPOINTS.nursingSearch, {
            customerid: this.settings.customerId,
            siteid: sid,
            firstname: '',
            mpi: '',
            date_of_birth: null,
            age: null,
            sex_id: null,
            no_of_rec: 200,
            offset: 0,
            physicianid: null,
            is_nursing: '1',
            appointmentfromdate: from,
            appointmenttodate: to,
            appointment_statudid: null,
            lastname: '',
            pat_mpi2: '',
            specialityId: null,
            emiratesId: null,
            type: 2,
            payerTypeId: null,
            payerId: null,
            visitTypeId: null,
            insuranceType: null,
            groupByApntStatus: 1,
            timeOrderBy: 1,
            displayEncounterConfigno: enc,
            ceedStatusId: null
          }).then((r) => ({ sid, rows: r?.body?.Data || [] })).catch(() => ({ sid, rows: [] }))
        )
      )
      const nursingRes = await Promise.all(nursingTasks)
      for (const { sid, rows } of nursingRes) {
        for (const row of rows) {
          const key = String(row.display_encounter_configno || row.encounter_configno || row.encounter_no || row.encounterid || '').toUpperCase()
          if (key && !map.has(key)) { row._site_id = sid; map.set(key, row) }
        }
      }
      if (map.size > 0) return Array.from(map.values())

      // RCM Fallback Channel
      const rcmTasks = siteIds.flatMap((sid) =>
        encs.map((enc) =>
          this.ehrPost(EHR_ENDPOINTS.rcmCasesSearch, {
            no_of_rec: 200,
            offset: 1,
            encStartDate: from.replace(/\//g, '-'),
            encEndDate: to.replace(/\//g, '-'),
            siteId: Number(sid),
            costumerId: this.settings.customerId,
            patName: '',
            physicianId: null,
            status: null,
            encType: null,
            partnerId: null,
            encId: enc,
            receiverId: null,
            authNum: null,
            paymentReference: '',
            invoiceNo: '',
            isWriteOff: null,
            isRaQueue: 1,
            claimIdPayer: '',
            claimStatus: null,
            claimSubmissionLimits: 0,
            isEditDateRequired: 0,
            reqSubmissionFileName: null,
            mpi2: '',
            isPaperClaim: null,
            appointmentStatusId: null,
            subFromDate: null,
            subEndDate: null,
            responseFileName: null,
            isTopupCard: 0,
            isClaimResubLimitExceeded: 0,
            resubmitonStatus: null,
            RaTransFromDate: null,
            RaTransToDate: null,
            isFromReadyToClaim: 0
          }).then((r) => ({ sid, rows: r?.body?.Data || [] })).catch(() => ({ sid, rows: [] }))
        )
      )
      const rcmRes = await Promise.all(rcmTasks)
      for (const { sid, rows } of rcmRes) {
        for (const row of rows) {
          const key = String(row.display_encounter_configno || row.encounter_configno || row.encounter_no || row.encounterid || '').toUpperCase()
          if (key && !map.has(key)) { row._site_id = sid; map.set(key, row) }
        }
      }
      return Array.from(map.values())
    }

    let matches = await querySites(primarySiteIds, [candidate], fromDate, toDate)
    const remainingSites = allSiteIds.filter((s) => !primarySiteIds.includes(s))
    if (matches.length === 0 && remainingSites.length > 0) {
      matches = await querySites(remainingSites, [candidate], fromDate, toDate)
    }
    if (matches.length === 0 && year > 0) {
      const prevYear = year - 1
      const prevCand = candidate.replace(new RegExp(`/${year}/`, 'i'), `/${prevYear}/`)
      matches = await querySites(allSiteIds, [prevCand], `${prevYear}-01-01`, `${prevYear + 1}-01-05`)
    }

    if (matches.length === 0) throw new Error(`No encounters matching "${encounterNo}" found`)

    const selected = matches.find((r) => {
      const c = String(r.display_encounter_configno || r.encounter_configno || r.encounter_no || '').toUpperCase()
      return c === candidate || c.endsWith(matchSuffix)
    }) || matches[0]

    selected._site_id = selected._site_id || primarySiteIds[0]
    return { selected, matches }
  }

  async loadFastEncounterBundle(selectedRow: any): Promise<any> {
    const patientId = Number(selectedRow.patient_id || selectedRow.patientid || selectedRow.patint_id || selectedRow.patientId || 0)
    const encounterId = Number(selectedRow.encounterid || selectedRow.encounter_id || selectedRow.enc_id || selectedRow.encounterId || 0)
    const siteId = Number(selectedRow._site_id || selectedRow.siteid || this.settings.siteId)

    const encDate = selectedRow.apnt_time || selectedRow.app_date_time || selectedRow.enc_date
    const fromDate = encDate ? dayjs(encDate).subtract(24, 'month').format('YYYY-MM-DD') : dayjs().subtract(24, 'month').format('YYYY-MM-DD')
    const toDate = dayjs().format('YYYY-MM-DD')

    const safeFetch = (endpoint: string, body: any, customEnv?: any) =>
      this.ehrPost(endpoint, body, customEnv).catch((err) => { console.error(`[EhrService] ${endpoint} error:`, err); return null })

    const [
      attachmentsRes, visitRes, diseaseRes, activityRes, historyRes, insuranceRes, claimRemarksRes, resubFilesRes, resubReasonsRes
    ] = await Promise.all([
      safeFetch(EHR_ENDPOINTS.uploadedImages, { type: 4, reportFromDate: fromDate, reportToDate: toDate, encounterId, chargeMasterType: null }),
      safeFetch(EHR_ENDPOINTS.allEncounters, { patientId, siteId, fromDate, toDate }),
      safeFetch(EHR_ENDPOINTS.diseaseget, { encId: encounterId, userId: 0 }, (b: any) => ({ header: { userId: 0, roleId: 2 }, body: b })),
      safeFetch(EHR_ENDPOINTS.authorizationDetails, { encounterId, siteId, patientId, schemaId: 4, isWriteOff: null, isClaimTopupTab: 0 }),
      safeFetch(EHR_ENDPOINTS.remittanceHistory, { isHistoric: 1, siteId, idPayer: null, encounterId, fileId: null, isTopupEnc: 0 }),
      safeFetch(EHR_ENDPOINTS.insuranceDetails, { patientId, apntId: null, siteId, customerId: this.settings.customerId, encounterId, isDiscard: 0, hasTopUpCard: 0, primaryInsPolicyId: null }),
      safeFetch(EHR_ENDPOINTS.claimRemarks, { encounterId }),
      safeFetch(EHR_ENDPOINTS.resubmissionFiles, { siteId, encounterId }),
      safeFetch(EHR_ENDPOINTS.resubmissionReasons, { encounterId, patientId, schemaId: 2, isTopUpCard: 0 })
    ])

    const insuranceItems = insuranceRes?.body?.Data || []
    const matchedIns = insuranceItems.find((i: any) => i.is_current === 1 || i.is_current_insurence === 1) || insuranceItems[0]
    if (matchedIns) {
      const cardNo = matchedIns.insurance_policy_id || matchedIns.tpa_policy_id || matchedIns.card_no
      if (cardNo) { selectedRow.card_no = cardNo; selectedRow.insurance_policy_id = cardNo }
      if (matchedIns.ins_plan) selectedRow.network_name = matchedIns.ins_plan
      if (matchedIns.tpa_company_name) selectedRow.receiver_name = matchedIns.tpa_company_name
      if (matchedIns.insurance_company_name) selectedRow.payer_name = matchedIns.insurance_company_name
    }

    const cleanHost = this.settings.hostUrl.replace(/\/$/, '')
    const attachments = (attachmentsRes?.body?.Data || []).map((item: any) => ({
      reportedDate: item.reported_date || item.created_on || '-',
      name: item.file_name || `attachment-${item.attachment_id}.pdf`,
      category: item.charge_master_type || 'Lab',
      downloadUrl: `${cleanHost}/SCMS/web/app.php/lab/0/batch/null/type/4/encounter/${encounterId}/result/0/attachment/${item.attachment_id}/download`
    }))

    return {
      selected: selectedRow,
      summaryHtml: null,
      diagnoses: (diseaseRes?.body?.Data || []).map((d: any) => ({
        code: d.icd_code || '', desc: d.description || d.desc_name || '',
        type: d.is_primary === 'Yes' || Number(d.is_primary) === 1 ? 'Primary' : 'Secondary'
      })),
      activities: activityRes?.body?.Data || [],
      remittanceHistory: historyRes?.body?.Data || [],
      remarks: claimRemarksRes?.body?.Data || [],
      claimRemarks: claimRemarksRes?.body?.Data || [],
      resubmissionFiles: resubFilesRes?.body?.Data || [],
      resubmissionReasons: resubReasonsRes?.body?.Data || [],
      visits: visitRes?.body?.Data || [],
      attachments
    }
  }

  async loadSummaryPreview(selectedRow: any): Promise<string> {
    try {
      const res = await this.ehrPost(EHR_ENDPOINTS.summaryPreview, {
        patientId: Number(selectedRow.patient_id),
        encounterId: Number(selectedRow.encounterid),
        createdBy: this.settings.userId,
        siteId: Number(selectedRow._site_id || selectedRow.siteid || this.settings.siteId)
      })
      return res?.body?.Data?.[0]?.print_summary || '<div style="padding:16px;">Clinical summary not found.</div>'
    } catch {
      return '<div style="padding:16px;">Error loading clinical summary.</div>'
    }
  }

  async loadEncounterBundle(selectedRow: any): Promise<any> {
    const fastBundle = await this.loadFastEncounterBundle(selectedRow)
    // Non-blocking background resolution for heavy HTML summary preview
    this.loadSummaryPreview(selectedRow).then((summaryHtml) => {
      fastBundle.summaryHtml = summaryHtml
    }).catch(() => {
      fastBundle.summaryHtml = '<div style="padding:16px;">Error loading clinical summary.</div>'
    })
    return fastBundle
  }

  getSummaryPdfUrl(selectedRow: any): string {
    const cleanHost = this.settings.hostUrl.replace(/\/$/, '')
    return `${cleanHost}/SCMS/web/app.php/${EHR_ENDPOINTS.pdfSummaryPath(
      Number(selectedRow.patient_id),
      Number(selectedRow._site_id || selectedRow.siteid || this.settings.siteId),
      Number(selectedRow.encounterid),
      this.settings.userId
    )}`
  }

  async getPdfBlobUrl(selectedRow: any): Promise<string> {
    const url = this.getSummaryPdfUrl(selectedRow)
    const res = await ky.get(url, { timeout: REQUEST_TIMEOUT })
    if (!res.ok) throw new Error(`PDF fetch failed: ${res.status}`)
    const blob = new Blob([await res.arrayBuffer()], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  }

  async fetchVisits(selectedRow: any, fromDate: string, toDate: string): Promise<any[]> {
    if (!selectedRow) return []
    const res = await this.ehrPost(EHR_ENDPOINTS.allEncounters, {
      patientId: Number(selectedRow.patient_id),
      siteId: Number(selectedRow._site_id || selectedRow.siteid || this.settings.siteId),
      fromDate, toDate
    }).catch(() => null)
    return res?.body?.Data || []
  }

  async fetchAttachments(selectedRow: any, fromDate: string, toDate: string): Promise<any[]> {
    if (!selectedRow) return []
    const encounterId = Number(selectedRow.encounterid)
    const res = await this.ehrPost(EHR_ENDPOINTS.uploadedImages, {
      type: 4, reportFromDate: fromDate, reportToDate: toDate, encounterId, chargeMasterType: null
    }).catch(() => null)

    const cleanHost = this.settings.hostUrl.replace(/\/$/, '')
    return (res?.body?.Data || []).map((item: any) => ({
      reportedDate: item.reported_date || item.created_on || '-',
      name: item.file_name || `attachment-${item.attachment_id}.pdf`,
      category: item.charge_master_type || 'Lab',
      downloadUrl: `${cleanHost}/SCMS/web/app.php/lab/0/batch/null/type/4/encounter/${encounterId}/result/0/attachment/${item.attachment_id}/download`
    }))
  }

  async saveResubmissionReason(selectedRow: any, reqBody: any): Promise<any> {
    const encounterId = Number(selectedRow.encounterid || selectedRow.encounter_id || selectedRow.enc_id || selectedRow.encounterId || 0)
    const patientId = Number(selectedRow.patient_id || selectedRow.patientid || 0)
    const receiverId = Number(selectedRow.receiver_id || selectedRow.payer_id || 0)
    const appointmentId = Number(selectedRow.appointment_id || selectedRow.apnt_id || 0) || null

    const body = {
      resubmitReasonId: Number(reqBody.resubmitReasonId || 0),
      createdBy: this.settings.userId || 1089,
      encounterId,
      appointmentId,
      patientId,
      reasonDesc: String(reqBody.comments || '').trim(),
      reasonTxn: 1,
      reasonType: Number(reqBody.resubmitType || 1),
      correctionId: Number(reqBody.resubmitType || 1),
      correction_id: Number(reqBody.resubmitType || 1),
      isActive: 1,
      schemaId: 2,
      isTopUpCard: 0,
      payerId: receiverId,
      fileId: Number(reqBody.raFileId) || null,
      attachment: reqBody.attachmentBase64 || ''
    }

    const res = await this.ehrPost(EHR_ENDPOINTS.addResubmissionReason, body)
    if (!res?.body?.Success && res?.body?.status_value !== 1) {
      throw new Error(res?.body?.Error || res?.body?.message || 'Failed to save resubmission reason')
    }
    return res.body
  }

  async saveRaRemarks(selectedRow: any, reqBody: any): Promise<any> {
    const encounterId = Number(selectedRow.encounterid || selectedRow.encounter_id || selectedRow.enc_id || selectedRow.encounterId || 0)
    const patientId = Number(selectedRow.patient_id || selectedRow.patientid || 0)
    const siteId = Number(selectedRow._site_id || selectedRow.siteid || this.settings.siteId)

    const body = {
      encounterId,
      patientId,
      siteId,
      createdBy: this.settings.userId || 1089,
      tabStatusId: reqBody.tabStatusId || 1,
      writeOffObj: reqBody.writeOffObj || [],
      resubmissionObj: reqBody.resubmissionObj || [],
      activityCloseObj: reqBody.activityCloseObj || [],
      reSubmissionPendingAmount: reqBody.reSubmissionPendingAmount || '0.00',
      writeOffPendingAmount: reqBody.writeOffPendingAmount || '0.00',
      isTopupCardTab: 0,
      remarksRA: reqBody.remarks || '',
      remarks_ra: reqBody.remarks || '',
      remarksWriteOff: reqBody.remarksWriteOff || '',
      remarks_write_off: reqBody.remarksWriteOff || '',
      remarksReSub: reqBody.remarksReSub || '',
      remarks_resub: reqBody.remarksReSub || '',
      remarksPatPayAR: reqBody.remarksPatPayAR || '',
      remarks_pat_pay_ar: reqBody.remarksPatPayAR || ''
    }

    const res = await this.ehrPost(EHR_ENDPOINTS.saveClaimRemarks, body)
    if (!res?.body?.Success && res?.body?.status_value !== 1) {
      throw new Error(res?.body?.Error || res?.body?.message || 'Failed to save RA remarks')
    }
    return res.body
  }

  async postWriteOff(selectedRow: any, reqBody: any): Promise<any> {
    const encounterId = Number(selectedRow.encounterid || selectedRow.encounter_id || selectedRow.enc_id || selectedRow.encounterId || 0)
    const patientId = Number(selectedRow.patient_id || selectedRow.patientid || 0)
    const siteId = Number(selectedRow._site_id || selectedRow.siteid || this.settings.siteId)
    const receiverId = Number(selectedRow.receiver_id || selectedRow.payer_id || 0)

    const updateBody = {
      encounterId,
      patientId,
      siteId,
      createdBy: this.settings.userId || 1089,
      tabStatusId: 2,
      writeOffObj: reqBody.writeOffObj || [],
      resubmissionObj: reqBody.resubmissionObj || [],
      activityCloseObj: reqBody.activityCloseObj || [],
      reSubmissionPendingAmount: reqBody.reSubmissionPendingAmount || '0.00',
      writeOffPendingAmount: reqBody.writeOffPendingAmount || '0.00',
      isTopupCardTab: 0,
      remarksRA: reqBody.remarksRA || '',
      remarks_ra: reqBody.remarksRA || '',
      remarksWriteOff: reqBody.remarks || '',
      remarks_write_off: reqBody.remarks || '',
      remarksReSub: reqBody.remarksReSub || '',
      remarks_resub: reqBody.remarksReSub || '',
      remarksPatPayAR: reqBody.remarksPatPayAR || '',
      remarks_pat_pay_ar: reqBody.remarksPatPayAR || ''
    }

    const res1 = await this.ehrPost(EHR_ENDPOINTS.saveClaimRemarks, updateBody)
    if (!res1?.body?.Success && res1?.body?.status_value !== 1) {
      throw new Error(res1?.body?.Error || res1?.body?.message || 'Phase 1: Failed to update write-off remarks')
    }

    if (reqBody.writeOffItems && reqBody.writeOffItems.length > 0) {
      const ledgerBody = {
        type: 2,
        siteId,
        createdBy: this.settings.userId || 1089,
        items: reqBody.writeOffItems,
        reason: reqBody.remarks || 'Write Off',
        writeAmount: reqBody.writeAmount || 0,
        recType: 2,
        billId: encounterId,
        receiverId,
        writeOffOn: dayjs().format('DD-MM-YYYY')
      }

      const res2 = await this.ehrPost(EHR_ENDPOINTS.writeOffLedger, ledgerBody)
      if (!res2?.body?.Success && res2?.body?.status_value !== 1) {
        throw new Error(res2?.body?.Error || res2?.body?.message || 'Phase 2: Financial ledger write-off posting failed')
      }
    }

    return { success: true }
  }
}

export const ehrService = new EhrService()
