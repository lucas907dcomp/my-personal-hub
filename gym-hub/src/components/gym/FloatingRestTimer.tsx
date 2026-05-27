import { useEffect, useRef, useState } from 'react'
import { useRestTimer } from '../../hooks/useRestTimer'

const PRESETS = [60, 90, 120] as const
const RADIUS = 27
const CIRCUMFERENCE = 2 * Math.PI * RADIUS  // ≈ 169.6

export function FloatingRestTimer() {
  const timer = useRestTimer(90)
  const [isFinished, setIsFinished] = useState(false)
  const wasRunning = useRef(false)

  // Detect finish transition
  useEffect(() => {
    if (timer.isRunning) {
      wasRunning.current = true
      setIsFinished(false)
    } else if (wasRunning.current && timer.secondsLeft === 0) {
      wasRunning.current = false
      setIsFinished(true)
      const t = setTimeout(() => setIsFinished(false), 3000)
      return () => clearTimeout(t)
    }
  }, [timer.isRunning, timer.secondsLeft])

  const isIdle = !timer.isRunning && !isFinished

  const handleFabClick = () => {
    if (isFinished) {
      setIsFinished(false)
    } else if (timer.isRunning) {
      timer.reset()
    } else {
      timer.start(90)
    }
  }

  // Remaining fraction: 1.0 = full ring, 0.0 = empty
  const ringProgress = timer.progress  // progress = secondsLeft / totalSeconds
  const strokeDashoffset = CIRCUMFERENCE * (1 - ringProgress)

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-center gap-2 pointer-events-none">
      {/* Preset chips — visible only when idle */}
      <div
        className={`flex flex-col items-center gap-1.5 transition-all duration-200 pointer-events-auto ${
          isIdle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        aria-hidden={!isIdle}
      >
        {PRESETS.map(secs => (
          <button
            key={secs}
            onClick={() => timer.start(secs)}
            className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-500 transition-all focus:outline-none"
          >
            {secs}s
          </button>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={handleFabClick}
        aria-label={
          isFinished
            ? 'Descanso concluído'
            : timer.isRunning
            ? `Timer: ${timer.formatted} — toque para parar`
            : 'Iniciar timer de descanso (90s)'
        }
        className={`pointer-events-auto relative w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-orange-500/50 active:scale-95 ${
          isFinished
            ? 'bg-emerald-500 scale-110 shadow-emerald-500/40'
            : timer.isRunning
            ? 'bg-orange-500 shadow-orange-500/40'
            : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700'
        }`}
      >
        {/* SVG progress ring — only when running */}
        {timer.isRunning && (
          <svg
            className="absolute inset-0 -rotate-90"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <circle
              cx="32" cy="32" r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="3"
            />
            <circle
              cx="32" cy="32" r={RADIUS}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
        )}

        {/* Content */}
        {isFinished ? (
          <span className="text-white text-2xl animate-bounce">✓</span>
        ) : timer.isRunning ? (
          <span className="text-white font-black text-base leading-none tabular-nums z-10">
            {timer.formatted}
          </span>
        ) : (
          <>
            <span className="text-xl leading-none">⏱️</span>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">
              Rest
            </span>
          </>
        )}
      </button>
    </div>
  )
}
