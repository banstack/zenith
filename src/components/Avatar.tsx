/** `dot` marks the account's sync state: 'ok' when synced, 'warn' when offline or failing. */
export function Avatar({ name, size = 'md', dot }: { name: string; size?: 'sm' | 'md' | 'lg'; dot?: 'ok' | 'warn' }) {
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <span className={`avatar ${size}`} aria-hidden>
      {initial || '☺︎'}
      {dot && <span className={`avatar-dot ${dot}`} />}
    </span>
  )
}
