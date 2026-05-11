import type { Session } from '@supabase/supabase-js'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly body: string

  constructor(status: number, body: string, path: string, method: string) {
    super(`${method} ${path} → ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  get userMessage(): string {
    if (this.status === 401) return '401 — Sessão expirada. Clique em "Sair" e entre novamente.'
    if (this.status === 403) return '403 — Sem permissão para esta operação.'
    if (this.status === 404) return '404 — Recurso não encontrado.'
    if (this.status >= 500) return `${this.status} — Erro no servidor. Verifique se o backend está rodando.`
    return `Erro ${this.status}: ${this.body || 'sem detalhes'}`
  }
}

export async function apiFetch<T>(
  path: string,
  session: Session,
  options?: RequestInit,
): Promise<T> {
  const method = options?.method ?? 'GET'

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        'ngrok-skip-browser-warning': 'true',
        ...(options?.headers as Record<string, string>),
      },
    })
  } catch {
    throw new ApiError(0, '', path, method)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[API] ${method} ${path} → ${res.status}`, body || '(empty body)')
    throw new ApiError(res.status, body, path, method)
  }

  if (res.status === 204) return undefined as T

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '')
    console.error(`[API] ${method} ${path} → non-JSON (${contentType})`, text.slice(0, 200))
    throw new ApiError(res.status, text.slice(0, 200), path, method)
  }

  return res.json() as Promise<T>
}
