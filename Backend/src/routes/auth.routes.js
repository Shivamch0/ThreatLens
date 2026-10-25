import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
const attempts = new Map();
const cookieName = 'threatlens_refresh';
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth', maxAge: 7 * 24 * 60 * 60 * 1000 };
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
function checkRate(req) {
  const now = Date.now(); const key = req.ip;
  const entry = attempts.get(key);
  if (entry && entry.until > now && entry.count >= 12) throw new ApiError(429, 'Too many authentication attempts. Try again later.');
  if (!entry || entry.until <= now) attempts.set(key, { count: 1, until: now + 15 * 60_000 });
  else entry.count += 1;
}
function issueTokens(user) {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) throw new ApiError(500, 'Authentication secrets are not configured');
  return {
    accessToken: jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }),
    refreshToken: jwt.sign({ sub: user.id, nonce: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }),
  };
}
function sendTokens(res, tokens, user) {
  res.cookie(cookieName, tokens.refreshToken, cookieOptions);
  res.json({ success: true, data: { accessToken: tokens.accessToken, user: { id: user.id, name: user.name, email: user.email } } });
}

router.post('/register', asyncHandler(async (req, res) => {
  checkRate(req);
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) {
    throw new ApiError(400, 'Enter a name, valid email, and password of 10–128 characters');
  }
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  const tokens = issueTokens(user);
  user.refreshTokenHash = digest(tokens.refreshToken); await user.save();
  sendTokens(res, tokens, user);
}));

router.post('/login', asyncHandler(async (req, res) => {
  checkRate(req);
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokenHash');
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) throw new ApiError(401, 'Email or password is incorrect');
  const tokens = issueTokens(user);
  user.refreshTokenHash = digest(tokens.refreshToken); await user.save();
  sendTokens(res, tokens, user);
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[cookieName];
  if (!refreshToken) throw new ApiError(401, 'Refresh session is missing');
  let payload;
  try { payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); } catch { throw new ApiError(401, 'Refresh session expired; sign in again'); }
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user?.refreshTokenHash || user.refreshTokenHash !== digest(refreshToken)) throw new ApiError(401, 'Refresh session is no longer valid');
  const tokens = issueTokens(user);
  user.refreshTokenHash = digest(tokens.refreshToken); await user.save();
  sendTokens(res, tokens, user);
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[cookieName];
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1 } });
    } catch { /* Expired cookies are cleared below. */ }
  }
  res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: 'Signed out' });
}));

export default router;
