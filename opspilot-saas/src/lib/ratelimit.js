/** Fixed-window rate limiter with bounded memory (LRU-ish eviction via Map insertion order). */
export class RateLimiter {
  constructor({ limit, windowMs, maxKeys = 10000, now = Date.now }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
    this.now = now;
    this.buckets = new Map();
  }

  get size() { return this.buckets.size; }

  hit(key) {
    const t = this.now();
    let b = this.buckets.get(key);
    if (!b || t - b.start >= this.windowMs) {
      b = { start: t, count: 0 };
    }
    this.buckets.delete(key);
    this.buckets.set(key, b);
    b.count++;
    while (this.buckets.size > this.maxKeys) {
      this.buckets.delete(this.buckets.keys().next().value);
    }
    if (b.count > this.limit) {
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(1, this.windowMs - (t - b.start)) };
    }
    return { allowed: true, remaining: this.limit - b.count, retryAfterMs: 0 };
  }

  reset(key) { this.buckets.delete(key); }
}
