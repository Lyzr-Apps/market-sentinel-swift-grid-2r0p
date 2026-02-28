'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion'
import {
  FiTrendingUp, FiTrendingDown, FiBarChart2, FiGlobe,
  FiFileText, FiDownload, FiActivity, FiDollarSign,
  FiAlertCircle, FiRefreshCw, FiCheckCircle, FiCalendar
} from 'react-icons/fi'

interface ReportData {
  report_date?: string
  trading_day_relevance?: string
  market_sentiment?: {
    overall?: string
    confidence?: string
    summary?: string
  }
  sector_impacts?: Array<{
    sector?: string
    impact?: string
    drivers?: string
    actionable_insight?: string
  }>
  global_influences?: Array<{
    factor?: string
    impact_on_india?: string
    affected_sectors?: string
  }>
  regulatory_highlights?: Array<{
    update?: string
    market_impact?: string
  }>
  key_takeaways?: string[]
  market_data_snapshot?: {
    sensex?: string
    nifty?: string
    usd_inr?: string
    crude_oil?: string
    gold?: string
    fii_net?: string
    dii_net?: string
  }
}

interface DashboardProps {
  reportData: ReportData | null
  pdfUrl: string
  loading: boolean
  error: string | null
  onGenerate: () => void
  sampleMode: boolean
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getSentimentStyle(sentiment: string) {
  const s = (sentiment ?? '').toLowerCase()
  if (s.includes('bullish')) return { bg: 'bg-green-50 border-green-200', text: 'text-green-800', badge: 'bg-green-600 text-white', icon: <FiTrendingUp className="w-5 h-5" /> }
  if (s.includes('bearish')) return { bg: 'bg-red-50 border-red-200', text: 'text-red-800', badge: 'bg-red-600 text-white', icon: <FiTrendingDown className="w-5 h-5" /> }
  return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', badge: 'bg-amber-600 text-white', icon: <FiActivity className="w-5 h-5" /> }
}

function getImpactColor(impact: string) {
  const i = (impact ?? '').toLowerCase()
  if (i.includes('positive')) return 'text-green-700 bg-green-50 border-green-200'
  if (i.includes('negative')) return 'text-red-700 bg-red-50 border-red-200'
  return 'text-amber-700 bg-amber-50 border-amber-200'
}

function MarketDataCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-card border border-border/50 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-base font-semibold text-foreground">{value || '--'}</p>
    </div>
  )
}

