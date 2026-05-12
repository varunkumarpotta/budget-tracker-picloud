/**
 * JWT auth middleware – extracts user ID from Bearer token.
 * Falls back to 'demo' for backward compatibility.
 */
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'ledgerly-dev-secret-change-in-prod'

export function getUserId(req: Request): string {
  const authHeader = req.header('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { sub: string }
      return payload.sub
    } catch {
      // fall through
    }
  }
  // Legacy header support
  const header = req.header('x-user-id')
  if (header) return header
  return 'demo'
}

/**
 * Require authentication middleware – rejects if no valid token.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    // Allow demo user for backward compat
    const xUserId = req.header('x-user-id')
    if (xUserId === 'demo') {
      next()
      return
    }
    res.status(401).json({ success: false, error: 'Authentication required' })
    return
  }
  try {
    jwt.verify(authHeader.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}
