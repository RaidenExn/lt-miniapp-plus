import { useState, useEffect, useMemo } from 'react'
import { Card, Group, Text, Tooltip, Button, ScrollArea, Stack, Box, Skeleton } from '@mantine/core'
import { ExternalLink, FileText } from 'lucide-react'
import { AppCard } from './common/AppCard'
import { ehrService } from '../services/EhrService'

interface SummaryItem { label?: string; content: string }
interface SummaryCategory { title: string; fields: SummaryItem[] }

function parseEmrSummaryHtml(htmlString: string) {
  if (!htmlString) return { metadata: [], categories: [] }
  try {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html')
    const metadata: { label: string; value: string }[] = []
    const tables = Array.from(doc.querySelectorAll('table'))

    for (const tbl of tables) {
      if (tbl.textContent?.includes('Patient Name') || tbl.textContent?.includes('MPI')) {
        const tds = Array.from(tbl.querySelectorAll('td'))
        for (let i = 0; i < tds.length; i++) {
          const bTag = tds[i].querySelector('b, strong')?.textContent?.trim()
          if (bTag && i + 1 < tds.length) {
            const cleanLabel = bTag.replace(/:$/, '').trim()
            let val = tds[i + 1].textContent?.trim() || ''
            if (val.startsWith(':')) val = val.substring(1).trim()
            if (!cleanLabel.toUpperCase().includes('PRINTED')) {
              metadata.push({ label: cleanLabel, value: val.replace(/^&nbsp;/g, '').trim() })
            }
            i++
          }
        }
        break
      }
    }

    let doctorSignature = ''
    for (let i = tables.length - 1; i >= 0; i--) {
      const tText = tables[i].textContent?.trim() || ''
      if (tText.includes('Signature') || tText.includes('Dr.') || tText.includes('Doctor')) {
        doctorSignature = (tables[i].textContent || '').split('\n').map((s) => s.trim()).filter(Boolean).join('\n')
        break
      }
    }

    const categories: SummaryCategory[] = []
    const catTables = tables.filter((t) => t.getAttribute('bgcolor') || t.getAttribute('style')?.includes('background') || t.textContent?.includes('Notes'))

    if (catTables.length > 0) {
      const bodyHtml = doc.body.innerHTML
      const matches: { title: string; index: number }[] = []
      const reg = /<table[^>]*bgcolor=["']?[^"'>]+["']?[^>]*>[\s\S]*?<b>\s*([^<]+)\s*<\/b>[\s\S]*?<\/table>/gi
      let m: RegExpExecArray | null
      while ((m = reg.exec(bodyHtml)) !== null) {
        matches.push({ title: m[1].replace(/&nbsp;/g, ' ').trim(), index: m.index + m[0].length })
      }

      for (let idx = 0; idx < matches.length; idx++) {
        const cur = matches[idx]
        const nextIdx = idx + 1 < matches.length ? matches[idx + 1].index : bodyHtml.length
        const block = bodyHtml.substring(cur.index, nextIdx)
        const fields: SummaryItem[] = []
        const parts = block.split(/<b>\s*([^:<]+?)\s*:\s*<\/b>/gi)

        if (parts.length > 1) {
          for (let fIdx = 1; fIdx < parts.length; fIdx += 2) {
            const clean = new DOMParser().parseFromString(parts[fIdx + 1] || '', 'text/html').body.textContent?.trim() || ''
            if (clean) fields.push({ label: parts[fIdx].trim(), content: clean })
          }
        } else {
          const clean = new DOMParser().parseFromString(block, 'text/html').body.textContent?.trim() || ''
          if (clean) fields.push({ content: clean })
        }
        if (fields.length > 0) categories.push({ title: cur.title, fields })
      }
    }

    return { metadata, categories, doctorSignature, rawFallbackHtml: categories.length === 0 ? htmlString : undefined }
  } catch {
    return { metadata: [], categories: [], rawFallbackHtml: htmlString }
  }
}

interface ClinicalSummaryProps {
  encounterData: { summaryHtml?: string; selected: any } | null
  getSummaryPdfUrl: (selected: any) => string
  openPdfInNewTab: (url: string) => void
}

