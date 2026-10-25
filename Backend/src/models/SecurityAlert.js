import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true, index: true },
  status: { type: String, enum: ['Open', 'Resolved', 'False positive'], default: 'Open', index: true },
  explanation: { type: String, required: true },
  sourceIp: String,
  username: String,
  count: Number,
  firstSeen: Date,
  lastSeen: Date,
  dedupeKey: { type: String, unique: true, sparse: true },
}, { timestamps: true });

export default mongoose.model('SecurityAlert', alertSchema);
