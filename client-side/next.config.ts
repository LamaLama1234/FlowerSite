import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Абсолютный путь к этому проекту (client-side), не зависящий от cwd.
// Прибиваем сюда корень Turbopack и трейсинга, чтобы Next ни при каких
// условиях не уходил вверх по дереву к корню монорепо и не вотчил
// server-side/node_modules, uploads и т.п. — это и приводит к взрыву памяти
// в dev на macOS (FSEvents рекурсивно следит за огромным деревом).
const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));

// Фолбэк, чтобы build/dev не падали без .env.local (бэкенд по умолчанию на 5001).
const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:5001";

const nextConfig: NextConfig = {
  turbopack: {
    root: PROJECT_ROOT,
  },
  outputFileTracingRoot: PROJECT_ROOT,
  experimental: {
    // Страховка: ограничиваем память Turbopack ~2 ГБ, чтобы даже при тяжёлой
    // компиляции dev-сервер не съедал всю оперативку ноутбука.
    turbopackMemoryLimit: 2 * 1024 * 1024 * 1024,
  },
  env: {
    APP_ENV: process.env.APP_ENV,
    APP_URL: process.env.APP_URL,
    APP_DOMAIN: process.env.APP_DOMAIN,
    SERVER_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.yandex.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/upload/:path*",
        destination: `${SERVER_URL}/upload/:path*`,
      },
    ];
  },
};

export default nextConfig;
