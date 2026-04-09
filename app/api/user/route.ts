import { auth } from '@/auth'
import { getUserById, updateUserProfile } from '@/lib/users'

export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const user = await getUserById(session.user.id)
  if (!user) return new Response('Not found', { status: 404 })

  return Response.json({ user })
}

export async function PATCH(req: Request): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { companyName, businessType } = body as Record<string, unknown>
  const update: { companyName?: string; businessType?: string } = {}
  if (typeof companyName === 'string' && companyName.trim()) update.companyName = companyName.trim()
  if (typeof businessType === 'string' && businessType.trim()) update.businessType = businessType.trim()

  if (!Object.keys(update).length) return new Response('No valid fields', { status: 400 })

  const updated = await updateUserProfile(session.user.id, update)
  if (!updated) return new Response('User not found', { status: 404 })

  return Response.json({ user: updated })
}
