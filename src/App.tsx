import { useState, useEffect } from 'react'
import { useMoisture } from '../hooks/useMoisture'
import type { MoisturePoint } from '../hooks/useMoisture'
import './App.css'

const GAUGE_R = 72
const GAUGE_CX = 90
const GAUGE_CY = 90
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_R

function moistureColor(pct: number): string {
  if (pct >= 65) return '#3b82f6'
  if (pct >= 35) return '#22c55e'
  return '#f59e0b'
}

function MoistureGauge({ pct }: { pct: number }) {
  const color = moistureColor(pct)
  const filled = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE

  return (
    <>
      <div className="gauge-card-label">Soil Moisture</div>
      <svg width="180" height="180" className="gauge" aria-label={`${pct.toFixed(1)}% moisture`}>
        <circle
          cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
          fill="none" stroke="#1a1f30" strokeWidth="14"
        />
        <circle
          cx={GAUGE_CX} cy={GAUGE_CY} r={GAUGE_R}
          fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={filled}
          strokeLinecap="round"
          transform={`rotate(-90 ${GAUGE_CX} ${GAUGE_CY})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
        <text x={GAUGE_CX} y={GAUGE_CY + 2} textAnchor="middle" className="gauge-value" fill={color}>
          {pct.toFixed(1)}%
        </text>
        <text x={GAUGE_CX} y={GAUGE_CY + 22} textAnchor="middle" className="gauge-sub">
          current
        </text>
      </svg>
    </>
  )
}

function Sparkline({ history }: { history: MoisturePoint[] }) {
  if (history.length < 2) {
    return <div className="sparkline-empty">Collecting readings…</div>
  }

  const W = 600
  const H = 120
  const padX = 4
  const padY = 10
  const vals = history.map(h => h.pct)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1

  const coords = history.map((h, i) => ({
    x: padX + (i / (history.length - 1)) * (W - 2 * padX),
    y: H - padY - ((h.pct - min) / range) * (H - 2 * padY),
  }))

  const linePts = coords.map(c => `${c.x},${c.y}`).join(' ')
  const areaPts = [
    `${padX},${H - padY}`,
    ...coords.map(c => `${c.x},${c.y}`),
    `${W - padX},${H - padY}`,
  ].join(' ')

  const last = coords[coords.length - 1]

  return (
    <div className="chart-body">
      <div className="chart-y-labels">
        <span>{max.toFixed(0)}%</span>
        <span>{((max + min) / 2).toFixed(0)}%</span>
        <span>{min.toFixed(0)}%</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="sparkline"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(t => (
          <line
            key={t}
            x1={padX} y1={padY + t * (H - 2 * padY)}
            x2={W - padX} y2={padY + t * (H - 2 * padY)}
            stroke="#1a1f30" strokeWidth="1"
          />
        ))}

        <polygon points={areaPts} fill="url(#areaGrad)" />
        <polyline
          points={linePts}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Live dot at last point */}
        <circle cx={last.x} cy={last.y} r="4" fill="#3b82f6" />
        <circle cx={last.x} cy={last.y} r="7" fill="#3b82f6" opacity="0.2" />
      </svg>
    </div>
  )
}

function MetricCard({ label, value, unit, icon, color }: {
  label: string
  value: string
  unit?: string
  icon: string
  color: string
}) {
  return (
    <div className="metric-card">
      <span className="metric-icon" style={{ color }} aria-hidden="true">{icon}</span>
      <div className="metric-body">
        <div className="metric-value" style={{ color }}>
          {value}
          {unit && <span className="metric-unit">{unit}</span>}
        </div>
        <div className="metric-label">{label}</div>
      </div>
    </div>
  )
}

function App() {
  const { data, connected, history } = useMoisture()
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString())

  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(id)
  }, [])

  const minMoisture = history.length ? Math.min(...history.map(h => h.pct)).toFixed(1) : '—'
  const maxMoisture = history.length ? Math.max(...history.map(h => h.pct)).toFixed(1) : '—'

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-brand">
          <span className="dash-icon" aria-hidden="true">🌱</span>
          <span className="dash-title">SoilSense</span>
          <span className="dash-subtitle">Instrumentation Dashboard</span>
        </div>
        <div className="dash-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} aria-hidden="true" />
          <span className="status-text">{connected ? 'Live' : 'Offline'}</span>
          <span className="status-sep" aria-hidden="true">·</span>
          <span className="status-time">{clock}</span>
        </div>
      </header>

      <main className="dash-main">
        {!data ? (
          <div className="waiting" role="status">
            <div className="waiting-spinner" aria-hidden="true" />
            <p>Waiting for sensor data…</p>
          </div>
        ) : (
          <>
            <div className="top-grid">
              <div className="gauge-card">
                <MoistureGauge pct={data.pct} />
              </div>

              <div className="metrics-side">
                <MetricCard
                  label="Temperature"
                  value={data.temp != null ? data.temp.toFixed(1) : '—'}
                  unit="°C"
                  icon="🌡️"
                  color="#f59e0b"
                />
                <MetricCard
                  label="Humidity"
                  value={data.humidity != null ? data.humidity.toFixed(1) : '—'}
                  unit="%"
                  icon="💧"
                  color="#06b6d4"
                />
                <div className={`pump-card ${data.pump ? 'pump-on' : 'pump-off'}`}>
                  <span className="pump-icon" aria-hidden="true">{data.pump ? '💧' : '⏸'}</span>
                  <div>
                    <div className="pump-status">{data.pump ? 'Pump Active' : 'Pump Idle'}</div>
                    <div className="pump-sub">{data.pump ? 'Currently watering' : 'Standby mode'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-title">Moisture History</span>
                <div className="chart-meta">
                  {history.length >= 2 && (
                    <span className="chart-range">
                      {minMoisture}% – {maxMoisture}%
                    </span>
                  )}
                  <span className="chart-count">{history.length} / 60</span>
                </div>
              </div>
              <Sparkline history={history} />
            </div>
          </>
        )}
      </main>

      <footer className="dash-footer">
        <span>
          {data
            ? `Last reading · ${new Date(data.time > 1e12 ? data.time : data.time * 1000).toLocaleTimeString()}`
            : 'No data received'}
        </span>
        <span>SoilSense · WebSocket ws://localhost:8080</span>
      </footer>
    </div>
  )
}

export default App
