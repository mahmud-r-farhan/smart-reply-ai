import rateLimit from "express-rate-limit";

/**
 * Per-IP rate limiter for the public API.
 *
 * Configurable through the environment:
 *   RATE_LIMIT_WINDOW_MS (default 15 minutes)
 *   RATE_LIMIT_MAX       (default 60 requests per window)
 *
 * `trust proxy` handling is configured explicitly in server.js and validated
 * there, so the library's permissive-proxy heuristic is disabled to avoid
 * throwing a ValidationError on the first proxied request.
 */
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const limit = Number(process.env.RATE_LIMIT_MAX) || 60;

const limiter = rateLimit({
  windowMs,
  limit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  },
});

export default limiter;
