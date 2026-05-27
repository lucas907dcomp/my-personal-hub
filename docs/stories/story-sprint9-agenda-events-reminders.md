---
story_id: STORY-010
epic_id: EPIC-002
title: "Sprint 9 — Productivity Hub: Agenda de Eventos + Lembretes"
status: Done
priority: HIGH
sprint: 9
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [type_check, notification_api_test, bundle_audit]
depends_on: [STORY-009]
blocks: [STORY-011]
effort_estimate: "~8-10h"
created_by: Morgan (@pm) + Aria (@architect) — Sprint 8 Planning Session
created_at: "2026-05-27"
---

# STORY-010 — Sprint 9: Agenda de Eventos + Lembretes

## Description

Transforma o Productivity Hub de "gerenciador de rotina diária" para um **sistema completo de
organização pessoal**, adicionando uma Agenda de Eventos com lembretes. As duas entidades são
claramente distintas:

- **RoutineTask** → rotina diária, sem data específica, sujeita a reset automático
- **AgendaEvent** → compromisso pontual com data/hora, persiste além do reset, pode ter lembrete

**ADR-026 — tb_agenda_events:**
Nova tabela Supabase. Eventos têm: título, data, horário opcional (evento de dia inteiro se null),
lembrete em minutos antes (null = sem lembrete), cor para categorização visual, campo `completed`.
UI: lista agrupada em seções **Hoje → Amanhã → Esta Semana → Próximos**.

**ADR-027 — Lembretes:**
`useReminders.ts` faz poll a cada 60s. Busca eventos de hoje com horário definido, filtra em JS os
que estão nos próximos `reminder_minutes` minutos e não foram notificados nesta sessão. Se
`Notification.permission === 'granted'`: dispara `new Notification(...)`. Senão: toast in-app.
Permission request na primeira vez que o usuário abre a tab Agenda.

## Acceptance Criteria

### AC-1: SQL — tb_agenda_events + RLS (S9.DB)

- [ ] `supabase-rls-setup.sql` atualizado com:
  - `tb_agenda_events`: `id UUID PK`, `user_id UUID NOT NULL`, `title VARCHAR(255) NOT NULL`,
    `description TEXT`, `event_date DATE NOT NULL`, `event_time TIME`,
    `reminder_minutes INTEGER` (null = sem lembrete; CHECK >= 0),
    `completed BOOLEAN DEFAULT false`, `color VARCHAR(20)` (null ok),
    `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
  - Índice: `(user_id, event_date)`
  - RLS habilitada + policy `"user_agenda" FOR ALL USING (auth.uid() = user_id)`
  - Trigger `updated_at`
- [ ] `docs/database/supabase-delta-sprint9.sql` criado com APENAS o delta deste sprint

### AC-2: Types + Hook de Agenda (S9.1)

- [ ] `gym-hub/src/types/agenda.ts` criado:
  - `EventColor = 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate'`
  - `AgendaEvent`: `id, user_id, title, description, event_date, event_time, reminder_minutes, completed, color, created_at`
  - `CreateAgendaEvent`: `title, event_date, event_time?, reminder_minutes?, description?, color?`
- [ ] `gym-hub/src/hooks/useAgendaEvents.ts` criado:
  - `events: AgendaEvent[]`, `loading: boolean`, `error: string | null`
  - `load()`: busca eventos do usuário ordenados por `event_date, event_time`
  - `addEvent(payload: CreateAgendaEvent): Promise<void>` — insere e atualiza state local
  - `updateEvent(id: string, payload: Partial<CreateAgendaEvent>): Promise<void>`
  - `deleteEvent(id: string): Promise<void>` — optimistic delete com rollback
  - `toggleEvent(id: string): Promise<void>` — toggle `completed` optimístico

### AC-3: AgendaEventCard.tsx (S9.2)

- [ ] `gym-hub/src/components/agenda/AgendaEventCard.tsx` criado:
  - Exibe: time badge (se houver), título, badge de cor, lembrete ("⏰ 15 min antes"), botão concluir
  - Quando `completed`: opacidade 60%, título riscado
  - Botões: toggle concluído (check icon), editar (pencil icon), deletar (trash icon) com confirm
  - Estilo: `rounded-3xl border bg-white p-4` — consistente com TaskCard

