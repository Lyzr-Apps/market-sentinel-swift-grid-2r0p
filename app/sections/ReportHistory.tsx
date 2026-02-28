'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FiCalendar, FiTrendingUp, FiTrendingDown, FiActivity, FiArrowUp, FiTrash2 } from 'react-icons/fi'

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

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground tracking-wide">Report History</h2>
          <p className="text-sm text-muted-foreground mt-1">Browse past daily market analysis reports</p>
        </div>
        {reports.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <FiTrash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        )}
      </div>

      {reports.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-muted-foreground font-medium">Sentiment Trend:</span>
              <div className="flex items-center gap-1.5">
                <FiArrowUp className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-700">{sentimentSummary.bullish} Bullish</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiTrendingDown className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-700">{sentimentSummary.bearish} Bearish</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiActivity className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-700">{sentimentSummary.neutral} Neutral</span>
              </div>
              <span className="text-muted-foreground ml-auto">{sentimentSummary.total} total reports</span>
            </div>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <FiCalendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold text-foreground mb-2">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Generate your first daily market report from the Dashboard. Reports will be stored here for future reference.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-3 pr-4">
            {reports.map((report, idx) => {
              const sentiment = report.data?.market_sentiment?.overall ?? 'N/A'
              const sectors = Array.isArray(report.data?.sector_impacts)
                ? report.data.sector_impacts.slice(0, 3)
                : []
              const confidence = report.data?.market_sentiment?.confidence ?? ''

              return (
                <Card
                  key={report.date + idx}
                  className="shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40"
                  onClick={() => onViewReport(report)}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FiCalendar className="w-4 h-4" />
                          <span className="font-medium">{report.date}</span>
                        </div>
                        <Separator orientation="vertical" className="h-5" />
                        <Badge variant="outline" className={`${getSentimentColor(sentiment)} flex items-center gap-1`}>
                          {getSentimentIcon(sentiment)}
                          {sentiment}
                        </Badge>
                        {confidence && (
                          <span className="text-xs text-muted-foreground">
                            Confidence: {confidence}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {sectors.map((s: any, sIdx: number) => (
                          <Badge key={sIdx} variant="secondary" className="text-xs">
                            {s?.sector ?? 'Unknown'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {report.data?.market_sentiment?.summary && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {report.data.market_sentiment.summary}
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
