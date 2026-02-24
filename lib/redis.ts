import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

const DEFAULT_TTL = 60 * 60;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  async set<T>(key: string, value: T, ttl = DEFAULT_TTL): Promise<void> {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

export const cacheKeys = {
  session: (token: string) => `session:${token}`,
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  business: (id: string) => `business:${id}`,
  businessBySlug: (slug: string) => `business:slug:${slug}`,
};