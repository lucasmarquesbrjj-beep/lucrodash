// Orquestrador — não contém lógica de negócio.
// Toda a lógica de auth, layout, dashboard e fixes permanentes estão nos componentes:
//   src/components/AppLayout.tsx   — auth, sidebar, header, fix tela preta
//   src/components/Dashboard.tsx   — KPIs, gráficos, fix delay lucro
//   src/components/MetaSpend.tsx   — fetch Meta Ads em background
//   src/components/LoadingSkeleton.tsx — skeletons reutilizáveis
import AppLayout from '@/components/AppLayout'
export default AppLayout
