'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ── types ────────────────────────────────────────────────────────────────────

type ColInfo = { name: string; type: string }
type Schema  = Record<string, ColInfo[]>
type Counts  = Record<string, number>
type Row     = Record<string, unknown>

type Mode = 'browse' | 'edit' | 'add'
type AdminSection = 'db' | 'battle-simulator'
type BattleSimTab = 'combat-module' | 'simulator-config' | 'enemy-view'

// ── helpers ──────────────────────────────────────────────────────────────────

const TABLE_ICONS: Record<string, string> = {
  users: '◈', characters: '◉', character_instances: '◎',
  gears: '▣', gear_instances: '▤', skills: '◆',
  skill_instances: '◇', runs: '▶', passive: '○',
  faction: '◐', modifier: '◑', modifier_effect: '◒',
}

const TABLE_GROUPS: { label: string; tables: string[] }[] = [
  { label: 'PLAYERS', tables: ['users', 'runs'] },
  { label: 'ROSTER',  tables: ['characters', 'character_instances'] },
  { label: 'GEAR',    tables: ['gears', 'gear_instances'] },
  { label: 'SKILLS',  tables: ['skills', 'skill_instances'] },
  { label: 'META',    tables: ['faction', 'passive', 'modifier', 'modifier_effect'] },
]

function fmt(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'string' && val.length > 48) return val.slice(0, 46) + '…'
  return String(val)
}

// ── sub-components ───────────────────────────────────────────────────────────

function TopScrollbar({ contentId }: { contentId: string }) {
  const topRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const content = document.getElementById(contentId)
    if (!content) return

    function syncFromContent() {
      if (topRef.current) topRef.current.scrollLeft = content!.scrollLeft
    }
    function syncFromTop() {
      content!.scrollLeft = topRef.current!.scrollLeft
    }
    function updateWidth() {
      setWidth(content!.scrollWidth)
    }

    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    ro.observe(content)

    content.addEventListener('scroll', syncFromContent)
    topRef.current?.addEventListener('scroll', syncFromTop)

    return () => {
      content.removeEventListener('scroll', syncFromContent)
      topRef.current?.removeEventListener('scroll', syncFromTop)
      ro.disconnect()
    }
  }, [contentId])

  return (
    <div
      ref={topRef}
      style={{ overflowX: 'auto', overflowY: 'hidden', height: '10px', background: '#0a0c10' }}
    >
      <div style={{ width, height: '1px' }} />
    </div>
  )
}

function ScanlineOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
    }} />
  )
}

function Glitch({ text }: { text: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{
        position: 'absolute', top: 0, left: '2px',
        color: '#c53030', clipPath: 'inset(20% 0 60% 0)',
        animation: 'glitch1 4s infinite',
        opacity: 0.7,
      }}>{text}</span>
      <span style={{
        position: 'absolute', top: 0, left: '-2px',
        color: '#4af', clipPath: 'inset(60% 0 20% 0)',
        animation: 'glitch2 4s infinite',
        opacity: 0.5,
      }}>{text}</span>
      {text}
    </span>
  )
}

type StatPillProps = { label: string; value: string | number; accent?: string }
function StatPill({ label, value, accent = '#e8a736' }: StatPillProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '4px',
      background: '#0a0c10', border: `1px solid ${accent}33`,
      padding: '12px 16px', minWidth: '120px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        animation: 'scan 3s linear infinite',
      }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        letterSpacing: '0.25em', color: '#6a6060', textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '22px',
        color: accent, fontWeight: 700, lineHeight: 1,
      }}>{value}</span>
    </div>
  )
}

// ── modal ─────────────────────────────────────────────────────────────────────

type RowModalProps = {
  mode: 'edit' | 'add'
  table: string
  columns: ColInfo[]
  row?: Row
  onClose: () => void
  onSave: (data: Row) => Promise<void>
}

