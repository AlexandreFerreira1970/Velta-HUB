import { signIn } from '@/auth'
import { Text } from '@/components/ui'
import { GoogleSignInButton } from './_components/GoogleSignInButton'

const ShieldIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 1L1.5 3v3c0 2.762 1.969 5.347 4.5 6 2.531-.653 4.5-3.238 4.5-6V3L6 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
  </svg>
)

export default function LoginPage() {
  const googleSignIn = async () => {
    'use server'
    await signIn('google', { redirectTo: '/' })
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--canvas)' }}
    >
      <div
        className="w-full max-w-sm"
        style={{
          background: 'var(--surface-0)',
          border: '1px solid var(--steel-soft)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center"
              style={{ background: 'var(--navy)' }}
            >
              <span
                style={{
                  color: 'var(--ink-inverse)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-geist-sans)',
                }}
              >
                V
              </span>
            </div>
            <Text variant="subheading" as="span" style={{ color: 'var(--navy)' }}>
              Velta
            </Text>
          </div>

          <Text variant="heading" as="h1" className="mb-2">
            Acessar plataforma
          </Text>
          <Text variant="body-sm" color="secondary">
            Entre com sua conta corporativa para continuar.
          </Text>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--steel-soft)' }} />

        {/* Sign-in action */}
        <div className="px-8 py-6">
          <GoogleSignInButton action={googleSignIn} />
        </div>

        {/* Footer */}
        <div
          className="px-8 pb-6 flex items-center justify-center gap-1.5"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          <ShieldIcon />
          <Text variant="caption" color="tertiary">
            Acesso restrito a usuários autorizados
          </Text>
        </div>
      </div>
    </main>
  )
}
