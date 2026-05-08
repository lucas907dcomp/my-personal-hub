---
story_id: STORY-007
epic_id: EPIC-001
title: "Sprint 6 — Hub Enhancements: Frontend & UX"
status: Done
priority: HIGH
sprint: 6
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [parity_checklist, bundle_audit]
depends_on: [STORY-006]
blocks: [STORY-008]
effort_estimate: "~3 dias"
created_by: Aria (@architect) — Sprint 6 Architecture Session
created_at: "2026-05-08"
---

# STORY-007 — Sprint 6: Hub Enhancements (Frontend & UX)

## Description

Conjunto de melhorias de alto impacto em todos os três hubs, puramente no frontend (com uma única migration backend para relaxar a constraint do RPE). Nenhuma nova tabela neste sprint — o foco é enriquecer a experiência visual e a utilidade imediata dos dados já existentes.

**ADR-017 — RPE opcional:**
`rpe` já é `Integer` nullable no backend (`Exercise.java`, `ExerciseDTO.java`, `CreateExerciseRequest.java`). A única mudança backend é a V12 que atualiza a CHECK constraint para `(rpe IS NULL OR rpe BETWEEN 1 AND 10)`. Frontend: `rpe: number` → `rpe: number | null` em `gym.ts`; label passa a mostrar "RPE (opcional)".

**ADR-018 — 1RM Epley:**
Fórmula: `weight * (1 + reps / 30)`, arredondado para 1 decimal. Exibido apenas quando `reps` é um inteiro puro (regex `/^\d+$/`) e `reps ≤ 20` (acima disso a fórmula perde precisão). Exibição: texto subdued abaixo dos inputs no ExerciseCard.

**ADR-019 — Stepper UX:**
Weight: `+2.5 / -2.5` kg (mínimo 0). Reps: `+1 / -1` apenas quando o valor atual é inteiro puro — o text input continua disponível para notação complexa ("3x10", "AMRAP"). Ambos os steppers chamam `onSave` imediatamente após o ajuste. Novo ícone "minus" adicionado ao `Icon.tsx`.

**ADR-020 — Fuel enhancements em calcFuelStats:**
Todos os três novos campos (`lastTankKmL`, `hasDegradationAlert`, `monthlyHistory`) são calculados dentro de `calcFuelStats`. Zero novas API calls. `hasDegradationAlert = true` quando `lastTankKmL < avgGlobal * 0.85` (15% abaixo).

**ADR-021 — Remove hardcoded personal data:**
Strings específicas do usuário original ("Java Pós-Graduação", "Foco Java Pós", "Estudo (Java)", "Carreira (LinkedIn)") substituídas por labels genéricos. Comportamento funcional preservado — apenas texto alterado.

## Acceptance Criteria

### AC-1: Gym Hub — RPE opcional (GH.1, GH.2, GH.3)

- [x] `V12__update_rpe_constraint.sql`: `DROP CONSTRAINT chk_exercises_rpe` + `ADD CONSTRAINT chk_exercises_rpe CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10)`
- [x] `gym.ts`: `rpe: number` → `rpe: number | null`
- [x] `RPEBadge.tsx`: aceita `value: number | null | undefined`; retorna `null` se valor ausente
- [x] `ExerciseCard.tsx`: label RPE mostra "RPE (opcional)"; input aceita valor vazio; salva `null` quando vazio
- [x] `AddExerciseForm.tsx`: RPE não é mais required; campo marcado como "(opcional)"
- [x] Backend `V12` migration aplicada; `./mvnw test` passa

### AC-2: Gym Hub — Stepper + 1RM (GH.4, GH.5)

