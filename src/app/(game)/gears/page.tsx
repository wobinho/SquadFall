export default function GearsPage() {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.25em', color: '#8a8e96', textTransform: 'uppercase', marginBottom: '6px' }}>
          Inventory · Weapon Collection
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', letterSpacing: '0.04em', color: '#f2f0ea', lineHeight: 1 }}>
          Gears
        </h1>
      </div>
      <div style={{ background: '#14171c', border: '1px dashed #3a3f48', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.25em', color: '#5a5e66', textTransform: 'uppercase' }}>
          — Gears Coming Soon —
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#3a3f48', textTransform: 'uppercase', marginTop: '12px' }}>
          Weapons, modifiers, roll quality, and resource pools
        </div>
      </div>
    </div>
  )
}
