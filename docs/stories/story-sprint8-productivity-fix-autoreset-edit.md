---
story_id: STORY-009
epic_id: EPIC-002
title: "Sprint 8 — Productivity Hub: Fix Técnico + Auto-reset + Edição de Tarefa"
status: Done
priority: HIGH
sprint: 8
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [type_check, bundle_audit]
depends_on: [STORY-008]
blocks: [STORY-010]
effort_estimate: "~6h"
created_by: Morgan (@pm) + Aria (@architect) — Sprint 8 Planning Session
created_at: "2026-05-27"
---

# STORY-009 — Sprint 8: Productivity Hub Fix Técnico + Auto-reset + Edição

## Description

Três melhorias de fundação no Productivity Hub, todas Supabase-native:

1. **Fix técnico (ADR-028):** Elimina duplicação de `getTaskIcon`, expande `TaskType` com novo subtipo
   `health_medicine` (elimina lógica frágil baseada em `title.includes`), e melhora UX com skeletons de loading.

2. **Auto-reset diário (ADR-025):** O hub reseta a rotina automaticamente quando o dia vira — sem
   intervenção manual. Implementado via nova tabela `tb_user_settings` e RPC `check_and_auto_reset()`.
   O botão "Reset Diário" continua existindo como override explícito.

3. **Edição de tarefa (ADR-029):** Usuário pode editar título, horário, tipo e recorrência de uma tarefa
   existente. Reutiliza `AddTaskModal` em modo `edit`. Novo ícone `pencil` em `Icon.tsx`.

**ADR-025 — Auto-reset com tb_user_settings:**
`last_reset_date` por usuário. `check_and_auto_reset()` verifica no mount se `last_reset_date < today`.
Se sim: salva completion% de ontem em `tb_daily_completions`, reseta tasks, atualiza `last_reset_date = today`.
`reset_daily_routine()` atualizado para também gravar `last_reset_date`. Data explícita passada para
`tb_daily_completions` para evitar salvar 0% no dia atual.

**ADR-028 — Fix técnico:**
`getTaskIcon` extraída para `lib/taskUtils.ts`. `TaskType` expandido: mantém `'health'` (backward compat)
para tasks existentes, adiciona `'health_medicine'` para remédios. `getTaskIcon` usa o type, não o título.
`AddTaskModal` exibe: "Saúde / Fitness" (`health`) e "Saúde / Remédio" (`health_medicine`).

**ADR-029 — Edição de tarefa:**
`updateTask(id, payload)` em `useProductivityTasks`. `AddTaskModal` aceita `mode?: 'create' | 'edit'` e
`initialValues?: RoutineTask`. `TaskCard` ganha botão de editar (ícone `pencil`). Edição inline na
`TaskListView` (abre modal pré-preenchido).

## Acceptance Criteria

### AC-1: SQL — tb_user_settings + RPCs atualizadas (S8.DB)

- [ ] `supabase-rls-setup.sql` atualizado com:
  - `tb_user_settings`: `user_id UUID PK`, `last_reset_date DATE DEFAULT CURRENT_DATE`,
    `timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo'`, `created_at`, `updated_at`
  - RLS: `ALTER TABLE tb_user_settings ENABLE ROW LEVEL SECURITY`
  - Policy: `CREATE POLICY "user_settings" ON tb_user_settings FOR ALL USING (auth.uid() = user_id)`
  - Trigger `updated_at` reutilizando `shared_set_updated_at()`
  - RPC `check_and_auto_reset()`: verifica `last_reset_date < CURRENT_DATE`, salva completion%
    para `last_reset_date` (não para hoje), reseta tasks, atualiza `last_reset_date = CURRENT_DATE`
  - RPC `reset_daily_routine()` atualizada: inclui upsert em `tb_user_settings` com
    `last_reset_date = CURRENT_DATE` ao final
- [ ] Arquivo `supabase-delta-sprint8.sql` criado em `docs/database/` com APENAS as instruções
  delta (o que precisa ser rodado no Supabase SQL Editor para este sprint)

### AC-2: taskUtils.ts — Single source of truth para ícones (S8.1)

- [ ] `gym-hub/src/lib/taskUtils.ts` criado com:
  - `getTaskIcon(task: RoutineTask): JSX.Element` exportada
  - Lógica: `health_medicine` → `<Icon name="pill" />`, `health` → `<Icon name="fitness" />`,
    `study` → `<Icon name="code" />`, `career` → `<Icon name="linkedin" />`,
    `work` → `<Icon name="briefcase" />`, default → `<Icon name="clock" />`
  - ZERO lógica baseada em `task.title`
- [ ] `getTaskIcon` removida de `TaskCard.tsx` (importa de `taskUtils`)
- [ ] `getTaskIcon` removida de `DashboardView.tsx` (importa de `taskUtils`)

### AC-3: Expansão de TaskType (S8.2)