- [x] `Icon.tsx`: novo ícone `minus` adicionado ao `IconName` union + `paths`
- [x] `ExerciseCard.tsx`: stepper weight — botões `−2.5` / `+2.5` flanqueando o input, chamam `onSave` imediatamente
- [x] `ExerciseCard.tsx`: stepper reps — botões `−1` / `+1` visíveis SOMENTE quando `reps` é inteiro puro (regex `/^\d+$/`)
- [x] `ExerciseCard.tsx`: 1RM exibido abaixo dos inputs quando reps ∈ [1, 20] e weight > 0 — formato: `~1RM: XX.X kg`
- [x] Stepper de weight: não permite ir abaixo de 0
- [x] 1RM ausente quando reps é "AMRAP", "3x10" ou similar (regex não captura)

### AC-3: Fuel Hub — Novos campos em calcFuelStats (FH.1, FH.2)

- [x] `fuel.ts`: interface `FuelStats` expandida com:
  - `lastTankKmL: number | null`
  - `hasDegradationAlert: boolean`
  - `monthlyHistory: MonthlyFuelRecord[]`
- [x] `fuel.ts`: nova interface `MonthlyFuelRecord { month: string; totalSpent: number; fillUps: number }`
- [x] `calcFuelStats`: `lastTankKmL` = km do último intervalo / liters do último registro (null se < 2 records)
- [x] `calcFuelStats`: `hasDegradationAlert` = `lastTankKmL !== null && lastTankKmL < avgGlobal * 0.85`
- [x] `calcFuelStats`: `monthlyHistory` agrupa por `date.substring(0, 7)`, ordenado mais recente primeiro
- [x] `calcFuelStats` default (< 2 records): `lastTankKmL: null`, `hasDegradationAlert: false`, `monthlyHistory: []`

### AC-4: Fuel Hub — Novos componentes visuais (FH.3, FH.4, FH.5)

- [x] `FuelLastTankCard.tsx`: exibe `lastTankKmL.toFixed(2) km/L` + badge se "acima" ou "abaixo" da média global
- [x] `FuelDegradationAlert.tsx`: banner âmbar visível somente quando `hasDegradationAlert === true` — mensagem: "⚠️ Último tanque rendeu 15%+ abaixo da sua média. Verifique pressão dos pneus ou qualidade do combustível."
- [x] `FuelMonthlyHistory.tsx`: lista colapsável dos meses — cada linha: "Mai 2026 · 3 abastecimentos · R$ 380,00"
- [x] `FuelPage.tsx`: integra os 3 novos componentes; `FuelLastTankCard` exibido somente quando `lastTankKmL !== null`
- [x] `FuelDegradationAlert` renderizado acima do formulário de add quando ativo

### AC-5: Productivity Hub — Remover dados pessoais hardcoded (PH.1)

- [x] `ProductivityPage.tsx`: subtítulo genérico — ex: "Organize sua rotina diária com foco e consistência."
- [x] `DashboardView.tsx`: "Foco Java Pós" → "Estudos"; comportamento (filtro `type === 'study'`) preservado
- [x] `AddTaskModal.tsx`: "Estudo (Java)" → "Estudo"; "Carreira (LinkedIn)" → "Carreira"
- [x] Zero regressão funcional — apenas texto alterado

## Tasks

| # | Task | ADR | Arquivo(s) Principais | Esforço |
|---|------|-----|----------------------|---------|
| GH.1 | V12: RPE constraint nullable | ADR-017 | `V12__update_rpe_constraint.sql` | 15min |
| GH.2 | `gym.ts` + `RPEBadge` adaptados para `rpe: number \| null` | ADR-017 | `gym.ts`, `RPEBadge.tsx` | 20min |
| GH.3 | `ExerciseCard` + `AddExerciseForm`: RPE opcional | ADR-017 | `ExerciseCard.tsx`, `AddExerciseForm.tsx` | 30min |
| GH.4 | Icon `minus` + steppers weight/reps no `ExerciseCard` | ADR-019 | `Icon.tsx`, `ExerciseCard.tsx` | 1h |
| GH.5 | 1RM Epley no `ExerciseCard` | ADR-018 | `ExerciseCard.tsx` | 30min |
| FH.1 | `fuel.ts`: expandir `FuelStats` + `MonthlyFuelRecord` | ADR-020 | `fuel.ts` | 15min |
| FH.2 | `calcFuelStats`: `lastTankKmL`, `hasDegradationAlert`, `monthlyHistory` | ADR-020 | `fuelStats.ts` | 45min |
| FH.3 | `FuelLastTankCard.tsx` | ADR-020 | novo componente | 30min |
| FH.4 | `FuelDegradationAlert.tsx` | ADR-020 | novo componente | 20min |
| FH.5 | `FuelMonthlyHistory.tsx` + integração em `FuelPage` | ADR-020 | novo componente, `FuelPage.tsx` | 45min |
| PH.1 | Remove strings pessoais hardcoded | ADR-021 | `ProductivityPage.tsx`, `DashboardView.tsx`, `AddTaskModal.tsx` | 15min |

