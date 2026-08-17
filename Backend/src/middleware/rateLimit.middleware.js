/**
 * In-memory sliding-window rate limiter.
 * No Redis required — resets on server restart.
 *
 * Usage:
 *   import { rateLimit } from "../middleware/rateLimit.middleware.js";
 *   router.post("/", rateLimit({ windowMs: 60_000, max: 5 }), handler);
 */

// store: Map<key, number[]>  — key → array of request timestamps
const store = new Map();

/**
 * @param {object} options
 * @param {number} options.windowMs  - Time window in ms (default 60 000)
 * @param {number} options.max       - Max requests per window (default 10)
 * @param {string} [options.keyBy]   - "userId" (default) | "ip"
 * @param {string} [options.message] - Error message
 */
export function rateLimit({ windowMs = 60_000, max = 10, keyBy = "userId", message } = {}) {
  return (req, res, next) => {
    const key =
      keyBy === "ip"
        ? req.ip
        : req.user?._id?.toString() ?? req.ip;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create timestamps list for this key
    let timestamps = store.get(key) ?? [];

    // Prune timestamps outside the current window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= max) {
      return res.status(429).json({
        message: message ?? "Too many requests. Please wait before trying again.",
      });
    }

    timestamps.push(now);
    store.set(key, timestamps);

    next();
  };
}
