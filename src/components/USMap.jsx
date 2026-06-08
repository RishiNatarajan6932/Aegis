import React, { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Line, Marker } from 'react-simple-maps'

const US_TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const severityColor = (sev) => {
  if (!sev) return '#9CA3AF'
  if (sev === 'high') return '#ef4444'
  if (sev === 'medium') return '#f59e0b'
  return '#10b981'
}

const severityWeight = (sev) => {
  if (sev === 'high') return 3
  if (sev === 'medium') return 2
  return 1
}

const lineColor = (a, b) => {
  const weight = Math.max(severityWeight(a?.severity), severityWeight(b?.severity))
  if (weight >= 3) return '#ef4444'
  if (weight === 2) return '#f59e0b'
  return '#38bdf8'
}

const haversineKm = (a, b) => {
  if (!a?.coordinates || !b?.coordinates) return Number.POSITIVE_INFINITY

  const [lon1, lat1] = a.coordinates
  const [lon2, lat2] = b.coordinates
  const toRad = (value) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const lat1Rad = toRad(lat1)
  const lat2Rad = toRad(lat2)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const c = 2 * Math.asin(Math.sqrt(
    sinLat * sinLat
      + Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinLon * sinLon,
  ))

  return 6371 * c
}

function USMap({ points = [] }) {
  const [geographies, setGeographies] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  const visiblePoints = points.filter((point) => point.coordinates)
  const lines = (() => {
    if (visiblePoints.length < 2) return []

    const sorted = [...visiblePoints].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
    const connections = []
    const usedPairs = new Set()

    sorted.slice(0, 20).forEach((point) => {
      const nearest = sorted
        .filter((candidate) => candidate.id !== point.id)
        .map((candidate) => ({ candidate, distance: haversineKm(point, candidate) }))
        .sort((a, b) => a.distance - b.distance)[0]?.candidate

      if (!nearest) return

      const pairKey = [point.id, nearest.id].sort().join('::')
      if (usedPairs.has(pairKey)) return
      usedPairs.add(pairKey)

      connections.push({
        id: pairKey,
        from: point.coordinates,
        to: nearest.coordinates,
        color: lineColor(point, nearest),
      })
    })

    return connections.slice(0, 14)
  })()

  useEffect(() => {
    let cancelled = false
    fetch(US_TOPOJSON_URL)
      .then((r) => r.json())
      .then((topo) => {
        if (!cancelled) setGeographies(topo)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative flex min-h-[calc(100vh-230px)] w-full flex-col rounded-xl border border-grid-border bg-grid-card p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">US Outage Map</h3>
      <div className="min-h-0 flex-1 w-full">
        <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 1000 }}>
          {geographies ? (
            <Geographies geography={geographies}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#071127" /* slightly lighter than page bg */
                    stroke="#0f2a3a" /* clearer state borders */
                    strokeWidth={0.8}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#0b2540', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>
          ) : null}

          {lines.map((line, index) => (
            <React.Fragment key={line.id}>
              <Line
                from={line.from}
                to={line.to}
                stroke={line.color}
                strokeWidth={index % 3 === 0 ? 2.5 : 1.8}
                strokeOpacity={0.16}
                style={{ pointerEvents: 'none' }}
              />
              <Line
                from={line.from}
                to={line.to}
                stroke={line.color}
                strokeWidth={1}
                strokeOpacity={0.72}
                strokeDasharray="6 10"
                style={{ pointerEvents: 'none' }}
              >
                <animate attributeName="stroke-dashoffset" values="0;16" dur="1.8s" repeatCount="indefinite" />
              </Line>
            </React.Fragment>
          ))}

          {visiblePoints.map((pt) => (
            (
              <Marker key={pt.id} coordinates={pt.coordinates}>
                <g
                  transform="translate(0,0)"
                  style={{ transformOrigin: 'center', cursor: 'pointer' }}
                  onMouseEnter={(event) => {
                    setTooltip({ point: pt, x: event.clientX, y: event.clientY })
                  }}
                  onMouseMove={(event) => {
                    setTooltip({ point: pt, x: event.clientX, y: event.clientY })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* pulsing outer ring */}
                  <circle r={Math.max(6, Math.min(18, (pt.scale || 1) * 2))} fill={severityColor(pt.severity)} opacity={0.14}>
                    <animate attributeName="r" values={`${Math.max(6, (pt.scale||1)*2)};${Math.max(12, (pt.scale||1)*6)};${Math.max(6, (pt.scale||1)*2)}`} dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0;0.35" dur="1.6s" repeatCount="indefinite" />
                  </circle>

                  {/* pulsing mid ring */}
                  <circle r={Math.max(3, Math.min(10, (pt.scale || 1) * 1.2))} fill={severityColor(pt.severity)} opacity={0.28}>
                    <animate attributeName="r" values={`${Math.max(3, (pt.scale||1)*1.2)};${Math.max(8, (pt.scale||1)*3)};${Math.max(3, (pt.scale||1)*1.2)}`} dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.05;0.6" dur="1.2s" repeatCount="indefinite" />
                  </circle>

                  {/* solid center */}
                  <circle r={Math.max(2, Math.min(6, (pt.scale || 1)))} fill={severityColor(pt.severity)} stroke="#04121a" strokeWidth={0.8} />
                </g>
              </Marker>
            )
          ))}
        </ComposableMap>
      </div>

      {tooltip?.point ? (
        <div
          className="pointer-events-none fixed z-20 w-[420px] max-w-[calc(100vw-24px)] rounded-lg border border-cyan-400/30 bg-slate-950/95 px-4 py-3 text-left shadow-2xl shadow-cyan-900/20 backdrop-blur"
          style={{
            left: Math.min((tooltip.x || 0) + 16, window.innerWidth - 444),
            top: Math.min((tooltip.y || 0) + 16, window.innerHeight - 110),
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            {tooltip.point.placeLabel || 'Unknown location'}
          </div>
          <div className="mt-1 whitespace-normal break-words text-xs leading-snug text-slate-200">
            {String(tooltip.point.detail || 'No outage details available')}
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#ef4444' }} />
          <span className="text-xs text-slate-300">High severity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#f59e0b' }} />
          <span className="text-xs text-slate-300">Medium severity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#10b981' }} />
          <span className="text-xs text-slate-300">Low severity</span>
        </div>
      </div>
    </div>
  )
}

export default USMap