function RowModal({ mode, table, columns, row, onClose, onSave }: RowModalProps) {
  const editableCols = mode === 'add'
    ? columns.filter(c => c.name !== 'id' && c.name !== 'created_at' && c.name !== 'acquired_at')
    : columns.filter(c => c.name !== 'id' && c.name !== 'created_at' && c.name !== 'acquired_at')

  const [form, setForm] = useState<Row>(() => {
    const init: Row = {}
    for (const c of editableCols) init[c.name] = row ? (row[c.name] ?? '') : ''
    return init
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    setSaving(true)
    setErr('')
    try {
      await onSave(form)
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div style={{
        background: '#0b0d10', border: '1px solid #e8a73666',
        width: '520px', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 0 60px #e8a73622, 0 0 120px #e8a73611',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        {/* header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e8a73633',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg, #0f0e08, #0b0d10)',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
            letterSpacing: '0.25em', color: '#e8a736', textTransform: 'uppercase',
          }}>
            {mode === 'edit' ? `▣ EDIT ROW :: ${table}` : `＋ INSERT ROW :: ${table}`}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#6a6060',
            cursor: 'pointer', fontSize: '16px', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* fields */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {editableCols.map(col => (
            <div key={col.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
                letterSpacing: '0.2em', color: '#6a6060', textTransform: 'uppercase',
              }}>
                {col.name} <span style={{ color: '#3a3030' }}>({col.type || 'TEXT'})</span>
              </label>
              <input
                value={String(form[col.name] ?? '')}
                onChange={e => setForm(p => ({ ...p, [col.name]: e.target.value }))}
                style={{
                  background: '#14171c', border: '1px solid #3a3030',
                  color: '#f2f0ea', padding: '8px 10px',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
                  outline: 'none', width: '100%', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#e8a736')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#3a3030')}
              />
            </div>
          ))}

          {err && (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
              color: '#c53030', padding: '8px 10px', border: '1px solid #c5303033',
              background: '#1a0a0a',
            }}>⚠ {err}</div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: '10px',
              background: saving ? '#1a1d22' : '#e8a736',
              color: saving ? '#6a6060' : '#0b0d10',
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
              letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700,
              transition: 'background 0.15s',
            }}>
              {saving ? 'WRITING...' : mode === 'edit' ? 'COMMIT CHANGES' : 'INSERT ROW'}
            </button>
            <button onClick={onClose} style={{
              padding: '10px 16px', background: 'none',
              border: '1px solid #3a3030', color: '#6a6060',
              cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px', letterSpacing: '0.15em',
            }}>CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()

  const [section, setSection]       = useState<AdminSection>('db')
  const [battleTab, setBattleTab]   = useState<BattleSimTab>('combat-module')
  const [schema, setSchema]         = useState<Schema>({})
  const [counts, setCounts]         = useState<Counts>({})
  const [activeTable, setActiveTable] = useState<string>('users')
  const [rows, setRows]             = useState<Row[]>([])
  const [columns, setColumns]       = useState<ColInfo[]>([])
  const [loading, setLoading]       = useState(false)
  const [modal, setModal]           = useState<{ mode: Mode; row?: Row } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null)
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [search, setSearch]         = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  // auth check
  useEffect(() => {
    fetch('/api/auth/check-admin').then(r => { if (!r.ok) router.push('/') })
  }, [router])

  // load schema + counts
  useEffect(() => {
    fetch('/api/admin/db')
      .then(r => r.json())
      .then(d => {
        setSchema(d.schema ?? {})
        setCounts(d.counts ?? {})
      })
  }, [])

  // load table rows
  const loadTable = useCallback(async (table: string) => {
    setLoading(true)
    setSearch('')
    try {
      const r = await fetch(`/api/admin/db?table=${table}`)
      const d = await r.json()
      setRows(d.rows ?? [])
      setColumns(d.columns ?? schema[table] ?? [])
    } finally {
      setLoading(false)
    }
  }, [schema])

  useEffect(() => {
    if (Object.keys(schema).length > 0) loadTable(activeTable)
  }, [schema, activeTable, loadTable])

  async function handleSaveRow(data: Row) {
    if (modal?.mode === 'edit' && modal.row) {
      const r = await fetch('/api/admin/db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: activeTable, id: modal.row.id, updates: data }),
      })
      if (!r.ok) throw new Error((await r.json()).error)
      showToast('Row updated.')
    } else {
      const r = await fetch('/api/admin/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: activeTable, row: data }),
      })
      if (!r.ok) throw new Error((await r.json()).error)
      showToast('Row inserted.')
    }
    await loadTable(activeTable)
    setCounts(prev => ({
      ...prev,
      [activeTable]: prev[activeTable] + (modal?.mode === 'add' ? 1 : 0),
    }))
  }

  async function handleDelete(row: Row) {
    const r = await fetch('/api/admin/db', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: activeTable, id: row.id }),
    })
    if (!r.ok) {
      showToast((await r.json()).error, 'err')
      return
    }
    showToast('Row deleted.')
    setDeleteTarget(null)
    await loadTable(activeTable)
    setCounts(prev => ({ ...prev, [activeTable]: Math.max(0, prev[activeTable] - 1) }))
  }

  const filteredRows = search
    ? rows.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : rows

  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <>
      <ScanlineOverlay />

      <style>{`
        @keyframes glitch1 { 0%,94%,100%{opacity:0} 95%{opacity:.7;transform:translateX(3px)} 97%{transform:translateX(-2px)} }
        @keyframes glitch2 { 0%,91%,100%{opacity:0} 92%{opacity:.5;transform:translateX(-3px)} 94%{transform:translateX(2px)} }
        @keyframes scan    { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 8px #e8a73611} 50%{box-shadow:0 0 18px #e8a73633} }
        .db-row:hover td { background:#0f1008 !important; }
        .db-row td { transition: background 0.1s; }
        .table-btn:hover { background:#1a1400 !important; border-color:#e8a73688 !important; color:#e8a736 !important; }
        .action-btn:hover { opacity:1 !important; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#0b0d10; }
        ::-webkit-scrollbar-thumb { background:#3a3030; }
        ::-webkit-scrollbar-thumb:hover { background:#e8a73666; }
      `}</style>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: '#f2f0ea',
        minHeight: '100vh',
        animation: 'fadeIn 0.4s ease',
      }}>

        {/* ── header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: '28px', paddingBottom: '20px',
          borderBottom: '1px solid #e8a73622',
          position: 'relative',
        }}>
          <div>
            <div style={{
              fontSize: '9px', letterSpacing: '0.35em', color: '#6a6060',
              marginBottom: '6px', textTransform: 'uppercase',
            }}>
              SQUADFALL OS v2.1 // DATABASE CONTROL
            </div>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '52px',
              letterSpacing: '0.06em', color: '#e8a736', margin: 0, lineHeight: 1,
            }}>
              <Glitch text="DB CONTROL" />
            </h1>
          </div>

          {/* stats row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <StatPill label="Tables"  value={Object.keys(schema).length} />
            <StatPill label="Records" value={totalRecords} />
            <StatPill label="Active"  value={activeTable.toUpperCase()} accent="#6a7d5a" />
            <StatPill label="Rows"    value={loading ? '…' : filteredRows.length} accent="#e8a736" />
            <StatPill label="Status"  value="ONLINE" accent="#6b8a3a" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* ── sidebar: table navigator ── */}
          <div style={{
            width: '200px', flexShrink: 0,
            background: '#0a0c10', border: '1px solid #1e1a14',
            padding: '12px 0',
          }}>
            {/* section switcher */}
            <div style={{ padding: '0 8px 12px', borderBottom: '1px solid #1a1410', marginBottom: '8px' }}>
              {([
                { id: 'db', label: '▣ DB CONTROL' },
                { id: 'battle-simulator', label: '⚔ BATTLE SIM' },
              ] as { id: AdminSection; label: string }[]).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '6px 6px',
                    background: section === s.id ? '#1a1400' : 'none',
                    border: 'none',
                    borderLeft: `2px solid ${section === s.id ? '#e8a736' : 'transparent'}`,
                    color: section === s.id ? '#e8a736' : '#6a5a4a',
                    cursor: 'pointer', fontSize: '10px', letterSpacing: '0.15em',
                    fontFamily: "'JetBrains Mono', monospace",
                    marginBottom: '2px', transition: 'all 0.1s',
                  }}
                >{s.label}</button>
              ))}
            </div>

            {section === 'battle-simulator' && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{
                  fontSize: '7px', letterSpacing: '0.3em', color: '#3a3030',
                  textTransform: 'uppercase', padding: '4px 14px 6px',
                  borderTop: '1px solid #1a1410',
                }}>BATTLE SIM</div>
                {([
                  { id: 'combat-module',    label: '◉ Combat Module' },
                  { id: 'simulator-config', label: '◑ Simulator Config' },
                  { id: 'enemy-view',       label: '◈ Enemy View' },
                ] as { id: BattleSimTab; label: string }[]).map(t => (
                  <button
                    key={t.id}
                    className="table-btn"
                    onClick={() => setBattleTab(t.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '7px 14px',
                      background: battleTab === t.id ? '#1a1400' : 'none',
                      border: 'none',
                      borderLeft: `2px solid ${battleTab === t.id ? '#e8a736' : 'transparent'}`,
                      color: battleTab === t.id ? '#e8a736' : '#8a7060',
                      cursor: 'pointer', fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                      transition: 'all 0.1s',
                    }}
                  >{t.label}</button>
                ))}
              </div>
            )}

            {section === 'db' && <>
            <div style={{
              fontSize: '8px', letterSpacing: '0.3em', color: '#4a4040',
              textTransform: 'uppercase', padding: '0 14px 8px',
            }}>Tables</div>

            {TABLE_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: '8px' }}>
                <div style={{
                  fontSize: '7px', letterSpacing: '0.3em', color: '#3a3030',
                  textTransform: 'uppercase', padding: '4px 14px',
                  borderTop: '1px solid #1a1410',
                }}>{group.label}</div>
                {group.tables.map(t => {
                  const isActive = t === activeTable
                  return (
                    <button
                      key={t}
                      className="table-btn"
                      onClick={() => setActiveTable(t)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '7px 14px',
                        background: isActive ? '#1a1400' : 'none',
                        border: 'none',
                        borderLeft: `2px solid ${isActive ? '#e8a736' : 'transparent'}`,
                        color: isActive ? '#e8a736' : '#8a7060',
                        cursor: 'pointer', fontSize: '11px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.1s',
                      }}
                    >
                      <span>{TABLE_ICONS[t] ?? '▸'} {t}</span>
                      <span style={{
                        fontSize: '9px', color: isActive ? '#e8a73699' : '#3a3030',
                        background: '#14120c', padding: '1px 5px',
                      }}>
                        {counts[t] ?? '?'}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
            </>}
          </div>

          {/* ── main panel ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

          {section === 'battle-simulator' && (() => {
            const BATTLE_TABS: Record<BattleSimTab, { title: string; subtitle: string; icon: string }> = {
              'combat-module':    { title: 'COMBAT MODULE',    subtitle: 'SQUADFALL OS v2.1 // COMBAT ENGINE',    icon: '◉' },
              'simulator-config': { title: 'SIMULATOR CONFIG', subtitle: 'SQUADFALL OS v2.1 // SIM CONFIGURATION', icon: '◑' },
              'enemy-view':       { title: 'ENEMY VIEW',       subtitle: 'SQUADFALL OS v2.1 // THREAT ANALYSIS',   icon: '◈' },
            }
            const tab = BATTLE_TABS[battleTab]
            return (
              <div style={{
                border: '1px solid #1e1a14',
                background: '#08090b',
                padding: '48px 40px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '20px', textAlign: 'center',
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '56px',
                  letterSpacing: '0.08em', color: '#e8a736', lineHeight: 1,
                }}>{tab.title}</div>
                <div style={{
                  fontSize: '9px', letterSpacing: '0.35em', color: '#4a4040',
                  textTransform: 'uppercase',
                }}>{tab.subtitle}</div>
                <div style={{
                  border: '1px dashed #2a2020', padding: '32px 60px',
                  color: '#3a3030', fontSize: '11px', letterSpacing: '0.2em',
                  marginTop: '16px',
                }}>
                  {tab.icon} PLACEHOLDER — COMING SOON
                </div>
              </div>
            )
          })()}

          {section === 'db' && <>

            {/* toolbar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '12px', gap: '12px', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px', color: '#e8a736', letterSpacing: '0.2em',
                }}>
                  {TABLE_ICONS[activeTable]} {activeTable.toUpperCase()}
                </span>
                <span style={{ fontSize: '9px', color: '#3a3030' }}>
                  {counts[activeTable] ?? 0} RECORDS
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* search */}
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="FILTER..."
                  style={{
                    background: '#0a0c10', border: '1px solid #2a2020',
                    color: '#e8a736', padding: '6px 10px',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                    letterSpacing: '0.15em', outline: 'none', width: '180px',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#e8a73688')}
                  onBlur={e  => (e.currentTarget.style.borderColor = '#2a2020')}
                />

                <button
                  onClick={() => loadTable(activeTable)}
                  style={{
                    padding: '6px 12px', background: '#0a0c10',
                    border: '1px solid #2a2020', color: '#6a6060',
                    cursor: 'pointer', fontSize: '10px', letterSpacing: '0.15em',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#e8a73666')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2020')}
                >
                  ↻ REFRESH
                </button>

                <button
                  onClick={() => setModal({ mode: 'add' })}
                  style={{
                    padding: '6px 14px', background: '#1a1400',
                    border: '1px solid #e8a73666', color: '#e8a736',
                    cursor: 'pointer', fontSize: '10px', letterSpacing: '0.15em',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='#e8a736'; e.currentTarget.style.color='#0b0d10' }}
                  onMouseLeave={e => { e.currentTarget.style.background='#1a1400'; e.currentTarget.style.color='#e8a736' }}
                >
                  ＋ INSERT
                </button>
              </div>
            </div>

            {/* table — top scrollbar mirror */}
            <div style={{
              border: '1px solid #1e1a14',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
              animation: 'pulseGlow 4s ease-in-out infinite',
            }}>
              {/* top scrollbar strip */}
              <TopScrollbar contentId="db-table-scroll" />

              <div id="db-table-scroll" style={{ overflowX: 'auto', background: '#08090b' }}>
              {loading ? (
                <div style={{
                  padding: '60px', textAlign: 'center',
                  color: '#e8a73666', fontSize: '11px', letterSpacing: '0.3em',
                }}>
                  ▶▶ LOADING DATA...
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: '8px 12px', background: '#0a0c10',
                        borderBottom: '1px solid #e8a73622',
                        fontSize: '8px', color: '#3a3030',
                        textAlign: 'left', whiteSpace: 'nowrap',
                      }}>OPS</th>
                      {columns.map(col => (
                        <th key={col.name} style={{
                          padding: '8px 12px', textAlign: 'left',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '8px', letterSpacing: '0.25em',
                          color: '#e8a73699', textTransform: 'uppercase',
                          borderBottom: '1px solid #e8a73622',
                          background: '#0a0c10',
                          whiteSpace: 'nowrap',
                        }}>
                          {col.name}
                          <span style={{ color: '#3a3030', marginLeft: '4px' }}>
                            {col.type}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} style={{
                          padding: '40px', textAlign: 'center',
                          color: '#3a3030', fontSize: '10px', letterSpacing: '0.2em',
                        }}>
                          NO RECORDS FOUND
                        </td>
                      </tr>
                    ) : filteredRows.map((row, i) => (
                      <tr key={i} className="db-row">
                        <td style={{
                          padding: '7px 12px',
                          borderBottom: '1px solid #0f1010',
                          background: i % 2 === 0 ? '#08090b' : '#09090d',
                          whiteSpace: 'nowrap',
                        }}>
                          <button
                            className="action-btn"
                            onClick={() => setModal({ mode: 'edit', row })}
                            title="Edit"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#6a6060', fontSize: '12px', padding: '2px 6px',
                              opacity: 0.6, transition: 'opacity 0.1s',
                            }}
                          >✎</button>
                          <button
                            className="action-btn"
                            onClick={() => setDeleteTarget(row)}
                            title="Delete"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#c53030', fontSize: '12px', padding: '2px 6px',
                              opacity: 0.4, transition: 'opacity 0.1s',
                            }}
                          >✕</button>
                        </td>
                        {columns.map(col => (
                          <td key={col.name} style={{
                            padding: '7px 12px',
                            borderBottom: '1px solid #0f1010',
                            fontSize: '11px', color: '#c8b898',
                            maxWidth: '220px', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            background: i % 2 === 0 ? '#08090b' : '#09090d',
                          }}>
                            {col.name === 'id'
                              ? <span style={{ color: '#4a4030' }}>{fmt(row[col.name])}</span>
                              : col.name === 'isAdmin' || col.name === 'level'
                              ? <span style={{ color: row[col.name] ? '#6b8a3a' : '#c53030' }}>{fmt(row[col.name])}</span>
                              : fmt(row[col.name])
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              </div>
            </div>

            {/* row count footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 4px', fontSize: '9px', color: '#3a3030', letterSpacing: '0.2em',
            }}>
              <span>SHOWING {filteredRows.length} / {rows.length} ROWS</span>
              <span>TABLE: {activeTable} // DIRECT ACCESS</span>
            </div>
          </>}
          </div>
        </div>
      </div>

      {/* ── edit / add modal ── */}
      {modal && modal.mode !== 'browse' && (
        <RowModal
          mode={modal.mode as 'edit' | 'add'}
          table={activeTable}
          columns={schema[activeTable] ?? columns}
          row={modal.row}
          onClose={() => setModal(null)}
          onSave={handleSaveRow}
        />
      )}

      {/* ── delete confirm ── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.88)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)',
        }} onClick={() => setDeleteTarget(null)}>
          <div style={{
            background: '#0b0d10', border: '1px solid #c5303066',
            padding: '28px 32px', width: '380px',
            boxShadow: '0 0 60px #c5303022',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              fontSize: '9px', letterSpacing: '0.3em', color: '#c53030',
              marginBottom: '12px',
            }}>⚠ DESTRUCTIVE OPERATION</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '26px',
              letterSpacing: '0.06em', color: '#f2f0ea', marginBottom: '8px',
            }}>DELETE ROW?</div>
            <div style={{
              fontSize: '10px', color: '#6a6060', marginBottom: '20px',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              id={String(deleteTarget.id)} from <span style={{color:'#c53030'}}>{activeTable}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDelete(deleteTarget)}
                style={{
                  flex: 1, padding: '10px',
                  background: '#c53030', color: '#f2f0ea', border: 'none',
                  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px', letterSpacing: '0.15em', fontWeight: 700,
                }}
              >CONFIRM DELETE</button>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '10px 16px', background: 'none',
                  border: '1px solid #3a3030', color: '#6a6060',
                  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px', letterSpacing: '0.15em',
                }}
              >ABORT</button>
            </div>
          </div>
        </div>
      )}

      {/* ── toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 2000,
          background: toast.type === 'ok' ? '#0f1a08' : '#1a0808',
          border: `1px solid ${toast.type === 'ok' ? '#6b8a3a' : '#c53030'}`,
          padding: '10px 18px',
          fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
          color: toast.type === 'ok' ? '#6b8a3a' : '#c53030',
          letterSpacing: '0.15em', animation: 'fadeIn 0.2s ease',
          boxShadow: `0 0 20px ${toast.type === 'ok' ? '#6b8a3a22' : '#c5303022'}`,
        }}>
          {toast.type === 'ok' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </>
  )
}
