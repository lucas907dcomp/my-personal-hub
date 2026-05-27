interface TimerState {
  isRunning: boolean
  secondsLeft: number
  totalSeconds: number
  formatted: string
  progress: number
  start: (secs?: number) => void
  stop: () => void
  reset: () => void
  setDuration: (secs: number) => void
}

interface RestTimerWidgetProps {
  timer: TimerState
  onDismiss: () => void
}

const PRESET_DURATIONS = [60, 90, 120] as const

export function RestTimerWidget({ timer, onDismiss }: RestTimerWidgetProps) {
  const { isRunning, secondsLeft, formatted, progress, start, stop } = timer

  const isFinished = !isRunning && secondsLeft === 0

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Timer de descanso: ${formatted}`}
      className="mt-3 bg-slate-50 dark:bg-slate-700/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-600 relative overflow-hidden"
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-orange-500 transition-all duration-1000 ease-linear rounded-b-2xl"
        style={{ width: `${progress * 100}%` }}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Descanso
        </p>
        <button
          onClick={onDismiss}
          aria-label="Dispensar timer"
          className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors focus:outline-none"
        >
          ✕
        </button>
      </div>

      {isFinished ? (
        <p className="text-center font-black text-emerald-500 text-lg py-1">✓ Pronto para continuar!</p>
      ) : (
        <>
          <p className="text-center font-black text-3xl text-slate-800 dark:text-slate-100 tabular-nums leading-none mb-3">
            {formatted}
          </p>
          <div className="flex gap-2 justify-center">
            {PRESET_DURATIONS.map(secs => (
              <button
                key={secs}
                onClick={() => start(secs)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  timer.totalSeconds === secs && isRunning
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-500 border border-slate-200 dark:border-slate-500'
                }`}
              >
                {secs}s
              </button>
            ))}
            {isRunning && (
              <button
                onClick={stop}
                className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 border border-slate-200 dark:border-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                ⏹
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