### AC-4: AddEventModal.tsx (S9.3)

- [ ] `gym-hub/src/components/agenda/AddEventModal.tsx` criado:
  - Campos: `title` (text), `event_date` (date input, default hoje), `event_time` (time, opcional),
    `reminder_minutes` (select: null/"Sem lembrete", 5, 10, 15, 30, 60 minutos),
    `description` (textarea, opcional), `color` (pill buttons coloridos para seleção visual)
  - Mode: `'create'` (padrão) ou `'edit'` via `mode?` + `initialValues?` props
  - Botão: "SALVAR EVENTO" / "SALVAR ALTERAÇÕES"
  - Validação: título obrigatório, data obrigatória; horário só obrigatório se lembrete selecionado

### AC-5: AgendaView.tsx — Lista agrupada por data (S9.4)

- [ ] `gym-hub/src/components/agenda/AgendaView.tsx` criado:
  - Seções: **Hoje**, **Amanhã**, **Esta Semana** (próximos 7 dias), **Próximos** (além de 7 dias)
  - Seções vazias são omitidas (não renderizadas)
  - Cabeçalho de cada seção: label + data formatada (ex: "Hoje — Segunda, 27 Mai")
  - Botão "Adicionar Evento" no topo direito (abre AddEventModal mode='create')
  - Quando `loading === true`: skeleton de 2 cards
  - Quando lista vazia: empty state "Nenhum evento agendado. Adicione compromissos importantes."
  - Eventos dentro de cada seção ordenados por `event_time` (sem hora → final da seção)

### AC-6: Tab Agenda em ProductivityPage (S9.5)

- [ ] `ProductivityPage.tsx`: `Tab = 'dashboard' | 'day' | 'agenda'`
- [ ] Pill tab "Agenda" adicionado (terceiro tab)
- [ ] `useAgendaEvents(session)` chamado no ProductivityPage
- [ ] Renderiza `<AgendaView>` quando `activeTab === 'agenda'`
- [ ] `useReminders(session, agendaEvents)` chamado no ProductivityPage

### AC-7: useReminders.ts + Browser Notification (S9.6)

- [ ] `gym-hub/src/hooks/useReminders.ts` criado:
  - Recebe `session: Session` e `events: AgendaEvent[]` (já buscados pelo AgendaView)
  - `useEffect`: `setInterval(checkReminders, 60_000)` — limpa no unmount
  - `notifiedIds`: `useRef<Set<string>>` — IDs já notificados nesta sessão (sem spam)
  - `checkReminders()`:
    1. Filtra eventos com `event_date === today`, `event_time != null`, `completed === false`,
       `reminder_minutes != null`
    2. Para cada: calcula `minutesUntil = diff entre agora e event_time`
    3. Se `minutesUntil >= 0 && minutesUntil <= reminder_minutes && !notifiedIds.has(id)`:
       → Dispara notificação → adiciona id ao Set
  - Dispatch: se `Notification.permission === 'granted'` → `new Notification(title, { body })`,
    senão → chama `showToast(...)` (reutiliza Toast.tsx)
- [ ] `AgendaView.tsx`: ao montar, chama `Notification.requestPermission()` se status === 'default'
  - Exibe banner sutil no topo: "Ative lembretes para avisos de eventos próximos"
    com botão "Ativar" que chama requestPermission()
  - Banner some se permission !== 'default' (concedida ou negada)
- [ ] `useReminders.ts` é no-op quando `events` está vazio ou `Notification` API ausente

## Tasks

