import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["login_success", "login_failure", "access_denied", "other"],
      default: "other",
      index: true,
    },
    timestamp: { type: Date, required: true, index: true },
    sourceIp: { type: String, trim: true, maxlength: 64 },
    username: { type: String, trim: true, maxlength: 120 },
    source: { type: String, trim: true, maxlength: 120 },
    message: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

export default mongoose.model("SecurityEvent", eventSchema);
