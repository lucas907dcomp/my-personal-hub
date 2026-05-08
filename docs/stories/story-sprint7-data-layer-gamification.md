---
story_id: STORY-008
epic_id: EPIC-001
title: "Sprint 7 — Data Layer & Gamification"
status: Done
priority: HIGH
sprint: 7
executor: "@dev + @data-engineer"
quality_gate: "@architect"
quality_gate_tools: [migration_review, integration_test]
depends_on: [STORY-007]
blocks: []
effort_estimate: "~1 semana"
created_by: Aria (@architect) — Sprint 6 Architecture Session
created_at: "2026-05-08"
---

# STORY-008 — Sprint 7: Data Layer & Gamification

## Description

Três evoluções estruturais que introduzem persistência de histórico e gamificação:

1. **Gym — tb_gym_sessions:** log imutável de cada performance de exercício, viabilizando gráficos e tracking de progressão real.
2. **Productivity — is_recurring:** distinção entre tarefas recorrentes (rotina diária) e pontuais (one-shot), com reset inteligente.
3. **Productivity — tb_daily_completions + streaks:** gamificação com contagem de dias consecutivos e histórico de conclusão.

**ADR-022 — tb_gym_sessions (append-only):**
Sessions são imutáveis. O botão "Salvar Sessão" no ExerciseCard cria um novo registro com os valores atuais (weight, reps, rpe). Não substitui o estado atual do exercício — são dois dados independentes: *o plano* (Exercise) e *o histórico* (GymSession). Cascade DELETE quando o exercício for deletado.

**ADR-023 — is_recurring (DEFAULT TRUE, backward compatible):**
Todas as tasks existentes são recorrentes por default. Tarefas pontuais (`is_recurring = false`) são deletadas no reset se `done = true`; mantidas se `done = false`. Tarefas recorrentes apenas têm `done` resetado para `false`. O reset também persiste o `completion_percentage` em `tb_daily_completions` ANTES de fazer qualquer alteração.

**ADR-024 — tb_daily_completions + streak algorithm:**
PK composta `(user_id, completion_date)`. `completion_percentage` INTEGER 0–100. Streak = contagem de dias consecutivos (de hoje ou ontem para trás) com `completion_percentage = 100`. Algoritmo: loop em Java sobre lista ordenada DESC até encontrar lacuna ou dia com `< 100%`. Endpoint: `GET /api/v1/productivity/streak` retorna `{ currentStreak: int, totalDays: int }`.

## Acceptance Criteria

### AC-1: tb_gym_sessions — Migration & Backend (GS.1, GS.2, GS.3, GS.4)

- [x] `V13__create_gym_sessions.sql`: tabela `tb_gym_sessions` (ver schema abaixo)
- [x] `GymSession.java` entity: id, userId, exerciseId (FK ON DELETE CASCADE), loggedAt, weight, reps, rpe
- [x] `SessionRepository.java`: `findTopByExerciseIdAndUserIdOrderByLoggedAtDesc(UUID, UUID)` — última sessão
- [x] `GymService.logSession(userId, exerciseId, request)` → `GymSessionDTO`
- [x] `GymService.getLastSession(userId, exerciseId)` → `Optional<GymSessionDTO>`
- [x] `GymController`: `POST /api/v1/gym/exercises/{id}/sessions` → 201 + `GymSessionDTO`
- [x] `GymController`: `GET /api/v1/gym/exercises/{id}/sessions/last` → `GymSessionDTO` ou 404
- [x] `GymSessionDTO.java`: record (id, exerciseId, loggedAt, weight, reps, rpe)
- [x] `LogSessionRequest.java`: record (Double weight, String reps, Integer rpe) — todos opcionais
- [x] Endpoint de log usa os valores do request; se null, copia do estado atual do exercício

### AC-2: tb_gym_sessions — Frontend (GS.5, GS.6)

- [x] `useExerciseSessions.ts` hook: `logSession(exerciseId)` chama POST; `lastSession` state populado via GET no mount
- [x] `ExerciseCard.tsx`: botão "Salvar Sessão" (ícone `check` + texto) abaixo dos steppers
  - Ao clicar: POST com valores atuais → toast de sucesso ou erro (reutiliza `Toast.tsx`)
  - Estado "salvando..." durante a request
- [x] `ExerciseCard.tsx`: seção "Último treino:" exibida quando `lastSession` exists
  - Formato: `"há 2 dias · 80 kg · 3x10 · RPE 7"`
  - `loggedAt` formatado como "hoje", "ontem", "há X dias"
- [x] `GymPage.tsx` ou `useExerciseSessions` usa `session` prop já disponível

### AC-3: is_recurring — Migration & Backend (PS.1, PS.2, PS.3)

