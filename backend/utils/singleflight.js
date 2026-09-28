/**
 * Singleflight / Request Collapsing Pattern
 * 
 * When high concurrency occurs (e.g. dozens of simultaneous users or components
 * requesting suggestions for identical or similar contexts), this utility ensures
 * only ONE upstream LLM request is executed. All other concurrent callers receive
 * the identical result when the active Promise resolves.
 * 
 * Prevents:
 * 1. "Thundering herd" spikes on cloud LLMs (Groq, OpenAI, OpenRouter)
 * 2. Rapid exhaustion of provider token limits and rate limits (429s)
 * 3. Redundant computing and memory allocation
 */
class Singleflight {
  constructor() {
    this.inFlight = new Map();
  }

  /**
   * Execute or join an in-flight async operation
   * @param {string} key - Unique identifier for the operation
   * @param {Function} fn - Async worker function returning a Promise
   * @returns {Promise<any>}
   */
  async do(key, fn) {
    if (this.inFlight.has(key)) {
      // Re-use active in-flight Promise
      return this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Number of currently pending in-flight requests
   */
  get size() {
    return this.inFlight.size;
  }
}

export default new Singleflight();
