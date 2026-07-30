import { Redis } from '@upstash/redis';

const url = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
const token = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('تنبيه: قيم Upstash Redis غير معرفة في ملف .env!');
}

export const redis = new Redis({
  url: url || '',
  token: token || '',
});