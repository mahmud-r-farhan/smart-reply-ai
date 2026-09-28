import { Router } from "express";
import { suggestReply } from "../controllers/suggestReplyController.js";
import { enhanceText } from "../controllers/enhanceTextController.js";
import { translateText } from "../controllers/translateTextController.js";
import { summarizeText } from "../controllers/summarizeTextController.js";
import { PROVIDER_PRESETS, MODELS, FORMATS } from "../utils/modelSelector.js";
import limiter from "../middlewares/rateLimiter.js";

const router = Router();

// Apply rate limiter to all /api routes
router.use(limiter);

// Smart reply suggestion endpoint
router.post("/suggest-reply", suggestReply);

// Text enhancement endpoint
router.post("/enhance-text", enhanceText);

// Text translation endpoint
router.post("/translate-text", translateText);

// Text summarization endpoint (Google ML Kit GenAI spec)
router.post("/summarize-text", summarizeText);

// Provider and model discovery endpoint
router.get("/providers", (req, res) => {
  res.json({
    presets: PROVIDER_PRESETS,
    models: MODELS,
    formats: Object.values(FORMATS)
  });
});

export default router;