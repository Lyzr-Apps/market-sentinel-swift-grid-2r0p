'use client'

import React from 'react'
import { FiTrendingUp, FiBarChart2, FiClock, FiSettings } from 'react-icons/fi'

export type NavScreen = 'dashboard' | 'history' | 'settings'

interface SidebarProps {
  activeScreen: NavScreen
  onNavigate: (screen: NavScreen) => void
}

const NAV_ITEMS: { id: NavScreen; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FiBarChart2 className="w-5 h-5" /> },
  { id: 'history', label: 'Report History', icon: <FiClock className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
]

export default function Sidebar({ activeScreen, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 min-h-screen flex flex-col border-r border-sidebar-border bg-sidebar-background">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <FiTrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold tracking-wide text-sidebar-foreground leading-tight">
              Market Intelligence
            </h1>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Indian Markets
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
            >
              {item.icon}
              <span className="tracking-wide">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="px-4 py-3 rounded-lg bg-sidebar-accent">
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-1">
            Powered by
          </p>
          <p className="text-sm font-serif font-semibold text-sidebar-foreground">
            Market Report Coordinator
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            AI-driven analysis
          </p>
        </div>
      </div>
    </aside>
  )
}
