'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FiClock, FiPlay, FiPause, FiRefreshCw, FiCheckCircle,
  FiAlertCircle, FiCalendar, FiSettings
} from 'react-icons/fi'
import {
  listSchedules, getScheduleLogs, pauseSchedule, resumeSchedule,
  triggerScheduleNow, cronToHuman
} from '@/lib/scheduler'
import type { Schedule, ExecutionLog } from '@/lib/scheduler'

const SCHEDULE_ID = '69a2df9725d4d77f732f3404'
const AGENT_ID = '69a2df8e48ec00882c2a1907'

interface SettingsProps {
  onStatusMessage: (msg: string) => void
}

export default function Settings({ onStatusMessage }: SettingsProps) {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [triggering, setTriggering] = useState(false)

  const loadSchedule = useCallback(async () => {
    setLoadingSchedule(true)
    const result = await listSchedules({ agentId: AGENT_ID })
    if (result.success && Array.isArray(result.schedules)) {
      const found = result.schedules.find((s) => s.id === SCHEDULE_ID) ?? result.schedules[0] ?? null
      setSchedule(found)
    }
    setLoadingSchedule(false)
  }, [])

  const loadLogs = useCallback(async () => {
    if (!schedule) return
    setLoadingLogs(true)
    const result = await getScheduleLogs(schedule.id, { limit: 10 })
    if (result.success && Array.isArray(result.executions)) {
      setLogs(result.executions)
    }
    setLoadingLogs(false)
  }, [schedule])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  useEffect(() => {
    if (schedule) {
      loadLogs()
    }
  }, [schedule, loadLogs])

  const handleToggle = async () => {
    if (!schedule) return
    setToggling(true)
    if (schedule.is_active) {
      await pauseSchedule(schedule.id)
      onStatusMessage('Schedule paused')
    } else {
      await resumeSchedule(schedule.id)
      onStatusMessage('Schedule activated')
    }
    await loadSchedule()
    setToggling(false)
  }

  const handleTrigger = async () => {
    if (!schedule) return
    setTriggering(true)
    const result = await triggerScheduleNow(schedule.id)
    if (result.success) {
      onStatusMessage('Schedule triggered - report generation started')
    } else {
      onStatusMessage('Failed to trigger schedule: ' + (result.error ?? 'Unknown error'))
    }
    setTriggering(false)
    setTimeout(() => loadLogs(), 5000)
  }

  if (loadingSchedule) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground tracking-wide">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage automated schedule and preferences</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <FiClock className="w-5 h-5 text-primary" />
            Schedule Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {schedule ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Automated Report Generation</Label>
                    <Badge variant={schedule.is_active ? 'default' : 'secondary'} className={schedule.is_active ? 'bg-green-600 text-white' : ''}>
                      {schedule.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {schedule.cron_expression ? cronToHuman(schedule.cron_expression) : 'No schedule set'}
                    {schedule.timezone ? ` (${schedule.timezone})` : ''}
                  </p>
                </div>
                <Switch
                  checked={schedule.is_active}
                  onCheckedChange={handleToggle}
                  disabled={toggling}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-card border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <FiCalendar className="w-4 h-4" />
                    <span>Next Run</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {schedule.next_run_time
                      ? new Date(schedule.next_run_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                      : 'Not scheduled'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <FiClock className="w-4 h-4" />
                    <span>Last Run</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {schedule.last_run_at
                      ? new Date(schedule.last_run_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                      : 'Never'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <FiSettings className="w-4 h-4" />
                    <span>Cron Expression</span>
                  </div>
                  <p className="text-sm font-mono font-medium text-foreground">
                    {schedule.cron_expression ?? 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleTrigger} disabled={triggering} className="gap-2">
                  {triggering ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiPlay className="w-4 h-4" />
                  )}
                  {triggering ? 'Triggering...' : 'Run Now'}
                </Button>
                <Button variant="outline" onClick={handleToggle} disabled={toggling} className="gap-2">
                  {schedule.is_active ? (
                    <><FiPause className="w-4 h-4" /> Pause Schedule</>
                  ) : (
                    <><FiPlay className="w-4 h-4" /> Activate Schedule</>
                  )}
                </Button>
                <Button variant="outline" onClick={loadLogs} disabled={loadingLogs} className="gap-2 ml-auto">
                  <FiRefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                  Refresh Logs
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FiAlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No schedule found for this agent.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <FiClock className="w-5 h-5 text-primary" />
            Run History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-14 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <FiClock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No execution logs available yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2 pr-4">
                {logs.map((log, idx) => (
                  <div
                    key={log.id ?? idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {log.success ? (
                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <FiAlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {log.executed_at
                            ? new Date(log.executed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                            : 'Unknown time'}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-red-500 mt-0.5">{log.error_message}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={log.success ? 'default' : 'destructive'} className={log.success ? 'bg-green-600' : ''}>
                      {log.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
