'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  FiTrendingUp, FiBarChart2, FiClock, FiSettings,
  FiTrendingDown, FiActivity, FiZap
} from 'react-icons/fi'

export type NavScreen = 'dashboard' | 'history' | 'settings'

interface SidebarProps {
  activeScreen: NavScreen
  onNavigate: (screen: NavScreen) => void
  reportData?: Record<string, any> | null
}

const NAV_ITEMS: { id: NavScreen; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FiBarChart2 className="w-5 h-5" />, desc: 'Market analysis' },
  { id: 'history', label: 'Report History', icon: <FiClock className="w-5 h-5" />, desc: 'Past reports' },
  { id: 'settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" />, desc: 'Schedule & prefs' },
]

function getSentimentInfo(sentiment?: string) {
  const s = (sentiment ?? '').toLowerCase()
  if (s.includes('bullish')) return { color: 'text-green-700', bg: 'bg-green-100', icon: <FiTrendingUp className="w-4 h-4 text-green-600" />, label: 'Bullish' }
  if (s.includes('bearish')) return { color: 'text-red-700', bg: 'bg-red-100', icon: <FiTrendingDown className="w-4 h-4 text-red-600" />, label: 'Bearish' }
  return { color: 'text-amber-700', bg: 'bg-amber-100', icon: <FiActivity className="w-4 h-4 text-amber-600" />, label: 'Neutral' }
}

export default function Sidebar({ activeScreen, onNavigate, reportData }: SidebarProps) {
  const sentiment = reportData?.market_sentiment
  const sentimentInfo = getSentimentInfo(sentiment?.overall)
  const snapshot = reportData?.market_data_snapshot
  const sectorImpacts = Array.isArray(reportData?.sector_impacts) ? reportData.sector_impacts : []
  const positiveCount = sectorImpacts.filter((s: any) => (s?.impact ?? '').toLowerCase().includes('positive')).length
  const negativeCount = sectorImpacts.filter((s: any) => (s?.impact ?? '').toLowerCase().includes('negative')).length

  return (
    <aside className="w-72 min-h-screen flex flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* App Branding */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <FiTrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold tracking-wide text-sidebar-foreground leading-tight">
              Market Intelligence
            </h1>
            <p className="text-[11px] text-muted-foreground tracking-widest uppercase">
              Indian Markets
            </p>
          </div>
        </div>
      </div>

      {/* Quick Pulse - shows when report data is available */}
      {reportData && (
        <div className="px-4 pt-4 pb-2">
          <div className="p-3 rounded-xl bg-card border border-border/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Market Pulse</span>
              <span className="w-2 h-2 rounded-full bg-green-500 live-pulse" />
            </div>

            {/* Sentiment */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${sentimentInfo.bg}`}>
              {sentimentInfo.icon}
              <span className={`text-sm font-semibold ${sentimentInfo.color}`}>{sentimentInfo.label}</span>
              {sentiment?.confidence && (
                <span className="text-xs text-muted-foreground ml-auto">{sentiment.confidence}</span>
              )}
            </div>

            {/* Key Numbers */}
            {snapshot && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-background/60">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sensex</p>
                  <p className="text-xs font-bold text-foreground truncate">{snapshot.sensex ?? '--'}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/60">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Nifty</p>
                  <p className="text-xs font-bold text-foreground truncate">{snapshot.nifty ?? '--'}</p>
                </div>
              </div>
            )}

            {/* Sector Bar */}
            {sectorImpacts.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Sector Signals</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 text-xs">
                    <FiTrendingUp className="w-3 h-3 text-green-600" />
                    <span className="font-semibold text-green-700">{positiveCount}</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
                    {sectorImpacts.length > 0 && (
                      <>
                        <div
                          className="h-full bg-green-500 rounded-l-full transition-all"
                          style={{ width: `${(positiveCount / sectorImpacts.length) * 100}%` }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: `${((sectorImpacts.length - positiveCount - negativeCount) / sectorImpacts.length) * 100}%` }}
                        />
                        <div
                          className="h-full bg-red-500 rounded-r-full transition-all"
                          style={{ width: `${(negativeCount / sectorImpacts.length) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-semibold text-red-700">{negativeCount}</span>
                    <FiTrendingDown className="w-3 h-3 text-red-600" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              {item.icon}
              <div className="text-left">
                <span className="tracking-wide block">{item.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {item.desc}
                </span>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-4 py-3 rounded-xl bg-sidebar-accent/70">
          <div className="flex items-center gap-2 mb-1">
            <FiZap className="w-3.5 h-3.5 text-accent" />
            <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">
              AI-Powered
            </p>
          </div>
          <p className="text-sm font-serif font-semibold text-sidebar-foreground">
            Market Report Coordinator
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            3 sub-agents + real-time web search
          </p>
        </div>
      </div>
    </aside>
  )
}