export function ClinicalSummary({ encounterData, getSummaryPdfUrl, openPdfInNewTab }: ClinicalSummaryProps) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [summaryHtml, setSummaryHtml] = useState<string | null>(encounterData?.summaryHtml || null)

  useEffect(() => {
    if (encounterData?.summaryHtml) {
      setSummaryHtml(encounterData.summaryHtml)
      return
    }
    let isMounted = true
    if (encounterData?.selected) {
      ehrService.loadSummaryPreview(encounterData.selected)
        .then((html) => { if (isMounted) setSummaryHtml(html) })
        .catch(() => { if (isMounted) setSummaryHtml('<div style="padding:16px;">Error loading clinical summary.</div>') })
    }
    return () => { isMounted = false }
  }, [encounterData?.selected, encounterData?.summaryHtml])

  const parsed = useMemo(() => parseEmrSummaryHtml(summaryHtml || ''), [summaryHtml])

  if (!encounterData) return null

  const handleOpenPdf = () => {
    if (!encounterData?.selected) return
    setLoadingPdf(true)
    try {
      const url = getSummaryPdfUrl(encounterData.selected)
      if (url) openPdfInNewTab(url)
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <AppCard style={{ overflow: 'hidden' }}>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs"><FileText size={14} color="orange" /><Text fz="xs" fw={800}>CLINICAL SUMMARY</Text></Group>
          <Tooltip label="Open direct printable PDF summary from remote EHR" openDelay={0} closeDelay={0} withinPortal zIndex={3000}>
            <Button size="xxs" variant="outline" color="orange" loading={loadingPdf} leftSection={<ExternalLink size={11} />} onClick={handleOpenPdf} fz={10} h={22} px={8}>Open PDF</Button>
          </Tooltip>
        </Group>
      </Card.Section>

      <Box flex={1} style={{ overflow: 'hidden', minHeight: 0 }}>
        {!summaryHtml ? (
          <ScrollArea h="100%" type="auto">
            <Stack gap="md" p="md">
              <Group gap="md"><Skeleton h={18} w={160} /><Skeleton h={18} w={130} /></Group>
              <Stack gap="xs" pl="xs"><Skeleton h={14} w="28%" /><Skeleton h={12} w="88%" /></Stack>
            </Stack>
          </ScrollArea>
        ) : (
          <ScrollArea h="100%" type="auto">
            <Stack gap="md" p="md">
              {parsed.metadata.length > 0 && (
                <Group gap="md" align="flex-start" wrap="wrap">
                  {parsed.metadata.map((item, idx) => (
                    <Box key={idx} style={{ flex: '1 1 120px', minWidth: '110px' }}>
                      <Text size="8px" c="dimmed" fw={700} tt="uppercase">{item.label}</Text>
                      <Text fz="xs" fw={700}>{item.value || '-'}</Text>
                    </Box>
                  ))}
                </Group>
              )}

              {parsed.categories.length > 0 ? (
                parsed.categories.map((cat, catIdx) => (
                  <Box key={catIdx}>
                    <Group gap="xs" align="center" mb={6}>
                      <Box style={{ width: '3px', height: '14px', backgroundColor: '#f59f00', borderRadius: '2px' }} />
                      <Text fz="xs" fw={800} tt="uppercase" c="orange">{cat.title}</Text>
                    </Group>
                    <Stack gap="xs" pl="sm">
                      {cat.fields.map((field, fieldIdx) => (
                        <Box key={fieldIdx}>
                          {field.label && <Text fz={10} fw={700} c="dimmed" tt="uppercase">{field.label}</Text>}
                          <Text fz="xs" style={{ whiteSpace: 'pre-wrap' }}>{field.content}</Text>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))
              ) : parsed.rawFallbackHtml ? (
                <Box style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: parsed.rawFallbackHtml }} />
              ) : <Text fz="xs" c="dimmed" ta="center">No clinical summary recorded.</Text>}
            </Stack>
          </ScrollArea>
        )}
      </Box>
    </AppCard>
  )
}
