import { auth } from '@/auth'
import { getHubHistory } from '@/lib/hub'

export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const history = await getHubHistory(session.user.id)
    return Response.json({ history })
  } catch (err) {
    console.error('[hub/history]', err)
    return new Response('Internal server error', { status: 500 })
  }
}
