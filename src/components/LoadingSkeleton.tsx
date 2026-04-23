'use client'
import React from 'react'

// [FIX PERMANENTE - não remover]
// Skeleton centralizado aqui para que qualquer mudança de estilo afete tudo de uma vez.
// NUNCA substitua AppShellSkeleton por <div /> vazia — isso causa a tela preta de 2s.

export const skSt: React.CSSProperties = {
  background: 'linear-gradient(90deg,#1a1929 25%,#252436 50%,#1a1929 75%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.4s infinite linear',
  borderRadius: 5,
}

// Chamado como função: {Sk('60%', 20)} — não como <Sk /> para evitar remount
export const Sk = (w: string, h: number): React.ReactElement =>
  <div style={{ ...skSt, width: w, height: h }} />

// [FIX PERMANENTE - não remover]
// Exibido durante auth check E enquanto taxas do Supabase carrega.
// Mantém header "Holy Dash" visível + background #0a0918 escuro — nunca tela preta.
// Usado em AppLayout nos estados: !authReady e !taxasReady.
export function AppShellSkeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0918' }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 30, background: '#0f0e17', borderBottom: '1px solid #1e1d2e', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 22, height: 22, background: '#1e1d2e', borderRadius: 4 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>H</div>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>Holy Dash</span>
          </div>
        </header>
        <main style={{ flex: 1, padding: '18px 16px 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            {Array(7).fill(0).map((_, i) => (
              <div key={i} style={{ background: '#141320', border: '1px solid #1e1d2e', borderRadius: 14, padding: '14px 16px' }}>
                {(['55%', '72%', '40%'] as string[]).map((w, j) => (
                  <div key={j}>
                    {j > 0 && <div style={{ height: j === 1 ? 8 : 7 }} />}
                    <div style={{ width: w, height: j === 1 ? 22 : 9, borderRadius: 5, background: 'linear-gradient(90deg,#1a1929 25%,#252436 50%,#1a1929 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite linear' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