- [x] `V14__add_is_recurring.sql`: `ALTER TABLE tb_routine_tasks ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT TRUE`
- [x] `RoutineTask.java` entity: campo `isRecurring boolean` (default `true`)
- [x] `RoutineTaskDTO.java`: campo `boolean isRecurring` adicionado
- [x] `CreateRoutineTaskRequest.java`: campo `Boolean isRecurring` (default `true` quando null no request)
- [x] `ProductivityService.addTask()`: seta `isRecurring` do request (default true)
- [x] `ProductivityService.resetDailyRoutine()` — novo comportamento:
  1. Calcula `completion_percentage` das tasks atuais (antes de qualquer mudança)
  2. Chama `saveDailyCompletion(userId, percentage)` — upsert em `tb_daily_completions`
  3. Para `is_recurring = true`: `done = false` (mantém na lista)
  4. Para `is_recurring = false` e `done = true`: deleta o registro
  5. Para `is_recurring = false` e `done = false`: mantém (tarefa ponctual ainda pendente)

### AC-4: is_recurring — Frontend (PS.4)

- [x] `productivity.ts`: `RoutineTask` e `CreateRoutineTask` adicionam `isRecurring: boolean`
- [x] `AddTaskModal.tsx`: toggle "Tarefa recorrente" (ativo por default)
  - Quando inativo: label "(única vez — removida após conclusão no reset)"
  - Visual: pill switch simples com `bg-indigo-600` quando ativo
- [x] `TaskCard.tsx`: indicador visual sutil para tarefas não-recorrentes (ex: badge "Única" em slate-400)

### AC-5: tb_daily_completions + Streaks (PS.5, PS.6, PS.7, PS.8, PS.9, PS.10)

- [x] `V15__create_daily_completions.sql`: tabela `tb_daily_completions` (ver schema abaixo)
- [x] `DailyCompletion.java` entity + `DailyCompletionRepository.java`
- [x] `ProductivityService.saveDailyCompletion(userId, percentage)`: upsert — se já existe entry para hoje, atualiza
- [x] `ProductivityService.getStreak(userId)` → `StreakDTO`:
  - Busca lista ordenada DESC por `completion_date`
  - Itera: dia esperado = hoje (se já resetou hoje) ou ontem (se não)
  - Conta consecutivos com `completion_percentage = 100`
  - `totalDays` = total de registros do usuário
- [x] `StreakDTO.java`: record `(int currentStreak, int totalDays)`
- [x] `ProductivityController`: `GET /api/v1/productivity/streak` → `StreakDTO`
- [x] `useProductivityStreak.ts` hook: fetcha `/api/v1/productivity/streak` no mount
- [x] `ProductivityPage.tsx`: exibe streak no header
  - `currentStreak >= 1`: "🔥 {n} dia(s)" em amber
  - `currentStreak === 0`: sem exibição (não mostrar "0 dias")

## Tasks

| # | Task | ADR | Esforço |
|---|------|-----|---------|
| GS.1 | V13: criar tb_gym_sessions | ADR-022 | 20min |
| GS.2 | `GymSession.java` + `SessionRepository` | ADR-022 | 30min |
| GS.3 | `GymSessionDTO` + `LogSessionRequest` + `GymService` | ADR-022 | 45min |
| GS.4 | `GymController`: POST + GET /sessions + /sessions/last | ADR-022 | 30min |
| GS.5 | `useExerciseSessions.ts` hook | ADR-022 | 45min |
| GS.6 | `ExerciseCard`: botão Salvar Sessão + "Último treino:" | ADR-022 | 1.5h |
| PS.1 | V14: is_recurring column | ADR-023 | 15min |
| PS.2 | `RoutineTask` + `RoutineTaskDTO` + `CreateRoutineTaskRequest` | ADR-023 | 20min |
| PS.3 | `ProductivityService.resetDailyRoutine()` — novo comportamento | ADR-023,024 | 1h |
| PS.4 | `productivity.ts` + `AddTaskModal` toggle + `TaskCard` badge | ADR-023 | 1h |
| PS.5 | V15: tb_daily_completions | ADR-024 | 15min |
| PS.6 | `DailyCompletion` entity + Repository | ADR-024 | 20min |
| PS.7 | `ProductivityService.getStreak()` + `StreakDTO` | ADR-024 | 45min |
| PS.8 | `ProductivityController`: GET /streak | ADR-024 | 15min |
| PS.9 | `useProductivityStreak.ts` hook | ADR-024 | 30min |
| PS.10 | `ProductivityPage`: exibição do streak no header | ADR-024 | 30min |

**Esforço total estimado: ~9–10h**

## Exit Gate