**Esforço total estimado: ~5–6h**

## Exit Gate

```
□ V12 migration aplicada; ./mvnw test verde
□ RPE aceita valor vazio sem erros de validação (frontend + backend)
□ Steppers de weight e reps funcionais no ExerciseCard
□ 1RM exibido para reps inteiro; ausente para "AMRAP", "3x10"
□ FuelDegradationAlert visível quando último tanque < 85% da média
□ FuelMonthlyHistory agrupa corretamente por mês
□ Nenhuma string pessoal hardcoded no código
□ Bundle gz ≤ 200 KB (vite build)
□ Zero erros TypeScript (tsc -b)
```

## Migrations

### V12 — Update RPE constraint to allow NULL
```sql
-- Relaxa constraint para tornar RPE opcional
ALTER TABLE tb_gym_exercises
    DROP CONSTRAINT IF EXISTS chk_exercises_rpe;

ALTER TABLE tb_gym_exercises
    ADD CONSTRAINT chk_exercises_rpe
    CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10);
```

## Riscos

| Risco | Mitigação |
|-------|-----------|
| `RPEBadge` recebe `null` e quebra | Guard `if (!value) return null` no topo do componente |
| Stepper salva para o backend a cada clique (muitas requests) | `onSave` após debounce de 300ms ou apenas no `onBlur` — avaliar no ExerciseCard |
| `lastTankKmL` negativo por odômetro fora de ordem | Guard: `segmentDistance > 0` antes do cálculo |

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (Dex @dev)

### File List
**Created:**
- `src/main/resources/db/migration/V12__update_rpe_constraint.sql`
- `gym-hub/src/components/fuel/FuelLastTankCard.tsx`
- `gym-hub/src/components/fuel/FuelDegradationAlert.tsx`
- `gym-hub/src/components/fuel/FuelMonthlyHistory.tsx`

**Modified:**
- `gym-hub/src/components/gym/Icon.tsx` (add `minus`)
- `gym-hub/src/components/gym/RPEBadge.tsx` (`value: number | null | undefined`)
- `gym-hub/src/components/gym/ExerciseCard.tsx` (steppers + 1RM + RPE opcional)
- `gym-hub/src/components/gym/AddExerciseForm.tsx` (RPE opcional)
- `gym-hub/src/types/gym.ts` (`rpe: number | null`)
- `gym-hub/src/types/fuel.ts` (expand `FuelStats`)
- `gym-hub/src/lib/fuelStats.ts` (3 novos campos)
- `gym-hub/src/pages/FuelPage.tsx` (integra novos componentes)
- `gym-hub/src/pages/ProductivityPage.tsx` (subtítulo genérico)
- `gym-hub/src/components/productivity/DashboardView.tsx` (rename "Estudos")
- `gym-hub/src/components/productivity/AddTaskModal.tsx` (labels genéricos)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | Story criada | Aria (@architect) |
| 2026-05-08 | Implementação completa — GH.1-5, FH.1-5, PH.1. TypeScript: 0 erros. Bundle gz: ~186 KB. | Dex (@dev) |
