'use client'

import { useEffect, useState, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface SensorData {
  temperature_c: number
  humidity: number
  heat_index_c: number
  timestamp: string
}

interface HistoryPoint extends SensorData {
  time: string
}

const MAX_HISTORY = 20

function getHeatStatus(hic: number) {
  if (hic > 41) return { label: 'DANGER', color: 'var(--danger)', bg: 'rgba(255,61,61,0.1)', buzzer: true }
  if (hic > 35) return { label: 'CAUTION', color: 'var(--warn)', bg: 'rgba(255,179,0,0.1)', buzzer: false }
  if (hic > 28) return { label: 'WARM', color: 'var(--accent2)', bg: 'rgba(255,107,53,0.1)', buzzer: false }
  return { label: 'NORMAL', color: 'var(--accent3)', bg: 'rgba(57,255,20,0.1)', buzzer: false }
}

function BigMetric({ label, value, unit, color, sub }: {
  label: string; value: number | null; unit: string; color: string; sub?: string
}) {
  return (
    <div style={{ borderColor: 'var(--border)' }}
      className="border rounded-none p-6 flex flex-col gap-2 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: color }} />
      <span className="mono text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <div className="flex items-end gap-2">
        <span className="mono font-bold" style={{ fontSize: '3.5rem', lineHeight: 1, color }}>
          {value !== null ? value.toFixed(1) : '--.-'}
        </span>
        <span className="mono text-xl mb-2" style={{ color: 'var(--text-dim)' }}>{unit}</span>
      </div>
      {sub && <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{sub}</span>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="mono text-xs p-3 border" style={{
        background: 'var(--panel2)', borderColor: 'var(--border)', color: 'var(--text)'
      }}>
        <div style={{ color: 'var(--text-dim)' }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value?.toFixed(1)}{p.name === 'humidity' ? '%' : '°C'}
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [latest, setLatest] = useState<SensorData | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--')
  const [tick, setTick] = useState(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/latest')
      if (!res.ok) throw new Error('not ok')
      const data: SensorData = await res.json()
      setLatest(data)
      setConnected(true)
      const now = new Date()
      const timeStr = now.toLocaleTimeString('id-ID', { hour12: false })
      setLastUpdate(timeStr)
      setHistory(prev => {
        const point: HistoryPoint = { ...data, time: timeStr }
        const next = [...prev, point]
        return next.slice(-MAX_HISTORY)
      })
    } catch {
      setConnected(false)
    }
  }

  useEffect(() => {
    fetchData()
    pollRef.current = setInterval(fetchData, 10000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // clock tick
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const status = latest ? getHeatStatus(latest.heat_index_c) : null
  const now = new Date()

  return (
    <main className="relative min-h-screen" style={{ background: 'var(--bg)', zIndex: 1 }}>
      {/* Scan line effect */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: '100%', height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)',
          animation: 'scan 8s linear infinite'
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="mono text-xs tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
              // ENVIRONMENT MONITOR v1.0
            </div>
            <h1 className="font-black text-3xl sm:text-4xl tracking-tight" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
              ESP32 SENSOR<br />
              <span style={{ color: 'var(--accent)', WebkitTextStroke: '1px var(--accent)', WebkitTextFillColor: 'transparent' }}>
                DASHBOARD
              </span>
            </h1>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Status badge */}
            <div className="flex items-center gap-2 mono text-xs px-3 py-2 border"
              style={{ borderColor: connected ? 'var(--accent3)' : 'var(--danger)', color: connected ? 'var(--accent3)' : 'var(--danger)' }}
            >
              <div className="w-2 h-2 rounded-full"
                style={{ background: connected ? 'var(--accent3)' : 'var(--danger)', animation: connected ? 'blink 1s step-end infinite' : 'none' }}
              />
              {connected ? 'CONNECTED' : 'NO SIGNAL'}
            </div>
            <div className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              {now.toLocaleDateString('id-ID')} &nbsp;
              <span style={{ color: 'var(--text)' }}>
                {now.toLocaleTimeString('id-ID', { hour12: false })}
              </span>
            </div>
            <div className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              LAST DATA: <span style={{ color: 'var(--text)' }}>{lastUpdate}</span>
            </div>
          </div>
        </header>

        {/* Alert banner */}
        {status?.buzzer && (
          <div className="mb-6 px-4 py-3 border mono text-sm font-bold tracking-widest flex items-center gap-3 animate-pulse"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'rgba(255,61,61,0.08)' }}
          >
            <span className="animate-blink">⚠</span>
            HEAT INDEX CRITICAL — BUZZER ACTIVE — {latest?.heat_index_c.toFixed(1)}°C EXCEEDS 41°C THRESHOLD
            <span className="animate-blink">⚠</span>
          </div>
        )}

        {/* Big 3 metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 animate-fade-in-up">
          <BigMetric
            label="TEMPERATURE"
            value={latest?.temperature_c ?? null}
            unit="°C"
            color="var(--accent2)"
            sub="DHT22 SENSOR"
          />
          <BigMetric
            label="HUMIDITY"
            value={latest?.humidity ?? null}
            unit="%"
            color="var(--accent)"
            sub="RELATIVE HUMIDITY"
          />
          <BigMetric
            label="HEAT INDEX"
            value={latest?.heat_index_c ?? null}
            unit="°C"
            color={status?.color ?? 'var(--accent3)'}
            sub="FEELS LIKE"
          />
        </div>

        {/* Status + info row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {/* Status card */}
          <div className="border p-4 flex items-center gap-4"
            style={{ borderColor: 'var(--border)', background: status?.bg ?? 'transparent' }}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse-glow"
              style={{ background: status?.color ?? 'var(--text-dim)' }}
            />
            <div>
              <div className="mono text-xs" style={{ color: 'var(--text-dim)' }}>CONDITION</div>
              <div className="mono font-bold text-lg" style={{ color: status?.color ?? 'var(--text-dim)' }}>
                {status?.label ?? '---'}
              </div>
            </div>
          </div>

          {/* Buzzer status */}
          <div className="border p-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>BUZZER STATUS</div>
            <div className="mono font-bold text-lg" style={{ color: status?.buzzer ? 'var(--danger)' : 'var(--text-dim)' }}>
              {status?.buzzer ? '🔔 ACTIVE' : '— IDLE'}
            </div>
            <div className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>TRIGGER &gt; 41°C HI</div>
          </div>

          {/* Device info */}
          <div className="border p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>DEVICE</div>
            <div className="mono text-sm" style={{ color: 'var(--text)' }}>ESP32-WROOM-32</div>
            <div className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              SENSOR: DHT22 · PIN: GPIO4<br />
              BUZZER: GPIO14 · POLL: 10s
            </div>
          </div>
        </div>

        {/* Charts */}
        {history.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 animate-fade-in-up">
            {/* Temperature + Heat Index */}
            <div className="border p-5" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
              <div className="mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
                TEMPERATURE & HEAT INDEX (°C)
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <XAxis dataKey="time" tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: 'var(--text-dim)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: 'var(--text-dim)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={41} stroke="var(--danger)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="temperature_c" name="temperature" stroke="var(--accent2)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="heat_index_c" name="heat_index" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <span className="mono text-xs flex items-center gap-1" style={{ color: 'var(--accent2)' }}>
                  <span className="inline-block w-4 h-[2px]" style={{ background: 'var(--accent2)' }} /> TEMP
                </span>
                <span className="mono text-xs flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                  <span className="inline-block w-4 h-[2px]" style={{ background: 'var(--danger)' }} /> HEAT IDX
                </span>
              </div>
            </div>

            {/* Humidity */}
            <div className="border p-5" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
              <div className="mono text-xs tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
                HUMIDITY (%)
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <XAxis dataKey="time" tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: 'var(--text-dim)' }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: 'var(--text-dim)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="humidity" name="humidity" stroke="var(--accent)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History table */}
        {history.length > 0 && (
          <div className="border" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
            <div className="px-5 py-3 border-b mono text-xs tracking-widest" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
              READING HISTORY — LAST {history.length} ENTRIES
            </div>
            <div className="overflow-x-auto">
              <table className="w-full mono text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['TIME', 'TEMP (°C)', 'HUMIDITY (%)', 'HEAT IDX (°C)', 'STATUS'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-normal" style={{ color: 'var(--text-dim)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((row, i) => {
                    const s = getHeatStatus(row.heat_index_c)
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', opacity: i === 0 ? 1 : 0.6 + (0.4 * (1 - i / history.length)) }}>
                        <td className="px-5 py-2" style={{ color: 'var(--text-dim)' }}>{row.time}</td>
                        <td className="px-5 py-2" style={{ color: 'var(--accent2)' }}>{row.temperature_c.toFixed(1)}</td>
                        <td className="px-5 py-2" style={{ color: 'var(--accent)' }}>{row.humidity.toFixed(1)}</td>
                        <td className="px-5 py-2" style={{ color: s.color }}>{row.heat_index_c.toFixed(1)}</td>
                        <td className="px-5 py-2">
                          <span className="px-2 py-0.5 text-xs" style={{ background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No data state */}
        {!latest && (
          <div className="text-center py-20">
            <div className="mono text-4xl mb-4" style={{ color: 'var(--border)' }}>◌</div>
            <div className="mono text-sm" style={{ color: 'var(--text-dim)' }}>
              WAITING FOR ESP32 DATA...<span className="animate-blink">_</span>
            </div>
            <div className="mono text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
              Polling backend every 10 seconds
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t mono text-xs flex justify-between" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          <span>ESP32-WROOM · DHT22 · ACTIVE BUZZER</span>
          <span>AUTO-REFRESH: 10s</span>
        </footer>
      </div>
    </main>
  )
}