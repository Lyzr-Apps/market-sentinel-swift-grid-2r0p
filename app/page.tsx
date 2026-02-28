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
import { FiActivity } from 'react-icons/fi'

const AGENT_ID = '69a2df8e48ec00882c2a1907'

const SAMPLE_REPORT = {
  report_date: '2026-02-27',
  trading_day_relevance: 'Previous trading day analysis for Thursday trading session. Markets closed on Wednesday at 3:30 PM IST.',
  market_sentiment: {
    overall: 'Bullish',
    confidence: '72%',
    summary: 'Indian markets showed resilience amid global volatility. Strong domestic consumption data and favorable FII flows supported the **bullish** outlook. The IT sector continued its recovery trajectory while banking remained stable on improved NPA metrics.'
  },
  sector_impacts: [
    { sector: 'Information Technology', impact: 'positive', drivers: 'Rupee depreciation boosting export revenue. **TCS** and **Infosys** secured large deal wins in the BFSI vertical. Cloud transformation spending remains robust globally.', actionable_insight: 'Accumulate large-cap IT stocks on dips. Target Nifty IT 38,000 in the near term.' },
    { sector: 'Banking & Financial Services', impact: 'positive', drivers: 'RBI maintained accommodative stance. Credit growth at 14.2% YoY. NPA ratios improving across PSU banks.', actionable_insight: 'PSU banks offer value. Private banks remain quality picks for long-term portfolios.' },
    { sector: 'Pharmaceuticals', impact: 'neutral', drivers: 'Mixed USFDA inspection outcomes. Domestic formulation segment showing steady 8-9% growth.', actionable_insight: 'Stock-specific approach recommended. Focus on companies with strong domestic portfolios.' },
    { sector: 'Oil & Gas', impact: 'negative', drivers: 'Brent crude above $82/bbl pressuring OMC margins. Government deferred fuel price revision.', actionable_insight: 'Reduce exposure to OMCs. Upstream companies like ONGC benefit from higher crude.' },
    { sector: 'Automobile', impact: 'positive', drivers: 'Rural demand recovery, festival season pre-buying, EV adoption accelerating with new model launches.', actionable_insight: 'Two-wheeler segment showing strongest momentum. Tata Motors EV business gaining scale.' }
  ],
  global_influences: [
    { factor: 'US Federal Reserve Rate Decision', impact_on_india: 'Fed held rates steady with dovish commentary. Positive for emerging market flows including India.', affected_sectors: 'Banking, IT, Real Estate' },
    { factor: 'China Economic Stimulus', impact_on_india: 'China announced new infrastructure spending package. Mixed impact on Indian metals sector due to competition.', affected_sectors: 'Metals, Mining, Commodities' },
    { factor: 'US-India Trade Developments', impact_on_india: 'New semiconductor partnership agreement boosting sentiment for Indian tech manufacturing.', affected_sectors: 'IT, Electronics Manufacturing, Defence' }
  ],
  regulatory_highlights: [
    { update: 'SEBI tightened margin requirements for F&O segment effective April 2026', market_impact: 'Short-term negative for derivative volumes. May reduce speculative activity and improve market stability.' },
    { update: 'RBI extends deadline for card tokenization compliance to June 2026', market_impact: 'Positive for fintech and payment companies. Reduces compliance burden in the near term.' }
  ],
  key_takeaways: [
    'Maintain overweight position on IT and Banking sectors based on strong fundamentals and favorable macro backdrop.',
    'Monitor crude oil prices closely - sustained levels above $85 could shift sentiment to cautious.',
    'FII inflows have turned positive for the first time in 3 months, signaling improved confidence in Indian equities.',
    'SEBI regulatory changes may create short-term volatility in mid and small cap segments.',
    'Rupee stability around 83.5-84.0 range provides comfort for FII positioning.'
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
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
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
        <Sidebar activeScreen={activeScreen} onNavigate={setActiveScreen} />

        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 border-b border-border/50 bg-card flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              {statusMessage && (
                <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  {statusMessage}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Agent Status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FiActivity className={`w-3.5 h-3.5 ${activeAgentId ? 'text-green-600 animate-pulse' : 'text-muted-foreground'}`} />
                <span>{activeAgentId ? 'Agent Active' : 'Agent Idle'}</span>
              </div>

              <div className="h-5 w-px bg-border" />

              {/* Sample Data Toggle */}
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-sm text-muted-foreground cursor-pointer">
                  Sample Data
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
          <div className="flex-1 overflow-auto">
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
          <footer className="h-10 border-t border-border/50 bg-card flex items-center px-6 flex-shrink-0">
            <div className="flex items-center gap-6 text-xs text-muted-foreground w-full">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${activeAgentId ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
                <span className="font-medium">Market Report Coordinator</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Manager</Badge>
              </div>
              <span className="text-muted-foreground/60">ID: {AGENT_ID.slice(0, 8)}...</span>
              <span className="ml-auto text-muted-foreground/60">
                {reportData?.report_date ? `Last report: ${reportData.report_date}` : 'No report loaded'}
              </span>
            </div>
          </footer>
        </main>
      </div>
    </ErrorBoundary>
  )
}
