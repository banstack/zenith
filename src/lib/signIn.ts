import { useSyncExternalStore } from 'react'

/**
 * Where sign-in is offered: the top bar, the Star chart header and the
 * "Save your streak" card all open the same sheet, optionally with an email
 * already typed in.
 */

export interface SignInRequest {
  email?: string
  mode?: 'login' | 'signup'
}

let request: SignInRequest | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function openSignIn(r: SignInRequest = {}) {
  request = r
  emit()
}

export function closeSignIn() {
  request = null
  emit()
}

/** The open request, or null when the sheet is closed. */
export function useSignInRequest(): SignInRequest | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => request,
  )
}

// ---------- "Save your streak" card ----------

const SAVE_PROMPT_KEY = 'fathom:save-prompt-dismissed'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

/** The card shows from the second day of a streak, and "Not now" hides it for a week. */
export const SAVE_PROMPT_MIN_STREAK = 2

export function savePromptSnoozed(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(SAVE_PROMPT_KEY))
    return at > 0 && now - at < SNOOZE_MS
  } catch {
    return false
  }
}

export function snoozeSavePrompt(now = Date.now()) {
  try {
    localStorage.setItem(SAVE_PROMPT_KEY, String(now))
  } catch {
    // ignore
  }
}