- [ ] `productivity.ts`: `TaskType = 'basic' | 'study' | 'career' | 'work' | 'health' | 'health_medicine'`
- [ ] `AddTaskModal.tsx`: seletor inclui `health_medicine` → label "Saúde / Remédio"
  e `health` → label "Saúde / Fitness" (era "Saúde / Fitness" antes — confirmar label)
- [ ] `useProductivityTasks.ts`: `mapTask` aceita `health_medicine` como type válido (já funciona
  por ser varchar, mas tipar corretamente)

### AC-4: Loading/Error states (S8.3)

- [ ] `useProductivityTasks.ts`: expõe `error: string | null` (além do `loading` já existente)
  — seta `error` no catch do `load()`
- [ ] `useProductivityNote.ts`: expõe `error: string | null`
- [ ] `TaskListView.tsx`: quando `loading === true`, renderiza 3 skeleton cards
  (div com `animate-pulse bg-slate-100 rounded-3xl h-20`)
- [ ] `DashboardView.tsx`: quando tasks ainda carregando, skeleton no card "Próximo Passo"

### AC-5: Auto-reset diário (S8.4)

- [ ] `useProductivityTasks.ts`: no início de `load()`, chama `supabase.rpc('check_and_auto_reset')`
  ANTES do `SELECT` das tasks — erro de auto-reset é logado mas não bloqueia o load
- [ ] Comportamento: ao abrir o app no dia seguinte, tasks aparecem já resetadas — sem precisar
  clicar "Reset Diário"
- [ ] `check_and_auto_reset()` é idempotente: chamadas múltiplas no mesmo dia não alteram nada
- [ ] Botão "Reset Diário" continua funcional como override explícito (mesmo dia, força reset
  e salva completion% do momento)

### AC-6: Edição de tarefa (S8.5)

- [ ] `Icon.tsx`: novo ícone `pencil` adicionado ao `IconName` union + `paths`
- [ ] `useProductivityTasks.ts`: nova função `updateTask(id: string, payload: Partial<CreateRoutineTask>): Promise<void>`
  — `supabase.from('tb_routine_tasks').update({...}).eq('id', id)`, atualiza state local
- [ ] `AddTaskModal.tsx`: props adicionadas: `mode?: 'create' | 'edit'`, `initialValues?: RoutineTask`
  — quando `mode === 'edit'`: pré-popula todos os campos, botão mostra "SALVAR ALTERAÇÕES"
  — título do modal: "Nova Tarefa" vs "Editar Tarefa"
- [ ] `TaskCard.tsx`: botão de editar (ícone `pencil`, tamanho w-10 h-10) adicionado à direita
  do botão de deletar — props: `onEdit: () => void`
- [ ] `TaskListView.tsx`: estado `editingTask: RoutineTask | null` — ao clicar editar em um TaskCard,
  abre `AddTaskModal mode="edit" initialValues={editingTask}` — ao salvar, chama `updateTask`

## Tasks

| # | Task | ADR | Arquivo(s) Principais | Esforço |
|---|------|-----|----------------------|---------|
| S8.DB | SQL: tb_user_settings + check_and_auto_reset + reset_daily_routine update | ADR-025 | `supabase-rls-setup.sql`, `docs/database/supabase-delta-sprint8.sql` | 45min |
| S8.1 | taskUtils.ts: extrair getTaskIcon | ADR-028 | `lib/taskUtils.ts`, `TaskCard.tsx`, `DashboardView.tsx` | 20min |
| S8.2 | Expandir TaskType: health_medicine | ADR-028 | `productivity.ts`, `AddTaskModal.tsx` | 15min |
| S8.3 | Loading/Error states nos hooks e skeletons | ADR-028 | `useProductivityTasks.ts`, `useProductivityNote.ts`, `TaskListView.tsx`, `DashboardView.tsx` | 45min |
| S8.4 | Auto-reset: chamar check_and_auto_reset no mount | ADR-025 | `useProductivityTasks.ts` | 20min |
| S8.5 | Edição de tarefa: updateTask + AddTaskModal mode edit + TaskCard pencil | ADR-029 | `Icon.tsx`, `useProductivityTasks.ts`, `AddTaskModal.tsx`, `TaskCard.tsx`, `TaskListView.tsx` | 1.5h |

**Esforço total estimado: ~4h**

## Exit Gate

```
□ supabase-delta-sprint8.sql executado sem erros (testar localmente no SQL Editor)
□ check_and_auto_reset() idempotente: 2x chamada no mesmo dia = sem mudança
□ Abrir app no dia seguinte → tasks já resetadas automaticamente
□ getTaskIcon NÃO usa title.includes em nenhum lugar
□ health_medicine → ícone pill; health → ícone fitness (sem title check)
□ Editar tarefa: modal abre pré-preenchido, salva corretamente
□ TaskCard: botão pencil visível, não interfere com toggle/delete
□ Skeleton visível enquanto tasks carregam
□ Zero erros TypeScript (tsc -b)
□ Bundle gz ≤ 210 KB
```

## SQL Delta (Sprint 8)

