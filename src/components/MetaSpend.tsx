'use client'
import { useEffect } from 'react'

// [FIX PERMANENTE - não remover]
// Componente isolado para fetch do Meta Ads em background.
// Renderiza null — sem UI, só efeito colateral.
//
// Por que existe separado:
//   - Dashboard.tsx inicia metaSpend com taxas.meta_ads_hoje (sem skeleton)
//   - Este componente refina o valor silenciosamente quando a API responde
//   - Isolado aqui para que edições no Dashboard não quebrem acidentalmente
//     o fix do delay do lucro líquido
//
// NUNCA mova esta lógica para dentro de um useEffect genérico do Dashboard.
// NUNCA adicione estado de "loading" para o Meta — o lucro deve mostrar
// o valor de taxas.meta_ads_hoje imediatamente e atualizar sem piscar.

interface Props {
  filter: string
  onSpend: (value: number) => void
}

export function MetaSpend({ filter, onSpend }: Props) {
  useEffect(() => {
    let cancelled = false
    fetch(`/api/meta/spend?filter=${filter}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && typeof d.spend === 'number') {
          onSpend(d.spend)
          try { localStorage.setItem(`hd_meta_${filter}`, String(d.spend)) } catch {}
          // Salva meta_ads_hoje em hd_taxas para que próximo carregamento parta de valor atualizado
          if (filter === 'today') {
            try {
              const t = JSON.parse(localStorage.getItem('hd_taxas') || '{}')
              t.meta_ads_hoje = d.spend
              localStorage.setItem('hd_taxas', JSON.stringify(t))
            } catch {}
          }
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [filter])

  return null
}
