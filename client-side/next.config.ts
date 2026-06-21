import type { NextConfig } from "next";

// Фолбэк, чтобы build/dev не падали без .env.local (бэкенд по умолчанию на 5001).
const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:5001";

// Прибиваем корень к этому проекту. Если в монорепо выше client-side окажется
// package.json/лок-файл, Next по умолчанию принимает корнем весь репозиторий и
// начинает вотчить/трейсить server-side, node_modules и т.д. — это приводит к
// взрывному росту памяти в dev. process.cwd() === client-side, т.к. next
// запускается отсюда.
const PROJECT_ROOT = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: PROJECT_ROOT,
  },
  outputFileTracingRoot: PROJECT_ROOT,
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