export default function Dashboard({ reportData, pdfUrl, loading, error, onGenerate, sampleMode }: DashboardProps) {
  const [expandedSections] = useState<string[]>([])
  const data = reportData
  const sentiment = data?.market_sentiment
  const sentimentStyle = getSentimentStyle(sentiment?.overall ?? '')
  const snapshot = data?.market_data_snapshot

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <FiRefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Analyzing financial news and market data...</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => <Skeleton key={n} className="h-20" />)}
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!data && !sampleMode) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card className="shadow-md">
          <CardContent className="py-20 text-center">
            <FiBarChart2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">No Report Generated Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Click the button below to generate today's comprehensive Indian market financial news analysis report.
            </p>
            <Button onClick={onGenerate} size="lg" className="gap-2 shadow-md">
              <FiFileText className="w-5 h-5" />
              Generate Today's Report
            </Button>
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-md mx-auto">
                <FiAlertCircle className="w-4 h-4 inline-block mr-2" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-2rem)]">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Top Banner */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-foreground tracking-wide">
              Market Report {data?.report_date ? `- ${data.report_date}` : ''}
            </h2>
            {data?.trading_day_relevance && (
              <p className="text-sm text-muted-foreground mt-1">{data.trading_day_relevance}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <FiDownload className="w-4 h-4" />
                  Download PDF
                </Button>
              </a>
            )}
            <Button onClick={onGenerate} disabled={loading} className="gap-2">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <FiAlertCircle className="w-4 h-4 inline-block mr-2" />
            {error}
          </div>
        )}

        {/* Market Data Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <MarketDataCard label="Sensex" value={snapshot?.sensex ?? '--'} icon={<FiTrendingUp className="w-3.5 h-3.5" />} />
          <MarketDataCard label="Nifty 50" value={snapshot?.nifty ?? '--'} icon={<FiTrendingUp className="w-3.5 h-3.5" />} />
          <MarketDataCard label="USD/INR" value={snapshot?.usd_inr ?? '--'} icon={<FiDollarSign className="w-3.5 h-3.5" />} />
          <MarketDataCard label="Crude Oil" value={snapshot?.crude_oil ?? '--'} icon={<FiActivity className="w-3.5 h-3.5" />} />
          <MarketDataCard label="Gold" value={snapshot?.gold ?? '--'} icon={<FiDollarSign className="w-3.5 h-3.5" />} />
          <MarketDataCard label="FII Net" value={snapshot?.fii_net ?? '--'} icon={<FiBarChart2 className="w-3.5 h-3.5" />} />
          <MarketDataCard label="DII Net" value={snapshot?.dii_net ?? '--'} icon={<FiBarChart2 className="w-3.5 h-3.5" />} />
        </div>

        {/* Market Sentiment */}
        {sentiment && (
          <Card className={`shadow-md border ${sentimentStyle.bg}`}>
            <CardContent className="py-5 px-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${sentimentStyle.badge}`}>
                  {sentimentStyle.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-serif text-lg font-semibold text-foreground">Market Sentiment</h3>
                    <Badge className={sentimentStyle.badge}>{sentiment.overall ?? 'N/A'}</Badge>
                    {sentiment.confidence && (
                      <span className="text-sm text-muted-foreground">Confidence: {sentiment.confidence}</span>
                    )}
                  </div>
                  {sentiment.summary && (
                    <div className="text-sm text-foreground/80">{renderMarkdown(sentiment.summary)}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sector Impacts */}
        {Array.isArray(data?.sector_impacts) && data.sector_impacts.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <FiBarChart2 className="w-5 h-5 text-primary" />
                Sector-wise Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={expandedSections}>
                {data.sector_impacts.map((sector, idx) => (
                  <AccordionItem key={idx} value={`sector-${idx}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <Badge variant="outline" className={getImpactColor(sector.impact ?? '')}>
                          {(sector.impact ?? 'Neutral').charAt(0).toUpperCase() + (sector.impact ?? 'neutral').slice(1)}
                        </Badge>
                        <span className="font-serif font-semibold">{sector.sector ?? 'Unknown Sector'}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-2 pt-2">
                        {sector.drivers && (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Drivers</p>
                            <div className="text-sm text-foreground/80">{renderMarkdown(sector.drivers)}</div>
                          </div>
                        )}
                        {sector.actionable_insight && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">Actionable Insight</p>
                            <div className="text-sm text-foreground/80">{renderMarkdown(sector.actionable_insight)}</div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Global Influences */}
          {Array.isArray(data?.global_influences) && data.global_influences.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                  <FiGlobe className="w-5 h-5 text-primary" />
                  Global Market Influences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.global_influences.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/50 bg-card">
                    <p className="font-semibold text-sm mb-1">{item.factor ?? 'Unknown Factor'}</p>
                    {item.impact_on_india && (
                      <p className="text-sm text-foreground/70 mb-1">
                        <span className="font-medium text-foreground/80">India Impact:</span> {item.impact_on_india}
                      </p>
                    )}
                    {item.affected_sectors && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Sectors:</span> {item.affected_sectors}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Regulatory Highlights */}
          {Array.isArray(data?.regulatory_highlights) && data.regulatory_highlights.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                  <FiFileText className="w-5 h-5 text-primary" />
                  Regulatory and Policy Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.regulatory_highlights.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/50 bg-card">
                    {item.update && (
                      <p className="font-semibold text-sm mb-1">{item.update}</p>
                    )}
                    {item.market_impact && (
                      <p className="text-sm text-foreground/70">
                        <span className="font-medium text-foreground/80">Market Impact:</span> {item.market_impact}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Key Takeaways */}
        {Array.isArray(data?.key_takeaways) && data.key_takeaways.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-lg">
                <FiCheckCircle className="w-5 h-5 text-primary" />
                Key Takeaways
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {data.key_takeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-foreground/80 leading-relaxed pt-0.5">{takeaway}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
