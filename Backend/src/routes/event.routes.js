import { Router } from 'express';
import mongoose from 'mongoose';
import SecurityEvent from '../models/SecurityEvent.js';
import SecurityAlert from '../models/SecurityAlert.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
router.use(requireAuth);

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [totalEvents, failedLogins, openAlerts, severity, recentEvents, recentAlerts, trend] = await Promise.all([
    SecurityEvent.countDocuments(), SecurityEvent.countDocuments({ type: 'login_failure' }), SecurityAlert.countDocuments({ status: 'Open' }),
    SecurityAlert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    SecurityEvent.find().sort({ timestamp: -1 }).limit(8).lean(), SecurityAlert.find().sort({ createdAt: -1 }).limit(6).lean(),
    SecurityEvent.aggregate([{ $match: { timestamp: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%H:00', date: '$timestamp' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
  ]);
  res.json({ success: true, data: { totalEvents, failedLogins, openAlerts, highAlerts: await SecurityAlert.countDocuments({ status: 'Open', severity: { $in: ['High', 'Critical'] } }), severity: Object.fromEntries(severity.map((item) => [item._id, item.count])), recentEvents, recentAlerts, trend } });
}));

router.get('/events', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const filter = {};
  if (['login_success', 'login_failure', 'access_denied', 'other'].includes(req.query.type)) filter.type = req.query.type;
  if (req.query.search) { const safe = String(req.query.search).slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = [{ username: { $regex: safe, $options: 'i' } }, { sourceIp: { $regex: safe, $options: 'i' } }]; }
  const [events, total] = await Promise.all([SecurityEvent.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(), SecurityEvent.countDocuments(filter)]);
  res.json({ success: true, data: { events, page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.post('/events', asyncHandler(async (req, res) => {
  const { type, timestamp, sourceIp, username, source, message } = req.body;
  if (!['login_success', 'login_failure', 'access_denied', 'other'].includes(type)) throw new ApiError(400, 'Unsupported event type');
  const when = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(when.valueOf()) || when > new Date(Date.now() + 60_000)) throw new ApiError(400, 'Invalid event timestamp');
  for (const [field, value, max] of [['sourceIp', sourceIp, 64], ['username', username, 120], ['source', source, 120], ['message', message, 1000]]) {
    if (value != null && (typeof value !== 'string' || value.length > max)) throw new ApiError(400, `Invalid ${field}`);
  }
  const event = await SecurityEvent.create({ type, timestamp: when, sourceIp, username, source, message });
  if (type === 'login_failure') await detectRepeatedFailures({ sourceIp, username, timestamp: when });
  res.status(201).json({ success: true, data: event });
}));

async function detectRepeatedFailures({ sourceIp, username, timestamp }) {
  const windowStart = new Date(timestamp.valueOf() - 5 * 60_000);
  const filter = { type: 'login_failure', timestamp: { $gte: windowStart, $lte: timestamp } };
  if (sourceIp) filter.sourceIp = sourceIp;
  if (username) filter.username = username;
  if (!sourceIp && !username) return;
  const [count, first] = await Promise.all([SecurityEvent.countDocuments(filter), SecurityEvent.findOne(filter).sort({ timestamp: 1 })]);
  if (count < 5) return;
  const dedupeKey = `${sourceIp || ''}:${username || ''}:${Math.floor(timestamp.valueOf() / 300_000)}`;
  await SecurityAlert.updateOne({ dedupeKey }, { $set: { title: 'Repeated failed logins detected', severity: count >= 10 ? 'High' : 'Medium', explanation: `${count} failed login attempts for ${username || 'an account'} from ${sourceIp || 'an unknown source'} within five minutes. Review the authentication logs and confirm whether the activity is expected.`, sourceIp, username, count, firstSeen: first?.timestamp, lastSeen: timestamp }, $setOnInsert: { status: 'Open', dedupeKey } }, { upsert: true });
}

router.get('/alerts', asyncHandler(async (req, res) => {
  const filter = {};
  if (['Open', 'Resolved', 'False positive'].includes(req.query.status)) filter.status = req.query.status;
  const alerts = await SecurityAlert.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ success: true, data: alerts });
}));

router.patch('/alerts/:id/status', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid alert ID');
  if (!['Open', 'Resolved', 'False positive'].includes(req.body.status)) throw new ApiError(400, 'Invalid alert status');
  const alert = await SecurityAlert.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!alert) throw new ApiError(404, 'Alert not found');
  res.json({ success: true, data: alert });
}));

export default router;
