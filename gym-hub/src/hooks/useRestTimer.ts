import { useCallback, useEffect, useRef, useState } from 'react'

export function useRestTimer(defaultSeconds = 90) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const start = useCallback((secs?: number) => {
    const duration = secs ?? totalSeconds
    setTotalSeconds(duration)
    setSecondsLeft(duration)
    setIsRunning(true)
    clearTimer()
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer()
          setIsRunning(false)
          try { navigator.vibrate?.([200, 100, 200]) } catch { /* ignored */ }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [totalSeconds])

  const stop = useCallback(() => {
    clearTimer()
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    setIsRunning(false)
    setSecondsLeft(0)
  }, [])

  const setDuration = useCallback((secs: number) => {
    setTotalSeconds(secs)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [])

  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) : 0

  const formatted = (() => {
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })()

  return { isRunning, secondsLeft, totalSeconds, formatted, progress, start, stop, reset, setDuration }
}
