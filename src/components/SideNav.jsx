import React from 'react'

function SideNav({ active, onChange }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'map', label: 'US Outage Map' },
    { key: 'disasters', label: 'Natural Disaster Feed' },
  ]

  return (
    <aside className="w-64 shrink-0 border-r border-grid-border bg-slate-900/30 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold">Aegis</h2>
        <p className="text-xs text-slate-400">Outage Risk Dashboard</p>
      </div>

      <nav className="space-y-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={`block w-full text-left rounded px-3 py-2 text-sm font-medium transition hover:bg-slate-800/60 ${
              active === it.key ? 'bg-cyan-600/20 text-cyan-200' : 'text-slate-300'
            }`}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default SideNav
