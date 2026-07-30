import { Redis } from '@upstash/redis';

const url = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
const token = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('خطأ أمني: بيانات اتصال Redis غير معرفة في متغيرات البيئة الآمنة .env');
}

export const redis = new Redis({
  url: url || '',
  token: token || '',
});
