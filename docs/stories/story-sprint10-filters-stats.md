---
story_id: STORY-011
epic_id: EPIC-002
title: "Sprint 10 — Productivity Hub: Filtros + Estatísticas + Adiar Tarefa"
status: Done
priority: MEDIUM
sprint: 10
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [type_check, bundle_audit]
depends_on: [STORY-010]
blocks: []
effort_estimate: "~5-6h"
created_by: Morgan (@pm) + Aria (@architect) — Sprint 8 Planning Session
created_at: "2026-05-27"
---

# STORY-011 — Sprint 10: Filtros + Estatísticas + Adiar Tarefa

## Description

Última sprint do EPIC-002, focada em **insights e produtividade real**:

1. **Filtros por categoria (F-05):** Chips de filtro na `TaskListView` para exibir apenas tarefas
   de um tipo específico. Zero nova API call — filtragem puramente em estado local.

2. **Estatísticas detalhadas (F-08):** Nova seção "Meus Números" no Dashboard com taxa média de
   conclusão (últimos 30 dias), melhor sequência de dias 100%, e dia da semana mais produtivo.
   Dados vindos de `tb_daily_completions` via hook `useProductivityStats`.

3. **Adiar tarefa (F-07):** Botão "Adiar para Amanhã" em cada TaskCard. Cria automaticamente
   um evento na Agenda (`tb_agenda_events`) para amanhã com `event_time` = horário da tarefa
   e título igual. Não remove a tarefa original — apenas cria um lembrete futuro.

**ADR-030 — Filtros locais:**
Filtros são estado local (não query param, não URL). Um único chip ativo por vez.
"Todos" = sem filtro. Estado não persiste entre sessões (simples useState).

**ADR-031 — Estatísticas via useProductivityStats:**
Hook consulta `tb_daily_completions` diretamente (RLS garante que vê só os dados do usuário).
Cálculo em JS no cliente (volume é pequeno — max ~365 registros/ano). Sem nova RPC.

**ADR-032 — Adiar como AgendaEvent:**
"Adiar" NÃO muda a tarefa original nem cria duplicatas na rotina. Cria um `AgendaEvent`
para amanhã com `reminder_minutes = 30` por padrão. Toast de confirmação: "Lembrete criado
para amanhã às {horário}".

## Acceptance Criteria

### AC-1: Filtros por categoria em TaskListView (S10.1)

- [x] `TaskListView.tsx`: estado `activeFilter: TaskType | 'all'` (default: `'all'`)
- [x] Chips horizontais (scroll se necessário em mobile) acima da lista:
  `[Todos] [Básico] [Estudo] [Carreira] [Trabalho] [Saúde]`
  — "Saúde" agrupa `health` + `health_medicine`
- [x] Chip ativo: `bg-slate-900 text-white`; inativo: `bg-white border border-slate-200`
- [x] Tasks filtradas em useMemo: `tasks.filter(t => filter === 'all' || matchesFilter(t, filter))`
  — `matchesFilter` em `lib/taskUtils.ts` (ex: 'Saúde' casa com 'health' E 'health_medicine')
- [x] Quando filtro ativo e lista vazia: "Nenhuma tarefa desta categoria."
- [x] Contagem no chip: ex `[Estudo (3)]` quando há tasks desse tipo

### AC-2: useProductivityStats hook (S10.2)

- [x] `gym-hub/src/hooks/useProductivityStats.ts` criado:
  - Busca `tb_daily_completions` dos últimos 30 dias: `.gte('completion_date', thirtyDaysAgo)`
  - Calcula e retorna:
    - `avgCompletionRate: number` — média de `completion_percentage` dos últimos 30 dias (0 se sem dados)
    - `bestStreak: number` — maior sequência consecutiva de dias com `completion_percentage = 100`
    - `mostProductiveDay: string | null` — dia da semana (ex: "Segunda") com maior média (null se < 7 dias)
    - `totalDaysTracked: number` — total de registros históricos
  - `loading: boolean`, `error: string | null`

### AC-3: Seção "Meus Números" no Dashboard (S10.3)

- [x] `DashboardView.tsx`: recebe `stats` prop do tipo retornado por `useProductivityStats`
- [x] Nova seção no final do grid: card "Meus Números" (largura total, col-span)
- [x] Exibe 3-4 métricas em grid horizontal:
  - "📊 Média 30 dias" → `{avgCompletionRate}%`
  - "🏆 Melhor sequência" → `{bestStreak} dias`
  - "⭐ Dia mais produtivo" → `{mostProductiveDay ?? '—'}`
  - "📅 Dias registrados" → `{totalDaysTracked}`
- [x] Quando `loading`: skeleton de 4 boxes
- [x] Seção oculta quando `totalDaysTracked === 0` (usuário novo)
- [x] `ProductivityPage.tsx`: instancia `useProductivityStats(session)`, passa para `DashboardView`