```sql
-- Executar no Supabase SQL Editor (supabase-delta-sprint8.sql)

-- 1. Nova tabela tb_user_settings
CREATE TABLE IF NOT EXISTS tb_user_settings (
    user_id         UUID PRIMARY KEY,
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    timezone        VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tb_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings" ON tb_user_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON tb_user_settings;
CREATE TRIGGER trg_user_settings_updated_at
    BEFORE UPDATE ON tb_user_settings
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- 2. RPC: check_and_auto_reset
CREATE OR REPLACE FUNCTION check_and_auto_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid         UUID := auth.uid();
  v_last_reset  DATE;
  v_today       DATE := CURRENT_DATE;
  v_total       INT;
  v_done        INT;
  v_pct         INT;
BEGIN
  SELECT last_reset_date INTO v_last_reset
  FROM tb_user_settings WHERE user_id = v_uid;

  -- Sem registro ou já resetou hoje → nada a fazer
  IF v_last_reset IS NULL OR v_last_reset >= v_today THEN RETURN; END IF;

  -- Calcular completion% do dia anterior (estado atual das tasks = ontem)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE done = true)
  INTO v_total, v_done
  FROM tb_routine_tasks WHERE user_id = v_uid;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_done::FLOAT / v_total) * 100) ELSE 0 END;

  -- Salvar para v_last_reset (ontem), não para hoje
  INSERT INTO tb_daily_completions (user_id, completion_date, completion_percentage)
  VALUES (v_uid, v_last_reset, v_pct)
  ON CONFLICT (user_id, completion_date) DO UPDATE
    SET completion_percentage = EXCLUDED.completion_percentage;

  -- Resetar tasks recorrentes
  UPDATE tb_routine_tasks SET done = false
  WHERE user_id = v_uid AND is_recurring = true;

  -- Deletar tasks pontuais concluídas
  DELETE FROM tb_routine_tasks
  WHERE user_id = v_uid AND is_recurring = false AND done = true;

  -- Registrar que já resetou hoje
  INSERT INTO tb_user_settings (user_id, last_reset_date)
  VALUES (v_uid, v_today)
  ON CONFLICT (user_id) DO UPDATE
    SET last_reset_date = v_today, updated_at = now();
END;
$$;

-- 3. Atualizar reset_daily_routine para também gravar last_reset_date
CREATE OR REPLACE FUNCTION reset_daily_routine()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_total INT;
  v_done  INT;
  v_pct   INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE done = true)
  INTO v_total, v_done
  FROM tb_routine_tasks WHERE user_id = v_uid;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_done::FLOAT / v_total) * 100) ELSE 0 END;

  INSERT INTO tb_daily_completions (user_id, completion_date, completion_percentage)
  VALUES (v_uid, CURRENT_DATE, v_pct)
  ON CONFLICT (user_id, completion_date) DO UPDATE
    SET completion_percentage = EXCLUDED.completion_percentage;

  UPDATE tb_routine_tasks SET done = false
  WHERE user_id = v_uid AND is_recurring = true;

  DELETE FROM tb_routine_tasks
  WHERE user_id = v_uid AND is_recurring = false AND done = true;

  -- Marcar que resetou hoje (compatível com auto-reset)
  INSERT INTO tb_user_settings (user_id, last_reset_date)
  VALUES (v_uid, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
    SET last_reset_date = CURRENT_DATE, updated_at = now();
END;
$$;
```

## Riscos

| Risco | Mitigação |
|-------|-----------|
| `check_and_auto_reset` chamado múltiplas vezes antes de completar | Idempotência via `last_reset_date >= today` guard |
| Primeiro usuário sem registro em `tb_user_settings` | `v_last_reset IS NULL → RETURN` no início do RPC |
| `health_medicine` quebra tasks existentes com `type = 'health'` | `TaskType` expandido, `health` continua válido; mapTask aceita ambos |
| Editar task com `updateTask` e RLS bloquear | RLS `FOR ALL USING (auth.uid() = user_id)` cobre UPDATE — sem problema |

## Dev Agent Record

### File List
**Created:**
- `gym-hub/src/lib/taskUtils.ts`
- `docs/database/supabase-delta-sprint8.sql`

**Modified:**
- `supabase-rls-setup.sql` (tb_user_settings + RPCs atualizadas)
- `gym-hub/src/types/productivity.ts` (TaskType expandido)
- `gym-hub/src/hooks/useProductivityTasks.ts` (check_and_auto_reset + updateTask + error state)
- `gym-hub/src/hooks/useProductivityNote.ts` (error state)
- `gym-hub/src/components/gym/Icon.tsx` (ícone pencil)
- `gym-hub/src/components/productivity/TaskCard.tsx` (botão editar, import taskUtils)
- `gym-hub/src/components/productivity/TaskListView.tsx` (editingTask state, skeleton)
- `gym-hub/src/components/productivity/DashboardView.tsx` (import taskUtils, skeleton)
- `gym-hub/src/components/productivity/AddTaskModal.tsx` (mode + initialValues props)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-27 | Story criada — Sprint 8 Planning Session | Morgan (@pm) + Aria (@architect) |
