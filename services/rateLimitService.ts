
const STORAGE_KEY = 'echosphere_rate_limit';
const MAX_REQUESTS = 3; // Max submissions per window
const TIME_WINDOW = 60 * 1000; // 1 Minute

interface RateLimitData {
  timestamps: number[];
}

export const rateLimitService = {
  /**
   * Checks if the user is allowed to perform an action based on rate limits.
   * Returns true if allowed, false if blocked.
   */
  check: (): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return true;

      const data: RateLimitData = JSON.parse(stored);
      const now = Date.now();
      
      // Filter out timestamps older than the window
      const validTimestamps = data.timestamps.filter(ts => now - ts < TIME_WINDOW);
      
      return validTimestamps.length < MAX_REQUESTS;
    } catch (e) {
      return true; // Fail open if storage error
    }
  },

  /**
   * Records a new action timestamp. Should be called after a successful action.
   */
  record: () => {
    try {
      const now = Date.now();
      let data: RateLimitData = { timestamps: [] };
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        data = JSON.parse(stored);
      }

      // Filter old and add new
      const validTimestamps = data.timestamps.filter(ts => now - ts < TIME_WINDOW);
      validTimestamps.push(now);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamps: validTimestamps }));
    } catch (e) {
      console.warn("Rate limit storage failed", e);
    }
  },

  /**
   * Returns the remaining time in seconds until the user can submit again.
   */
  getTimeUntilReset: (): number => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return 0;
      const data: RateLimitData = JSON.parse(stored);
      if (data.timestamps.length === 0) return 0;
      
      // Find oldest timestamp in current window
      const oldest = Math.min(...data.timestamps);
      const now = Date.now();
      const diff = TIME_WINDOW - (now - oldest);
      return Math.max(0, Math.ceil(diff / 1000));
  }
};
