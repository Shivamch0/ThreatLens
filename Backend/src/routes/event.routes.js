import { Router } from "express";
import {
  createEvent,
  getAlerts,
  getDashboard,
  getEvents,
  updateAlertStatus,
} from "../controllers/event.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

router.get("/dashboard", asyncHandler(getDashboard));
router.get("/events", asyncHandler(getEvents));
router.post("/events", asyncHandler(createEvent));
router.get("/alerts", asyncHandler(getAlerts));
router.patch("/alerts/:id/status", asyncHandler(updateAlertStatus));

export default router;