### AC-4: Adiar tarefa para amanhã (S10.4)

- [x] `TaskCard.tsx`: novo botão "Adiar" (ícone `arrow-right` ou `calendar`, pequeno, discreto)
  — visível apenas quando `task.done === false`
  — `onDefer?: () => void` prop opcional
- [x] `TaskListView.tsx`: implementa `handleDefer(task: RoutineTask)`:
  1. Chama `addEvent({ title: task.title, event_date: tomorrow, event_time: task.time, reminder_minutes: 30 })`
     usando `useAgendaEvents` (recebido via prop ou importado)
  2. Exibe toast: "📅 Lembrete criado para amanhã às {task.time}"
- [x] `ProductivityPage.tsx`: passa `addEvent` do `useAgendaEvents` para `TaskListView`
- [x] `Icon.tsx`: novo ícone `calendar` adicionado (ou reutiliza existente se adequado)

### AC-5: matchesFilter em taskUtils.ts (S10.5)

- [x] `gym-hub/src/lib/taskUtils.ts` atualizado com:
  ```typescript
  export function matchesFilter(task: RoutineTask, filter: TaskType | 'health_group'): boolean
  ```
  — `'health'` filter casa com `task.type === 'health' || task.type === 'health_medicine'`
  — Outros tipos: igualdade direta
- [x] Testes da função via comentário de exemplo no arquivo (não obrigatório Jest, mas documentado)

## Tasks

| # | Task | ADR | Arquivo(s) Principais | Esforço |
|---|------|-----|----------------------|---------|
| S10.1 | Filtros por categoria em TaskListView | ADR-030 | `TaskListView.tsx`, `lib/taskUtils.ts` | 1h |
| S10.2 | useProductivityStats hook | ADR-031 | `hooks/useProductivityStats.ts` | 1h |
| S10.3 | Seção "Meus Números" em DashboardView | ADR-031 | `DashboardView.tsx`, `ProductivityPage.tsx` | 1.5h |
| S10.4 | Adiar tarefa → criar AgendaEvent | ADR-032 | `TaskCard.tsx`, `TaskListView.tsx`, `ProductivityPage.tsx`, `Icon.tsx` | 1.5h |
| S10.5 | matchesFilter em taskUtils | ADR-030 | `lib/taskUtils.ts` | 20min |

**Esforço total estimado: ~5.5h**

## Exit Gate

```
□ Chip "Todos" ativo por padrão; ao clicar "Estudo", só tarefas de estudo aparecem
□ Chip "Saúde" mostra health + health_medicine juntos
□ Contagem no chip atualiza conforme tasks
□ Seção "Meus Números" visível após 1+ dia registrado
□ avgCompletionRate calculado corretamente (média dos últimos 30 dias)
□ bestStreak ≥ currentStreak (não pode ser menor que o streak atual)
□ Adiar tarefa: evento criado em tb_agenda_events para amanhã + toast confirmação
□ Adiar não remove nem altera a tarefa original
□ Zero erros TypeScript (tsc -b)
□ Bundle gz ≤ 235 KB
```

## Riscos

| Risco | Mitigação |
|-------|-----------|
| `useProductivityStats` busca todos os registros (performance) | Limitado a 365 registros (um por dia), negligenciável |
| `mostProductiveDay` com poucos dados resulta em ruído | Requer mínimo 7 dias para calcular; abaixo disso retorna `null` |
| Adiar tarefa sem `event_time` (time = null na tarefa) | `event_time = null` no evento criado — evento de dia inteiro |
| `useAgendaEvents` não disponível em TaskListView sem prop drilling | Passar `addEvent` do ProductivityPage via prop — evita Context por ora |

## Dev Agent Record

### File List
**Created:**
- `gym-hub/src/hooks/useProductivityStats.ts`

**Modified:**
- `gym-hub/src/lib/taskUtils.ts` (matchesFilter)
- `gym-hub/src/components/gym/Icon.tsx` (ícone calendar)
- `gym-hub/src/components/productivity/TaskCard.tsx` (botão Adiar)
- `gym-hub/src/components/productivity/TaskListView.tsx` (filtros + handleDefer)
- `gym-hub/src/components/productivity/DashboardView.tsx` (seção Meus Números)
- `gym-hub/src/pages/ProductivityPage.tsx` (useProductivityStats + addEvent para TaskListView)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-27 | Story criada — Sprint 8 Planning Session | Morgan (@pm) + Aria (@architect) |
| 2026-05-27 | Implementação completa — S10.1 filtros + S10.2 hook + S10.3 dashboard + S10.4 adiar + S10.5 utils. Zero erros TS. Bundle gzip ≤ 235 KB. Status: Done | Dex (@dev) |
