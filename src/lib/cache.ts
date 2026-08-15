type CacheEntry<T> = { value: T; expire: number };

const TTL_MS = 10 * 60 * 1000;
const MAX = 200;

export class LRU<T> {
  private map = new Map<string, CacheEntry<T>>();

  get(key: string): T | null {
    const e = this.map.get(key);
    if (!e) return null;
    if (Date.now() > e.expire) {
      this.map.delete(key);
      return null;
    }
    this.map.delete(key);
    this.map.set(key, e);
    return e.value;
  }

  set(key: string, value: T) {
    this.map.delete(key);
    this.map.set(key, { value, expire: Date.now() + TTL_MS });
    if (this.map.size > MAX) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
  }
}