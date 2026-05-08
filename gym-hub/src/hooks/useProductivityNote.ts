import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { apiFetch } from '../lib/api'

export function useProductivityNote(session: Session) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    apiFetch<{ content: string }>('/api/v1/productivity/notes', session)
      .then(data => setContent(data.content ?? ''))
      .catch(err => console.error('[useProductivityNote] load failed:', err))
      .finally(() => setLoading(false))
  }, [session])

  // cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const updateContent = useCallback((value: string) => {
    setContent(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await apiFetch('/api/v1/productivity/notes', session, {
          method: 'PUT',
          body: JSON.stringify({ content: value }),
        })
      } catch (err) {
        console.error('[useProductivityNote] save failed:', err)
      }
    }, 1000)
  }, [session])

  return { content, loading, updateContent }
}
