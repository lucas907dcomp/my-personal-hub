# EPIC-002 — Productivity Hub: Daily OS

**Status:** Done  
**Created:** 2026-05-27  
**Owner:** Morgan (@pm) + Aria (@architect)

## Visão

Transformar o Productivity Hub de um "gerenciador de rotina diária" em um **Daily OS** — sistema
pessoal de organização que acompanha rotina, lembra compromissos, reseta sozinho e gera insights
sobre produtividade.

## Motivação

O hub atual (EPIC-001, Sprints 5-7) é funcionalmente sólido mas limitado:
- Reset manual = atrito desnecessário
- Sem agenda para compromissos pontuais
- Sem lembretes de eventos
- Sem visão histórica dos dados já capturados
- Bugs técnicos (código duplicado, lógica frágil por título)

## Objetivo

Um usuário que quer se organizar deve conseguir:
1. Abrir o app → rotina já resetada automaticamente (sem clique)
2. Ver seus próximos compromissos na Agenda
3. Receber lembretes antes de eventos importantes
4. Ver estatísticas de quanto está sendo produtivo
5. Editar e ajustar tarefas sem deletar/recriar

## Stories

| Story | Sprint | Título | Status |
|-------|--------|--------|--------|
| STORY-009 | 8 | Fix Técnico + Auto-reset + Edição | Done |
| STORY-010 | 9 | Agenda de Eventos + Lembretes | Done |
| STORY-011 | 10 | Filtros + Estatísticas + Adiar Tarefa | Done |

## ADRs deste Epic

| ADR | Decisão | Sprint |
|-----|---------|--------|
| ADR-025 | Auto-reset via tb_user_settings + check_and_auto_reset() | 8 |
| ADR-026 | Agenda de Eventos: tb_agenda_events, lista agrupada por data | 9 |
| ADR-027 | Lembretes: polling 60s + Notification API + in-app fallback | 9 |
| ADR-028 | Fix técnico: taskUtils.ts, TaskType expansion, loading/error | 8 |
| ADR-029 | Edição de tarefa: updateTask + AddTaskModal mode edit | 8 |
| ADR-030 | Filtros locais por categoria (zero API call) | 10 |
| ADR-031 | Estatísticas via useProductivityStats (cálculo client-side) | 10 |
| ADR-032 | Adiar = criar AgendaEvent para amanhã (não altera tarefa original) | 10 |

## Backlog (pós EPIC-002)

- F-06: Modo Foco / Pomodoro timer
- F-09: View semanal da Agenda
- F-10: Conquistas/badges ("7 dias 100%")
- F-11: Exportar/importar rotina como template
- Browser Push Notifications (Service Worker) — Fase 2 dos lembretes

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-27 | Epic criado | Morgan (@pm) + Aria (@architect) |
