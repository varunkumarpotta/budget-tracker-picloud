/**
 * Authentication routes – email/password signup + login with JWT tokens.
 * Free, no third-party service required.
 */
import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPool } from '../db/pool.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'ledgerly-dev-secret-change-in-prod'

function signToken(userId: string, email: string) {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: '30d' })
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''

  if (!email || !password || password.length < 6) {
    res.status(400).json({
      success: false,
      error: 'Email and password (min 6 chars) are required.',
    })
    return
  }

  const pool = getPool()

  // Check if user exists
  const existing = await pool.query('select id from users where email = $1', [email])
  if (existing.rows.length > 0) {
    res.status(409).json({ success: false, error: 'An account with this email already exists.' })
    return
  }

  const id = randomUUID()
  const hash = await bcrypt.hash(password, 10)

  await pool.query(
    'insert into users (id, email, name, password_hash) values ($1, $2, $3, $4)',
    [id, email, name || email.split('@')[0], hash],
  )

  const token = signToken(id, email)

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id, email, name: name || email.split('@')[0] },
    },
  })
})

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' })
    return
  }

  const pool = getPool()
  const result = await pool.query(
    'select id, email, name, avatar_url, password_hash from users where email = $1',
    [email],
  )

  if (result.rows.length === 0) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' })
    return
  }

  const user = result.rows[0]

  if (!user.password_hash) {
    res.status(401).json({ success: false, error: 'This account has no password set. It may be a demo account.' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' })
    return
  }

  const token = signToken(user.id, user.email)

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
      },
    },
  })
})

/**
 * GET /api/auth/me — get current user from token
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.header('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Not authenticated' })
    return
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { sub: string }
    const pool = getPool()
    const result = await pool.query(
      'select id, email, name, avatar_url from users where id = $1',
      [payload.sub],
    )
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, error: 'User not found' })
      return
    }
    const u = result.rows[0]
    res.json({
      success: true,
      data: { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatar_url },
    })
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
})

/**
 * POST /api/auth/logout — no-op for JWT (client removes token)
 */
router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: null })
})

export default router
