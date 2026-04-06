export interface VeltaUser {
  id: string           // Google OAuth sub
  email: string
  name: string
  image?: string | null
  provider: 'google'
  createdAt: string    // ISO 8601
  updatedAt: string
  lastLoginAt: string
}
