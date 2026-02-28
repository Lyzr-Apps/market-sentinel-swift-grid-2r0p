'use client'

import { useState, useMemo } from 'react'
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
  FiAlertCircle, FiRefreshCw, FiCheckCircle, FiCalendar,
  FiArrowUpRight, FiArrowDownRight, FiTarget, FiLayers,
  FiShield, FiZap, FiInfo, FiHash
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
  if (s.includes('bullish')) return { bg: 'bg-green-50 border-green-200', text: 'text-green-800', badge: 'bg-green-600 text-white', icon: <FiTrendingUp className="w-5 h-5" />, gradient: 'from-green-50 to-green-100/50' }
  if (s.includes('bearish')) return { bg: 'bg-red-50 border-red-200', text: 'text-red-800', badge: 'bg-red-600 text-white', icon: <FiTrendingDown className="w-5 h-5" />, gradient: 'from-red-50 to-red-100/50' }
  return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', badge: 'bg-amber-600 text-white', icon: <FiActivity className="w-5 h-5" />, gradient: 'from-amber-50 to-amber-100/50' }
}

function getImpactStyle(impact: string) {
  const i = (impact ?? '').toLowerCase()
  if (i.includes('positive')) return { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: <FiArrowUpRight className="w-4 h-4 text-green-600" />, label: 'Positive' }
  if (i.includes('negative')) return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: <FiArrowDownRight className="w-4 h-4 text-red-600" />, label: 'Negative' }
  return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <FiActivity className="w-4 h-4 text-amber-600" />, label: 'Neutral' }
}

function parseChangePercent(value: string): { isPositive: boolean; percent: string } | null {
  if (!value) return null
  const match = value.match(/([+-]?\d+\.?\d*)\s*%/)
  if (match) {
    const num = parseFloat(match[1])
    return { isPositive: num >= 0, percent: match[0] }
  }
  if (value.includes('+')) return { isPositive: true, percent: '' }
  if (value.includes('-')) return { isPositive: false, percent: '' }
  return null
}

function MarketDataCard({ label, value, icon, subtext }: { label: string; value: string; icon: React.ReactNode; subtext?: string }) {
  const change = parseChangePercent(value)
  return (
    <div className="p-4 rounded-xl bg-card border border-border/40 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
        </div>
        {change && (
          <div className={`flex items-center gap-0.5 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change.isPositive ? <FiArrowUpRight className="w-3.5 h-3.5" /> : <FiArrowDownRight className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
      <p className="text-base font-bold text-foreground leading-tight">{value || '--'}</p>
      {subtext && <p className="text-[11px] text-muted-foreground mt-1">{subtext}</p>}
    </div>
  )
}

function SectorHeatMap({ sectors }: { sectors: Array<{ sector?: string; impact?: string }> }) {
  if (!Array.isArray(sectors) || sectors.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {sectors.map((s, idx) => {
        const style = getImpactStyle(s.impact ?? '')
        return (
          <div key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${style.bg} ${style.border} ${style.text}`}>
            {style.icon}
            <span>{s.sector ?? 'Unknown'}</span>
          </div>
        )
      })}
    </div>
  )
}

function TrendSummaryBar({ sectors }: { sectors: Array<{ impact?: string }> }) {
  if (!Array.isArray(sectors) || sectors.length === 0) return null
  const pos = sectors.filter(s => (s.impact ?? '').toLowerCase().includes('positive')).length
  const neg = sectors.filter(s => (s.impact ?? '').toLowerCase().includes('negative')).length
  const neu = sectors.length - pos - neg
  const total = sectors.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Sector Trend Distribution</span>
        <span>{total} sectors analyzed</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden shadow-inner bg-muted">
        {pos > 0 && (
          <div className="bg-green-500 h-full bar-animate" style={{ width: `${(pos / total) * 100}%` }} title={`${pos} Positive`} />
        )}
        {neu > 0 && (
          <div className="bg-amber-400 h-full bar-animate" style={{ width: `${(neu / total) * 100}%`, animationDelay: '0.1s' }} title={`${neu} Neutral`} />
        )}
        {neg > 0 && (
          <div className="bg-red-500 h-full bar-animate" style={{ width: `${(neg / total) * 100}%`, animationDelay: '0.2s' }} title={`${neg} Negative`} />
        )}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-green-700 font-semibold">{pos} Positive</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-amber-700 font-semibold">{neu} Neutral</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-red-700 font-semibold">{neg} Negative</span>
        </div>
      </div>
    </div>
  )
}