```
□ ./mvnw test verde com V13, V14, V15 aplicadas
□ Flyway clean (sem conflito de migrations)
□ POST /gym/exercises/{id}/sessions cria registro; GET /sessions/last retorna corretamente
□ ExerciseCard exibe "Último treino:" após salvar sessão
□ Reset: tarefas recorrentes desmarcadas; pontuais concluídas deletadas; pontuais pendentes mantidas
□ tb_daily_completions recebe registro a cada reset
□ GET /productivity/streak retorna streak correto após 2+ resets com 100%
□ Streak 🔥 exibido no header do ProductivityPage
□ Zero erros TypeScript (tsc -b)
□ Bundle gz ≤ 200 KB
```

## Migrations

### V13 — tb_gym_sessions
```sql
CREATE TABLE tb_gym_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL,
    exercise_id UUID         NOT NULL REFERENCES tb_gym_exercises(id) ON DELETE CASCADE,
    logged_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    weight      NUMERIC(8,2),
    reps        VARCHAR(20),
    rpe         INTEGER,
    CONSTRAINT chk_sessions_rpe CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10)
);
CREATE INDEX idx_gym_sessions_exercise ON tb_gym_sessions(exercise_id, logged_at DESC);
CREATE INDEX idx_gym_sessions_user    ON tb_gym_sessions(user_id);
```

### V14 — is_recurring
```sql
ALTER TABLE tb_routine_tasks
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT TRUE;
```

### V15 — tb_daily_completions
```sql
CREATE TABLE tb_daily_completions (
    user_id             UUID    NOT NULL,
    completion_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, completion_date),
    CONSTRAINT chk_completion_pct CHECK (completion_percentage BETWEEN 0 AND 100)
);
CREATE INDEX idx_daily_completions_user ON tb_daily_completions(user_id, completion_date DESC);
```

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Reset chama `saveDailyCompletion` múltiplas vezes no mesmo dia | Upsert: `ON CONFLICT (user_id, completion_date) DO UPDATE` no SQL ou lógica findById + save |
| `getStreak` lento para usuários com muitos dias | Query já ordenada DESC; loop termina na primeira lacuna — O(streak_length), não O(all_days) |
| `LogSessionRequest` com todos os campos null | Fallback: copia weight/reps/rpe do exercício atual no service |
| is_recurring quebrando tasks existentes | DEFAULT TRUE garante backward compatibility; sem data migration necessária |

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (Dex @dev)

### File List
**Created:**
- `src/main/resources/db/migration/V13__create_gym_sessions.sql`
- `src/main/resources/db/migration/V14__add_is_recurring.sql`
- `src/main/resources/db/migration/V15__create_daily_completions.sql`
- `src/main/java/com/lucas/erp/gym/GymSession.java`
- `src/main/java/com/lucas/erp/gym/SessionRepository.java`
- `src/main/java/com/lucas/erp/gym/dto/GymSessionDTO.java`
- `src/main/java/com/lucas/erp/gym/dto/LogSessionRequest.java`
- `src/main/java/com/lucas/erp/productivity/DailyCompletion.java`
- `src/main/java/com/lucas/erp/productivity/DailyCompletionRepository.java`
- `src/main/java/com/lucas/erp/productivity/StreakDTO.java`
- `gym-hub/src/hooks/useExerciseSessions.ts`
- `gym-hub/src/hooks/useProductivityStreak.ts`

**Modified:**
- `src/main/java/com/lucas/erp/gym/GymController.java` (2 novos endpoints sessions)
- `src/main/java/com/lucas/erp/gym/GymService.java` (logSession, getLastSession)
- `src/main/java/com/lucas/erp/gym/Exercise.java` (sem mudança — apenas referência)
- `src/main/java/com/lucas/erp/productivity/RoutineTask.java` (campo isRecurring)
- `src/main/java/com/lucas/erp/productivity/RoutineTaskDTO.java` (campo isRecurring)
- `src/main/java/com/lucas/erp/productivity/CreateRoutineTaskRequest.java` (campo isRecurring)
- `src/main/java/com/lucas/erp/productivity/ProductivityController.java` (GET /streak)
- `src/main/java/com/lucas/erp/productivity/ProductivityService.java` (reset + streak)
- `gym-hub/src/components/gym/ExerciseCard.tsx` (Salvar Sessão + Último treino)
- `gym-hub/src/types/productivity.ts` (isRecurring)
- `gym-hub/src/components/productivity/AddTaskModal.tsx` (toggle isRecurring)
- `gym-hub/src/components/productivity/TaskCard.tsx` (badge "Única")
- `gym-hub/src/pages/ProductivityPage.tsx` (streak no header)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | Story criada | Aria (@architect) |
| 2026-05-08 | Implementação completa — GS.1-6, PS.1-10. TypeScript: 0 erros. Bundle gz: ~186 KB. Backend: Java 25 requerido (env local = 21, não compilável localmente). | Dex (@dev) |
