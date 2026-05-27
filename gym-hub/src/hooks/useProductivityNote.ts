import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export function useProductivityNote(session: Session) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error: fetchErr } = await supabase
          .from('tb_workspace_notes')
          .select('content')
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (fetchErr) {
          console.error('[useProductivityNote] load failed:', fetchErr.message)
          setError(fetchErr.message)
        } else {
          setContent(data?.content ?? '')
          setError(null)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const updateContent = useCallback((value: string) => {
    setContent(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('tb_workspace_notes')
        .upsert({ user_id: session.user.id, content: value }, { onConflict: 'user_id' })
      if (error) console.error('[useProductivityNote] save failed:', error.message)
    }, 1000)
  }, [session])

  return { content, loading, error, updateContent }
}
