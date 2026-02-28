'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  FiCalendar, FiTrendingUp, FiTrendingDown, FiActivity,
  FiArrowUp, FiTrash2, FiClock, FiBarChart2, FiTarget,
  FiGlobe, FiShield, FiChevronRight, FiLayers
} from 'react-icons/fi'

export interface StoredReport {
  date: string
  data: Record<string, any>
  pdfUrl?: string
  generatedAt: string
}

interface ReportHistoryProps {
  onViewReport: (report: StoredReport) => void
}

function getSentimentColor(sentiment: string): string {
  const s = (sentiment ?? '').toLowerCase()
  if (s.includes('bullish')) return 'bg-green-100 text-green-800 border-green-300'
  if (s.includes('bearish')) return 'bg-red-100 text-red-800 border-red-300'
  return 'bg-amber-100 text-amber-800 border-amber-300'
}

function getSentimentIcon(sentiment: string) {
  const s = (sentiment ?? '').toLowerCase()
  if (s.includes('bullish')) return <FiTrendingUp className="w-3.5 h-3.5" />
  if (s.includes('bearish')) return <FiTrendingDown className="w-3.5 h-3.5" />
  return <FiActivity className="w-3.5 h-3.5" />
}

function getImpactBadgeStyle(impact: string) {
  const i = (impact ?? '').toLowerCase()
  if (i.includes('positive')) return 'bg-green-50 text-green-700 border-green-200'
  if (i.includes('negative')) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function SentimentTrendChart({ reports }: { reports: StoredReport[] }) {
  if (reports.length < 2) return null

  const recent = reports.slice(0, 10).reverse()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FiActivity className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Sentiment Timeline</span>
        <span className="text-xs text-muted-foreground ml-auto">Last {recent.length} reports</span>
      </div>
      <div className="flex items-end gap-1 h-12">
        {recent.map((r, idx) => {
          const s = (r.data?.market_sentiment?.overall ?? '').toLowerCase()
          let color = 'bg-amber-400'
          let height = '50%'
          if (s.includes('bullish')) { color = 'bg-green-500'; height = '100%' }
          else if (s.includes('bearish')) { color = 'bg-red-500'; height = '30%' }
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm overflow-hidden bg-muted/50" style={{ height: '48px' }}>
                <div
                  className={`w-full ${color} rounded-t-sm bar-animate transition-all`}
                  style={{ height, marginTop: `calc(48px - ${height})` }}
                  title={`${r.date}: ${r.data?.market_sentiment?.overall ?? 'N/A'}`}
                />
              </div>
              <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                {r.date.split('-').slice(1).join('/')}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Bullish</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Neutral</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Bearish</span>
      </div>
    </div>
  )
}

export default function ReportHistory({ onViewReport }: ReportHistoryProps) {
  const [reports, setReports] = useState<StoredReport[]>([])

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    const storedReports: StoredReport[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('report_')) {
        try {
          const raw = localStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw) as StoredReport
            storedReports.push(parsed)
          }
        } catch {
          // Skip invalid entries
        }
      }
    }
    storedReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setReports(storedReports)
  }

  const clearHistory = () => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('report_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    setReports([])
  }

  const sentimentSummary = useMemo(() => {
    let bullish = 0
    let bearish = 0
    let neutral = 0
    reports.forEach((r) => {
      const s = (r.data?.market_sentiment?.overall ?? '').toLowerCase()
      if (s.includes('bullish')) bullish++
      else if (s.includes('bearish')) bearish++
      else neutral++
    })
    return { bullish, bearish, neutral, total: reports.length }
  }, [reports])

  const avgSectors = useMemo(() => {
    if (reports.length === 0) return 0
    const total = reports.reduce((sum, r) => {
      return sum + (Array.isArray(r.data?.sector_impacts) ? r.data.sector_impacts.length : 0)
    }, 0)
    return Math.round(total / reports.length)
  }, [reports])

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground tracking-wide">Report History</h2>
          <p className="text-sm text-muted-foreground mt-1">Browse and compare past daily market analysis reports</p>
        </div>
        {reports.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2">
            <FiTrash2 className="w-4 h-4" />
            Clear History
          </Button>
        )}
      </div>

      {/* Analytics Cards */}
      {reports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{sentimentSummary.total}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Total Reports</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <FiTrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{sentimentSummary.bullish}</p>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Bullish Days</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <FiTrendingDown className="w-5 h-5 text-red-600" />
                <p className="text-2xl font-bold text-red-700">{sentimentSummary.bearish}</p>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Bearish Days</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <FiActivity className="w-5 h-5 text-amber-600" />
                <p className="text-2xl font-bold text-amber-700">{sentimentSummary.neutral}</p>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Neutral Days</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <FiLayers className="w-5 h-5 text-primary" />
                <p className="text-2xl font-bold text-foreground">{avgSectors}</p>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Avg Sectors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sentiment Trend Chart */}
      {reports.length > 1 && (
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <SentimentTrendChart reports={reports} />
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <FiCalendar className="w-8 h-8 text-primary/50" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Generate your first daily market report from the Dashboard. Reports will be stored here for future reference and trend comparison.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-480px)]">
          <div className="space-y-3 pr-4">
            {reports.map((report, idx) => {
              const sentiment = report.data?.market_sentiment?.overall ?? 'N/A'
              const confidence = report.data?.market_sentiment?.confidence ?? ''
              const sectors = Array.isArray(report.data?.sector_impacts) ? report.data.sector_impacts : []
              const topSectors = sectors.slice(0, 4)
              const globalCount = Array.isArray(report.data?.global_influences) ? report.data.global_influences.length : 0
              const regCount = Array.isArray(report.data?.regulatory_highlights) ? report.data.regulatory_highlights.length : 0
              const takeawayCount = Array.isArray(report.data?.key_takeaways) ? report.data.key_takeaways.length : 0
              const snapshot = report.data?.market_data_snapshot

              return (
                <Card
                  key={report.date + idx}
                  className="shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/40 group"
                  onClick={() => onViewReport(report)}
                >
                  <CardContent className="py-4 px-5">
                    {/* Row 1: Date + Sentiment + Confidence */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <FiCalendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-serif font-semibold text-foreground">{report.date}</span>
                        </div>
                        <Separator orientation="vertical" className="h-5" />
                        <Badge variant="outline" className={`${getSentimentColor(sentiment)} flex items-center gap-1`}>
                          {getSentimentIcon(sentiment)}
                          {sentiment}
                        </Badge>
                        {confidence && (
                          <span className="text-xs text-muted-foreground font-medium">{confidence}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                        <span className="text-xs font-medium">View Report</span>
                        <FiChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Row 2: Key market data inline */}
                    {snapshot && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                        {snapshot.sensex && (
                          <span className="flex items-center gap-1">
                            <FiTrendingUp className="w-3 h-3" />
                            <span className="font-medium">Sensex:</span> {snapshot.sensex}
                          </span>
                        )}
                        {snapshot.nifty && (
                          <span className="flex items-center gap-1">
                            <FiTrendingUp className="w-3 h-3" />
                            <span className="font-medium">Nifty:</span> {snapshot.nifty}
                          </span>
                        )}
                        {snapshot.fii_net && (
                          <span className="flex items-center gap-1">
                            <FiBarChart2 className="w-3 h-3" />
                            <span className="font-medium">FII:</span> {snapshot.fii_net}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Row 3: Sector chips + stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {topSectors.map((s: any, sIdx: number) => (
                          <Badge key={sIdx} variant="outline" className={`text-[10px] px-2 py-0.5 ${getImpactBadgeStyle(s?.impact ?? '')}`}>
                            {s?.sector ?? 'Unknown'}
                          </Badge>
                        ))}
                        {sectors.length > 4 && (
                          <span className="text-[10px] text-muted-foreground">+{sectors.length - 4} more</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><FiGlobe className="w-3 h-3" /> {globalCount}</span>
                        <span className="flex items-center gap-1"><FiShield className="w-3 h-3" /> {regCount}</span>
                        <span className="flex items-center gap-1"><FiTarget className="w-3 h-3" /> {takeawayCount}</span>
                      </div>
                    </div>

                    {/* Row 4: Summary preview */}
                    {report.data?.market_sentiment?.summary && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {report.data.market_sentiment.summary.replace(/\*\*/g, '')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
