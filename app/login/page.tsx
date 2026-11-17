import { signIn } from '@/auth'
import { Text } from '@/components/ui'
import { ShieldIcon } from '@/components/icons'
import { GoogleSignInButton } from './_components/GoogleSignInButton'

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
