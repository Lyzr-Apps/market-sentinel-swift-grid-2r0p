'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import Sidebar from './sections/Sidebar'
import Dashboard from './sections/Dashboard'
import ReportHistory from './sections/ReportHistory'
import Settings from './sections/Settings'
import type { NavScreen } from './sections/Sidebar'
import type { StoredReport } from './sections/ReportHistory'
import { FiActivity, FiClock, FiLayers, FiZap } from 'react-icons/fi'

const AGENT_ID = '69a2df8e48ec00882c2a1907'

const SAMPLE_REPORT = {
  report_date: '2026-02-27',
  trading_day_relevance: 'Previous trading day analysis for Friday trading session. Markets closed on Thursday at 3:30 PM IST. All data points reflect closing values as of February 27, 2026.',
  market_sentiment: {
    overall: 'Bullish',
    confidence: '72%',
    summary: 'Indian markets showed resilience amid global volatility. Strong domestic consumption data and favorable FII flows supported the **bullish** outlook. The IT sector continued its recovery trajectory while banking remained stable on improved NPA metrics. Key support levels held firm across benchmark indices, with breadth remaining positive across mid-cap and small-cap segments.'
  },
  sector_impacts: [
    { sector: 'Information Technology', impact: 'positive', drivers: 'Rupee depreciation boosting export revenue. **TCS** and **Infosys** secured large deal wins in the BFSI vertical. Cloud transformation spending remains robust globally with $580B market opportunity.', actionable_insight: 'Accumulate large-cap IT stocks on dips. Target Nifty IT 38,000 in the near term. Mid-cap IT names like **Persistent Systems** and **Coforge** offer growth potential.' },
    { sector: 'Banking & Financial Services', impact: 'positive', drivers: 'RBI maintained accommodative stance. Credit growth at 14.2% YoY. NPA ratios improving across PSU banks with GNPA below 3.5% for top 5 PSU banks. Housing loan disbursements up 18% QoQ.', actionable_insight: 'PSU banks offer value at current valuations. Private banks remain quality picks for long-term portfolios. **HDFC Bank**, **ICICI Bank** remain top picks.' },
    { sector: 'Pharmaceuticals', impact: 'neutral', drivers: 'Mixed USFDA inspection outcomes. Domestic formulation segment showing steady 8-9% growth. API exports gaining traction with China+1 strategy benefiting Indian manufacturers.', actionable_insight: 'Stock-specific approach recommended. Focus on companies with strong domestic portfolios and US generic pipeline. **Sun Pharma** and **Cipla** positioned well.' },
    { sector: 'Oil & Gas', impact: 'negative', drivers: 'Brent crude above $82/bbl pressuring OMC margins. Government deferred fuel price revision. Natural gas prices volatile amid European supply concerns.', actionable_insight: 'Reduce exposure to OMCs (**BPCL**, **HPCL**). Upstream companies like **ONGC** and **Oil India** benefit from higher crude prices.' },
    { sector: 'Automobile', impact: 'positive', drivers: 'Rural demand recovery, pre-monsoon buying activity, EV adoption accelerating with new model launches from **Tata Motors** and **M&M**. Two-wheeler sales up 12% YoY.', actionable_insight: 'Two-wheeler segment showing strongest momentum. **Bajaj Auto** export growth impressive. Tata Motors EV business gaining scale with 50,000+ monthly bookings.' },
    { sector: 'FMCG', impact: 'neutral', drivers: 'Volume growth recovering slowly at 4-5%. Urban demand stable but rural recovery remains gradual. Input cost pressures easing with commodity softening.', actionable_insight: 'Prefer companies with strong rural distribution. **HUL** and **ITC** remain defensive picks. Margin expansion expected in H2 FY26.' },
    { sector: 'Metals & Mining', impact: 'negative', drivers: 'China demand uncertainty weighing on base metals. Steel prices under pressure from cheap Chinese imports. Government mulling anti-dumping duties on steel imports.', actionable_insight: 'Underweight metals in the near term. Watch for government policy response on import duties. **Hindalco** relatively better positioned due to Novelis.' },
    { sector: 'Real Estate', impact: 'positive', drivers: 'Housing demand remains robust in top 8 cities. Office space absorption at record levels driven by GCC expansion. Interest rates stabilizing supporting affordability.', actionable_insight: 'Commercial real estate segment strongest. **DLF**, **Godrej Properties**, and **Prestige Estates** well-positioned for growth cycle.' },
    { sector: 'Telecom', impact: 'positive', drivers: 'ARPU improvement trajectory intact post-tariff hikes. 5G monetization beginning to show results. Subscriber additions stable with industry consolidation complete.', actionable_insight: '**Bharti Airtel** remains top pick with superior ARPU and Africa growth. **Jio** IPO anticipation supporting sector sentiment.' },
    { sector: 'Infrastructure', impact: 'positive', drivers: 'Government capex spending on track at Rs 11.1 lakh crore. Highway construction targets being met. New railway projects gaining momentum ahead of elections.', actionable_insight: 'Order book visibility strong for **L&T**, **KEC International**. Road developers like **IRB Infra** benefit from traffic growth.' }
  ],
  global_influences: [
    { factor: 'US Federal Reserve Rate Decision', impact_on_india: 'Fed held rates steady at 4.5-4.75% with dovish commentary signaling potential rate cuts in Q3 2026. Positive for emerging market flows including India. Dollar index weakened to 103.2.', affected_sectors: 'Banking, IT, Real Estate' },
    { factor: 'China Economic Stimulus Package', impact_on_india: 'China announced $150B infrastructure spending package and property market support measures. Mixed impact on Indian metals due to competition, but positive for commodity demand overall.', affected_sectors: 'Metals, Mining, Commodities' },
    { factor: 'US-India Trade & Tech Partnership', impact_on_india: 'New semiconductor partnership agreement and defence technology transfer deals boosting sentiment for Indian tech manufacturing. iCET framework expanding bilateral cooperation.', affected_sectors: 'IT, Electronics Manufacturing, Defence' },
    { factor: 'Crude Oil & OPEC+ Decision', impact_on_india: 'OPEC+ maintaining production cuts. Brent crude at $82.45/bbl. Higher crude oil prices are net negative for India as a major importer, impacting current account deficit and OMC margins.', affected_sectors: 'Oil & Gas, Airlines, Paints, FMCG' },
    { factor: 'European Central Bank Policy', impact_on_india: 'ECB signaled dovish pivot amid slowing eurozone growth. Euro weakening supports Indian IT services demand from European clients. European fund flows diversifying into emerging markets.', affected_sectors: 'IT, Pharma (EU exports), Auto (EU demand)' }
  ],
  regulatory_highlights: [
    { update: 'SEBI tightened margin requirements for F&O segment effective April 2026. Minimum lot size increased and weekly expiry rationalization underway.', market_impact: 'Short-term negative for derivative volumes and brokerage revenues. May reduce speculative activity and improve overall market stability. Discount brokers most impacted.' },
    { update: 'RBI extends deadline for card tokenization compliance to June 2026 and introduces new digital lending guidelines', market_impact: 'Positive for fintech and payment companies. Reduces compliance burden in the near term. Digital lending norms provide regulatory clarity for the sector.' },
    { update: 'Government announces PLI scheme extension for semiconductor and electronics manufacturing with Rs 76,000 crore outlay', market_impact: 'Strongly positive for electronics manufacturing sector. Companies like **Dixon Technologies**, **Kaynes Technology** and **Tata Electronics** key beneficiaries.' },
    { update: 'SEBI proposes new ESG disclosure framework for top 500 listed companies by market cap', market_impact: 'Neutral to mildly positive long-term. Increases compliance costs but improves corporate governance standards. Attracts ESG-focused foreign fund flows.' }
  ],
  key_takeaways: [
    'Maintain overweight position on IT and Banking sectors based on strong fundamentals and favorable macro backdrop. Both sectors showing positive earnings momentum.',
    'Monitor crude oil prices closely - sustained levels above $85/bbl could shift overall market sentiment to cautious. Oil import bill directly impacts fiscal and current account deficit.',
    'FII inflows have turned positive for the first time in 3 months at +Rs 2,145 Cr, signaling improved confidence in Indian equities. This trend is critical to sustain for continued rally.',
    'SEBI regulatory changes in F&O may create short-term volatility in mid and small cap segments. Traders should reduce leveraged positions ahead of April implementation.',
    'Rupee stability around 83.5-84.0 range provides comfort for FII positioning. RBI intervention keeping volatility low despite global currency fluctuations.',
    'Real Estate and Infrastructure sectors offer structural growth opportunity. Government capex cycle and urbanization trends provide multi-year tailwinds for the sector.',
    'PLI scheme extension for electronics is a significant positive catalyst. Track semiconductor and EMS companies for medium-term investment opportunities.'
  ],
  market_data_snapshot: {
    sensex: '82,145.32 (+0.84%)',
    nifty: '24,876.50 (+0.91%)',
    usd_inr: '83.72 (-0.12%)',
    crude_oil: '$82.45/bbl (+1.2%)',
    gold: 'Rs 72,340/10g (+0.3%)',
    fii_net: '+Rs 2,145 Cr',
    dii_net: '+Rs 1,890 Cr'
  }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-serif font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm shadow-md"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Page() {
  const [activeScreen, setActiveScreen] = useState<NavScreen>('dashboard')
  const [sampleMode, setSampleMode] = useState(false)
  const [reportData, setReportData] = useState<Record<string, any> | null>(null)
  const [pdfUrl, setPdfUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [statusMessage])

  const displayData = sampleMode && !reportData ? SAMPLE_REPORT : reportData

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setActiveAgentId(AGENT_ID)

    try {
      const message = 'Generate the daily Indian market financial news analysis report for the previous trading day. Analyze all news, global market movements, and regulatory updates from yesterday and synthesize a comprehensive report for today\'s trading session.'
      const result = await callAIAgent(message, AGENT_ID)

      if (result.success) {
        let parsed = result?.response?.result
        if (typeof parsed === 'string') {
          parsed = parseLLMJson(parsed)
        }
        if (parsed && typeof parsed === 'object') {
          setReportData(parsed)

          const files = Array.isArray(result?.module_outputs?.artifact_files)
            ? result.module_outputs.artifact_files
            : []
          if (files.length > 0 && files[0]?.file_url) {
            setPdfUrl(files[0].file_url)
          }

          const dateKey = parsed.report_date ?? new Date().toISOString().split('T')[0]
          const storedReport: StoredReport = {
            date: dateKey,
            data: parsed,
            pdfUrl: files[0]?.file_url ?? '',
            generatedAt: new Date().toISOString()
          }
          try {
            localStorage.setItem(`report_${dateKey}`, JSON.stringify(storedReport))
          } catch {
            // localStorage full or unavailable
          }

          setStatusMessage('Report generated successfully')
        } else {
          setError('Received an unexpected response format. Please try again.')
        }
      } else {
        setError(result?.error ?? 'Failed to generate report. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleViewHistoricReport = useCallback((report: StoredReport) => {
    setReportData(report.data)
    setPdfUrl(report.pdfUrl ?? '')
    setActiveScreen('dashboard')
  }, [])

  const handleStatusMessage = useCallback((msg: string) => {
    setStatusMessage(msg)
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} reportData={displayData} />

        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              {statusMessage && (
                <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {statusMessage}
                </span>
              )}
              {loading && (
                <span className="text-sm text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1.5">
                  <FiActivity className="w-3.5 h-3.5 animate-pulse" />
                  Generating report...
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Agent Status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${activeAgentId ? 'bg-green-500 live-pulse' : 'bg-muted-foreground/30'}`} />
                <span>{activeAgentId ? 'Agent Active' : 'Ready'}</span>
              </div>

              <div className="h-5 w-px bg-border/50" />

              {/* Sample Data Toggle */}
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  Preview Mode
                </Label>
                <Switch
                  id="sample-toggle"
                  checked={sampleMode}
                  onCheckedChange={setSampleMode}
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto smooth-scroll">
            {activeScreen === 'dashboard' && (
              <Dashboard
                reportData={displayData}
                pdfUrl={pdfUrl}
                loading={loading}
                error={error}
                onGenerate={handleGenerate}
                sampleMode={sampleMode}
              />
            )}
            {activeScreen === 'history' && (
              <ReportHistory onViewReport={handleViewHistoricReport} />
            )}
            {activeScreen === 'settings' && (
              <Settings onStatusMessage={handleStatusMessage} />
            )}
          </div>

          {/* Agent Status Footer */}
          <footer className="h-10 border-t border-border/50 bg-card/80 backdrop-blur-sm flex items-center px-6 flex-shrink-0">
            <div className="flex items-center gap-6 text-xs text-muted-foreground w-full">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${activeAgentId ? 'bg-green-500 live-pulse' : 'bg-muted-foreground/30'}`} />
                <span className="font-medium">Market Report Coordinator</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Manager</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground/50">
                <FiLayers className="w-3 h-3" />
                <span>3 sub-agents</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground/50">
                <FiZap className="w-3 h-3" />
                <span>Perplexity + GPT-4.1</span>
              </div>
              <span className="ml-auto text-muted-foreground/50 flex items-center gap-1.5">
                <FiClock className="w-3 h-3" />
                {displayData?.report_date ? `Report: ${displayData.report_date}` : 'No report loaded'}
              </span>
            </div>
          </footer>
        </main>
      </div>
    </ErrorBoundary>
  )
}