| # | Task | ADR | Arquivo(s) Principais | Esforço |
|---|------|-----|----------------------|---------|
| S9.DB | SQL: tb_agenda_events + RLS + trigger | ADR-026 | `supabase-rls-setup.sql`, `docs/database/supabase-delta-sprint9.sql` | 30min |
| S9.1 | Types agenda.ts + useAgendaEvents hook | ADR-026 | `types/agenda.ts`, `hooks/useAgendaEvents.ts` | 1.5h |
| S9.2 | AgendaEventCard.tsx | ADR-026 | `components/agenda/AgendaEventCard.tsx` | 45min |
| S9.3 | AddEventModal.tsx | ADR-026 | `components/agenda/AddEventModal.tsx` | 1h |
| S9.4 | AgendaView.tsx — lista agrupada | ADR-026 | `components/agenda/AgendaView.tsx` | 1.5h |
| S9.5 | Tab "Agenda" em ProductivityPage | ADR-026 | `pages/ProductivityPage.tsx` | 20min |
| S9.6 | useReminders + Notification API + banner permissão | ADR-027 | `hooks/useReminders.ts`, `AgendaView.tsx` | 1.5h |

**Esforço total estimado: ~7h**

## Exit Gate

```
□ supabase-delta-sprint9.sql executado sem erros
□ Criar evento com data+hora+lembrete → aparece na seção correta (Hoje/Amanhã/etc)
□ Evento sem horário → aparece no final da seção do dia
□ Evento passado (data anterior a hoje) → NÃO aparece na lista (filtrado)
□ Toggle concluído: evento some ou fica opaco conforme design
□ Lembrete: ao chegar na hora, notificação disparada (in-app ou browser)
□ Notificação não repete para o mesmo evento na mesma sessão
□ Banner de permissão some após grant/deny
□ useReminders no-op quando lista vazia
□ Zero erros TypeScript (tsc -b)
□ Bundle gz ≤ 225 KB
```

## SQL Delta (Sprint 9)

```sql
-- Executar no Supabase SQL Editor (supabase-delta-sprint9.sql)

CREATE TABLE IF NOT EXISTS tb_agenda_events (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    event_date       DATE         NOT NULL,
    event_time       TIME,
    reminder_minutes INTEGER,
    completed        BOOLEAN      NOT NULL DEFAULT false,
    color            VARCHAR(20),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_agenda_reminder CHECK (reminder_minutes IS NULL OR reminder_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_agenda_events_user_date ON tb_agenda_events (user_id, event_date);

ALTER TABLE tb_agenda_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_agenda" ON tb_agenda_events
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_agenda_events_updated_at ON tb_agenda_events;
CREATE TRIGGER trg_agenda_events_updated_at
    BEFORE UPDATE ON tb_agenda_events
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();
```

## Riscos

| Risco | Mitigação |
|-------|-----------|
| `checkReminders` dispara múltiplas notificações para o mesmo evento | `notifiedIds` Set no useRef — persiste na sessão sem re-render |
| Browser bloqueia Notification API (contexto inseguro) | Guard `'Notification' in window` antes de qualquer chamada |
| `event_time` comparação entre timezone do browser e UTC do Supabase | Guardar `event_time` sem timezone (TIME, não TIMETZ); comparar com hora local do browser |
| Evento de dia inteiro (sem `event_time`) e lembrete definido | Validação no AddEventModal: lembrete só habilitado quando horário preenchido |
| Seção "Esta Semana" sobrepõe "Amanhã" | Lógica clara: Hoje = +0, Amanhã = +1, Esta Semana = +2..+7, Próximos = +8+ |

## Dev Agent Record

### File List
**Created:**
- `gym-hub/src/types/agenda.ts`
- `gym-hub/src/hooks/useAgendaEvents.ts`
- `gym-hub/src/hooks/useReminders.ts`
- `gym-hub/src/components/agenda/AgendaEventCard.tsx`
- `gym-hub/src/components/agenda/AddEventModal.tsx`
- `gym-hub/src/components/agenda/AgendaView.tsx`
- `docs/database/supabase-delta-sprint9.sql`

**Modified:**
- `supabase-rls-setup.sql` (tb_agenda_events)
- `gym-hub/src/pages/ProductivityPage.tsx` (tab agenda + useAgendaEvents + useReminders)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-27 | Story criada — Sprint 8 Planning Session | Morgan (@pm) + Aria (@architect) |
