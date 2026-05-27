# EPIC-003 — Gym Hub: Analytics & Experience

**Status:** In Progress  
**Created:** 2026-05-27  
**Owner:** Morgan (@pm) + Aria (@architect)

## Visão

Transformar o Gym Hub de um **log de treino** em um **sistema de evolução físicado** — um parceiro
inteligente que mostra sua progressão, celebra recordes, mantém o foco durante o treino e revela
padrões de melhora ao longo do tempo.

## Motivação

O hub atual (Sprints 1-4) tem uma base sólida de data: exercícios, sessões históricas e suplementos.
Porém o usuário não consegue:
- Ver sua evolução de carga ao longo das semanas (o dado existe, a visualização não)
- Saber se está batendo recordes pessoais (PRs)
- Manter o foco durante o treino (sem timer de descanso)
- Ter uma visão consolidada de performance (sem dashboard)
- Organizar exercícios por grupo muscular
- Anotar contexto de cada sessão (dor, energia, ambiente)
- Acompanhar peso corporal junto com evolução de força

## Objetivo

Um usuário que quer evoluir fisicamente deve conseguir:
1. Abrir o Gym Hub → ver um Dashboard com streak, PRs e volume da semana
2. Ao entrar num exercício → ver gráfico de progressão de carga (últimas 8 semanas)
3. Ao salvar uma sessão → receber badge "🏆 Novo PR!" se bateu o recorde
4. Ao salvar uma sessão → iniciar timer de descanso com 1 toque
5. Ver o volume total do treino de hoje em tempo real
6. Filtrar exercícios por grupo muscular
7. Adicionar notas rápidas em cada sessão
8. Registrar peso corporal diário e ver correlação com força

## Stories

| Story | Sprint | Título | Status |
|-------|--------|--------|--------|
| STORY-012 | 11 | Histórico + Gráfico de Progressão por Exercício | Draft |
| STORY-013 | 12 | Dashboard de Performance do Gym | Draft |
| STORY-014 | 13 | Timer de Descanso + Badge de PR + Volume por Treino | Draft |
| STORY-015 | 14 | Tags de Grupo Muscular + Notas por Sessão + Reordenar Exercícios | Draft |
| STORY-016 | 15 | Tracker de Peso Corporal + Suplementos Expandidos | Draft |

## Arquitetura de Alto Nível (Aria)

### Novos Hooks

```
useExerciseHistory(exerciseId, limit?)
  → tb_gym_sessions ORDER BY logged_at DESC LIMIT N
  → retorna SessionPoint[] para chart + tabela

useGymStats(session)
  → agrega tb_gym_sessions + tb_gym_exercises
  → { totalSessions, currentStreak, weeklyVolume, topPRs[] }

useRestTimer(defaultSeconds?)
  → puro React state + setInterval
  → { isRunning, secondsLeft, start(), reset(), setDuration() }

useBodyWeight(session)
  → tb_body_weight ORDER BY date DESC
  → { entries, addEntry, removeEntry }
```

### Novos Componentes

```
ProgressChart           — recharts LineChart de carga ao longo do tempo
HistoryModal            — drawer com histórico completo + gráfico
GymDashboardView        — tela home com stats consolidados
RestTimerWidget         — overlay flutuante após "Salvar Sessão"
PRBadge                 — badge animado "🏆 Novo PR!"
VolumeBar               — volume total do treino em tempo real
MuscleGroupBadge        — chip colorido por grupo muscular
BodyWeightTracker       — input + mini-gráfico de peso corporal
ExpandedSupplements     — tracker de suplementos configurável
```

### Mudanças de Schema

```sql
-- Sprint 14: grupo muscular e posição do exercício
ALTER TABLE tb_gym_exercises
  ADD COLUMN muscle_group text,
  ADD COLUMN position integer DEFAULT 0;

-- Sprint 14: notas por sessão
ALTER TABLE tb_gym_sessions
  ADD COLUMN notes text;

-- Sprint 15: peso corporal
CREATE TABLE tb_body_weight (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  date        date NOT NULL,
  weight_kg   numeric(5,2) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Sprint 15: suplementos configuráveis
CREATE TABLE tb_supplement_config (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid REFERENCES auth.users NOT NULL,
  name     text NOT NULL,
  icon     text DEFAULT '💊',
  position integer DEFAULT 0
);
-- tb_gym_supplements: adicionar supplement_config_id (retrocompatível)
```

### Stack Additions

| Lib | Motivo | Sprint |
|-----|--------|--------|
| `recharts` | Gráficos de progressão e peso corporal | 11 |

## ADRs deste Epic

| ADR | Decisão | Sprint |
|-----|---------|--------|
| ADR-033 | Gráfico de progressão: recharts LineChart, dados client-side via useExerciseHistory | 11 |
| ADR-034 | HistoryModal: drawer bottom-sheet, últimas 30 sessões, sem paginação inicial | 11 |
| ADR-035 | Dashboard: useGymStats client-side aggregation, streak via consecutive dates | 12 |
| ADR-036 | PR detection: comparar weight × 1RM vs máximo histórico no logSession | 12 |
| ADR-037 | Rest Timer: puro React state + navigator.vibrate(), sem DB | 13 |
| ADR-038 | Volume = Σ(weight × repsInt) por exercício do treino ativo (estimativa) | 13 |
| ADR-039 | muscle_group: lista fixa de 8 grupos, seletor visual no AddExerciseForm | 14 |
| ADR-040 | Reordenação de exercícios: mesma lógica de workouts (position field + swap) | 14 |
| ADR-041 | Body weight: tb_body_weight, chart combo (linha peso + linha força) | 15 |
| ADR-042 | Suplementos expandidos: tb_supplement_config, migração whey/creatina automática | 15 |

## Backlog pós EPIC-003

- Workout templates pré-definidos (PPL, Upper/Lower, Full Body)
- Deload automático (detectar plateau e sugerir semana leve)
- Compartilhar progresso (imagem gerada de PR / evolução)
- Integração com Apple Health / Google Fit
- Modo offline com sync posterior

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-27 | Epic criado com 5 stories (Sprints 11-15) | Morgan (@pm) + Aria (@architect) |
