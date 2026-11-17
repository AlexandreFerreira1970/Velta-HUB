'use client'

import { GoogleIcon } from '@/components/icons'

interface GoogleSignInButtonProps {
  action: () => Promise<void>
}

export function GoogleSignInButton({ action }: GoogleSignInButtonProps) {
  return (
    <form action={action} className="w-full">
      <button
        type="submit"
        className="
          w-full h-11 px-4 flex items-center justify-center gap-3
          text-sm font-medium
          border rounded-[var(--radius-sm)]
          transition-colors duration-150
          focus:outline-none focus-visible:ring-2
          focus-visible:ring-[var(--azure-ring)]
          focus-visible:ring-offset-1
          cursor-pointer
        "
        style={{
          background: 'var(--surface-0)',
          borderColor: 'var(--steel-strong)',
          color: 'var(--ink-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--surface-0)'
        }}
      >
        <GoogleIcon />
        Entrar com Google
      </button>
    </form>
  )
}