function StatsSummaryRow({ data }: { data: ReportData }) {
  const sectors = Array.isArray(data.sector_impacts) ? data.sector_impacts : []
  const globalCount = Array.isArray(data.global_influences) ? data.global_influences.length : 0
  const regulatoryCount = Array.isArray(data.regulatory_highlights) ? data.regulatory_highlights.length : 0
  const takeawayCount = Array.isArray(data.key_takeaways) ? data.key_takeaways.length : 0

  const stats = [
    { label: 'Sectors Analyzed', value: sectors.length, icon: <FiLayers className="w-4 h-4" />, color: 'text-primary' },
    { label: 'Global Factors', value: globalCount, icon: <FiGlobe className="w-4 h-4" />, color: 'text-blue-600' },
    { label: 'Regulatory Updates', value: regulatoryCount, icon: <FiShield className="w-4 h-4" />, color: 'text-purple-600' },
    { label: 'Action Items', value: takeawayCount, icon: <FiTarget className="w-4 h-4" />, color: 'text-accent' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40">
          <div className={`${stat.color}`}>{stat.icon}</div>
          <div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ reportData, pdfUrl, loading, error, onGenerate, sampleMode }: DashboardProps) {
  const data = reportData
  const sentiment = data?.market_sentiment
  const sentimentStyle = getSentimentStyle(sentiment?.overall ?? '')
  const snapshot = data?.market_data_snapshot

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border/40 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FiRefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-base font-serif font-semibold text-foreground">Generating Market Intelligence Report</p>
            <p className="text-sm text-muted-foreground mt-0.5">Analyzing financial news across domestic, global, and regulatory channels...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(n => <Skeleton key={n} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map(n => <Skeleton key={n} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    )
  }

  if (!data && !sampleMode) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="shadow-lg border-border/40">
          <CardContent className="py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FiBarChart2 className="w-10 h-10 text-primary/60" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-foreground mb-3">Indian Market Daily Intelligence</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-2 leading-relaxed">
              Generate a comprehensive analysis covering domestic market movements, global influences,
              regulatory updates, and sector-specific insights for the Indian share market.
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5"><FiBarChart2 className="w-3.5 h-3.5" /> 10+ Sectors</span>
              <span className="flex items-center gap-1.5"><FiGlobe className="w-3.5 h-3.5" /> Global Markets</span>
              <span className="flex items-center gap-1.5"><FiShield className="w-3.5 h-3.5" /> RBI/SEBI Policy</span>
              <span className="flex items-center gap-1.5"><FiZap className="w-3.5 h-3.5" /> AI-Powered</span>
            </div>
            <Button onClick={onGenerate} size="lg" className="gap-2 shadow-lg shadow-primary/20 px-8">
              <FiFileText className="w-5 h-5" />
              Generate Today's Report
            </Button>
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm max-w-md mx-auto flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-6rem)]">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Banner */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-semibold text-foreground tracking-wide">
                Daily Market Report
              </h2>
              {data?.report_date && (
                <Badge variant="outline" className="text-xs font-medium gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {data.report_date}
                </Badge>
              )}
            </div>
            {data?.trading_day_relevance && (
              <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{data.trading_day_relevance}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2 shadow-sm">
                  <FiDownload className="w-4 h-4" />
                  Download PDF
                </Button>
              </a>
            )}
            <Button onClick={onGenerate} disabled={loading} className="gap-2 shadow-sm">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary */}
        {data && <StatsSummaryRow data={data} />}

        {/* Market Data Snapshot */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FiActivity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Market Data Snapshot</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <MarketDataCard label="Sensex" value={snapshot?.sensex ?? '--'} icon={<FiTrendingUp className="w-3.5 h-3.5" />} subtext="BSE Benchmark" />
            <MarketDataCard label="Nifty 50" value={snapshot?.nifty ?? '--'} icon={<FiTrendingUp className="w-3.5 h-3.5" />} subtext="NSE Benchmark" />
            <MarketDataCard label="USD/INR" value={snapshot?.usd_inr ?? '--'} icon={<FiDollarSign className="w-3.5 h-3.5" />} subtext="Forex Rate" />
            <MarketDataCard label="Crude Oil" value={snapshot?.crude_oil ?? '--'} icon={<FiActivity className="w-3.5 h-3.5" />} subtext="Brent Crude" />
            <MarketDataCard label="Gold" value={snapshot?.gold ?? '--'} icon={<FiDollarSign className="w-3.5 h-3.5" />} subtext="Per 10g" />
            <MarketDataCard label="FII Net" value={snapshot?.fii_net ?? '--'} icon={<FiBarChart2 className="w-3.5 h-3.5" />} subtext="Foreign Inst." />
            <MarketDataCard label="DII Net" value={snapshot?.dii_net ?? '--'} icon={<FiBarChart2 className="w-3.5 h-3.5" />} subtext="Domestic Inst." />
          </div>
        </div>

        {/* Market Sentiment - Hero Card */}
        {sentiment && (
          <Card className={`shadow-lg border ${sentimentStyle.bg} overflow-hidden`}>
            <div className={`bg-gradient-to-r ${sentimentStyle.gradient} p-6`}>
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl ${sentimentStyle.badge} shadow-lg`}>
                  {sentimentStyle.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-serif text-xl font-semibold text-foreground">Market Sentiment</h3>
                    <Badge className={`${sentimentStyle.badge} text-sm px-3 py-1`}>{sentiment.overall ?? 'N/A'}</Badge>
                    {sentiment.confidence && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <div className="w-20 h-2 rounded-full bg-white/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${sentimentStyle.badge.includes('green') ? 'bg-green-600' : sentimentStyle.badge.includes('red') ? 'bg-red-600' : 'bg-amber-600'}`}
                            style={{ width: sentiment.confidence }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{sentiment.confidence}</span>
                      </div>
                    )}
                  </div>
                  {sentiment.summary && (
                    <div className="text-sm text-foreground/80 leading-relaxed">{renderMarkdown(sentiment.summary)}</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Sector Heat Map + Trend Distribution */}
        {Array.isArray(data?.sector_impacts) && data.sector_impacts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="shadow-md lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  <FiHash className="w-4 h-4 text-primary" />
                  Sector Heat Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SectorHeatMap sectors={data.sector_impacts} />
                <Separator className="my-4" />
                <TrendSummaryBar sectors={data.sector_impacts} />
              </CardContent>
            </Card>

            {/* Sector Detail Cards */}
            <Card className="shadow-md lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                  <FiBarChart2 className="w-5 h-5 text-primary" />
                  Sector-wise Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-1">
                  {data.sector_impacts.map((sector, idx) => {
                    const style = getImpactStyle(sector.impact ?? '')
                    return (
                      <AccordionItem key={idx} value={`sector-${idx}`} className="border rounded-xl px-1 mb-2">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 text-left flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg} border ${style.border}`}>
                              {style.icon}
                            </div>
                            <div className="flex-1">
                              <span className="font-serif font-semibold text-sm">{sector.sector ?? 'Unknown Sector'}</span>
                            </div>
                            <Badge variant="outline" className={`${style.bg} ${style.border} ${style.text} text-xs`}>
                              {style.label}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pl-11 pb-2">
                            {sector.drivers && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Key Drivers</p>
                                <div className="text-sm text-foreground/80">{renderMarkdown(sector.drivers)}</div>
                              </div>
                            )}
                            {sector.actionable_insight && (
                              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2 mb-1">
                                  <FiTarget className="w-3.5 h-3.5 text-primary" />
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Actionable Insight</p>
                                </div>
                                <div className="text-sm text-foreground/80">{renderMarkdown(sector.actionable_insight)}</div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Global Influences + Regulatory side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Global Influences */}
          {Array.isArray(data?.global_influences) && data.global_influences.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <FiGlobe className="w-5 h-5 text-blue-600" />
                    Global Market Influences
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">{data.global_influences.length} factors</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.global_influences.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/40 bg-card hover:bg-card/80 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiGlobe className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1.5">{item.factor ?? 'Unknown Factor'}</p>
                        {item.impact_on_india && (
                          <div className="flex items-start gap-2 mb-2">
                            <FiArrowUpRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-foreground/70">{item.impact_on_india}</p>
                          </div>
                        )}
                        {item.affected_sectors && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.affected_sectors.split(',').map((sector: string, sIdx: number) => (
                              <Badge key={sIdx} variant="secondary" className="text-[10px] px-2 py-0.5">
                                {sector.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Regulatory Highlights */}
          {Array.isArray(data?.regulatory_highlights) && data.regulatory_highlights.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <FiShield className="w-5 h-5 text-purple-600" />
                    Regulatory & Policy Updates
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">{data.regulatory_highlights.length} updates</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.regulatory_highlights.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/40 bg-card hover:bg-card/80 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiFileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        {item.update && (
                          <p className="font-semibold text-sm mb-1.5">{item.update}</p>
                        )}
                        {item.market_impact && (
                          <div className="flex items-start gap-2">
                            <FiInfo className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-foreground/70">{item.market_impact}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Key Takeaways - Premium styled */}
        {Array.isArray(data?.key_takeaways) && data.key_takeaways.length > 0 && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-serif text-lg">
                  <FiCheckCircle className="w-5 h-5 text-primary" />
                  Key Takeaways & Action Items
                </CardTitle>
                <Badge variant="outline" className="text-xs gap-1">
                  <FiTarget className="w-3 h-3" />
                  {data.key_takeaways.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.key_takeaways.map((takeaway, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-primary/[0.03] border border-primary/10 hover:bg-primary/[0.06] transition-colors">
                    <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-foreground/85 leading-relaxed pt-1.5">{takeaway}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </ScrollArea>
  )
}
