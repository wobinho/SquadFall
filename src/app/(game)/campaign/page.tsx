export default function CampaignPage() {
  return <PlaceholderPage title="Campaign" sub="Story Mode · Narrative Progress" accent="#6a7d5a" desc="Story missions, narrative events, and campaign progression" />
}

function PlaceholderPage({ title, sub, accent, desc }: { title: string; sub: string; accent: string; desc: string }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', marginBottom: '6px' }}>
          {sub}
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', letterSpacing: '0.04em', color: '#f2f0ea', lineHeight: 1 }}>
          {title}
        </h1>
      </div>
      <div style={{ background: '#14171c', border: '1px dashed #3a3f48', padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.25em', color: '#5a5e66', textTransform: 'uppercase' }}>
          — {title} Coming Soon —
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: '#3a3f48', textTransform: 'uppercase', marginTop: '12px' }}>
          {desc}
        </div>
      </div>
    </div>
  )
}
