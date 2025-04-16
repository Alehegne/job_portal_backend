const NodeCache = require("node-cache");

class CacheService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 60 });
  }

  set(key, value, ttl = 5 * 60) {
    const stringValue = JSON.stringify(value);
    this.cache.set(key, stringValue, ttl);
  }

  get(key) {
    const raw = this.cache.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  del(key) {
    console.log("caches before delete", this.keys());
    if (this.has(key)) {
      console.log(`Deleting key: ${key}, value: `, this.get(key));
    }
    const result = this.cache.del(key);
    console.log(`Deleted count: ${result}`);
  }
  delByPrefix(prefix) {
    const keys = this.keys().filter((key) => key.startsWith(prefix));
    const result = this.cache.del(keys);
    console.log(`Deleted count: ${result}`);
    return result;
  }

  has(key) {
    return this.cache.has(key);
  }

  flushAll() {
    this.cache.flushAll();
  }

  keys() {
    return this.cache.keys();
  }

  async getOrSet(key, fetchFn, ttl = 5 * 60) {
    if (this.has(key)) {
      console.log("From cache...");
      return this.get(key);
    }

    console.log("Fetching DB...");
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  getStats() {
    return this.cache.getStats();
  }
}

// module.exports = new CacheService();
const cacheService = new CacheService();
module.exports = cacheService; //singleton instance
