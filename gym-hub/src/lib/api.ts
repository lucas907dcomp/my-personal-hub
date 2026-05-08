import type { Session } from '@supabase/supabase-js'

export async function apiFetch<T>(
  path: string,
  session: Session,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options?.headers as Record<string, string>),
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
