import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** Variables de la landing en env/landing.env (raíz del repo). No pisa las del sistema. */
function loadLandingEnv() {
  const file = path.resolve(projectRoot, "env", "landing.env");
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadLandingEnv();
const isNextDev = process.env.NODE_ENV === "development";
const EDUGENIOS_API =
  process.env.NEXT_PUBLIC_EDUGENIOS_API_URL || "http://127.0.0.1:5000";

/**
 * CSP local-only (sin Firebase).
 * Amplía img/frame/font/connect para la landing profesional (ImageKit, YouTube, Drive, tiles).
 */
function buildContentSecurityPolicy(): string {
  const connectSrc = [
    "'self'",
    EDUGENIOS_API,
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "https://tiles.openfreemap.org",
    "https://*.basemaps.cartocdn.com",
    "https://*.imagekit.io",
    "https://*.cdn.prismic.io",
    "https://script.google.com",
    "https://script.googleusercontent.com",
    "https://www.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
    "https://www.facebook.com",
    "https://connect.facebook.net",
  ];
  if (isNextDev) {
    connectSrc.push("ws://127.0.0.1:3010", "ws://localhost:3010");
  }
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.imagekit.io https://i.ytimg.com https://img.youtube.com https://tiles.openfreemap.org https://*.basemaps.cartocdn.com https://*.cdn.prismic.io https://lh3.googleusercontent.com https://www.facebook.com https://www.google-analytics.com",
    "media-src 'self' blob: https://*.imagekit.io https://*.cdn.prismic.io",
    `connect-src ${connectSrc.join(" ")}`,
    "worker-src 'self' blob:",
    "frame-src 'self' https://daniel-alt-pages.github.io https://www.youtube-nocookie.com https://*.youtube.com https://drive.google.com https://*.google.com https://*.cdn.prismic.io https://calendar.google.com https://cal.com https://app.cal.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const EDUGENIOS_WEB = process.env.EDUGENIOS_EXPO_PROXY || "http://127.0.0.1:8099";

/**
 * El túnel de Cloudflare apunta a este Next (:3010). /login de Next
 * redirige al demo y vuelve a /landing. En dev, el login real es Expo.
 * /api va directo al FastAPI: si pasa por Expo, el Origin del túnel
 * lo rechaza y el login dice que no hay servidor.
 * El resto de Expo pasa por el proxy :8099, que quita ese Origin.
 */
function expoDevRewrites() {
  return [
    { source: "/login", destination: `${EDUGENIOS_WEB}/login` },
    { source: "/login/:path*", destination: `${EDUGENIOS_WEB}/login/:path*` },
    { source: "/api/:path*", destination: `${EDUGENIOS_API}/api/:path*` },
    { source: "/__katex", destination: `${EDUGENIOS_WEB}/__katex` },
    { source: "/__katex/:path*", destination: `${EDUGENIOS_WEB}/__katex/:path*` },
    {
      source: "/:path*",
      has: [{ type: "query" as const, key: "platform", value: "web" }],
      destination: `${EDUGENIOS_WEB}/:path*`,
    },
  ];
}

const securityHeaders = [
  { key: "X-SG-Build-Id", value: process.env.NEXT_PUBLIC_BUILD_ID || "landing-local" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  { key: "X-Reports-Mode", value: "local-only" },
];

/**
 * GitHub Pages sirve el sitio en https://daniel-alt-pages.github.io/landing/.
 * Las rutas de la app ya viven bajo /landing/*, así que NO se usa basePath
 * (duplicaría /landing/landing). Solo se prefija /_next con assetPrefix y
 * scripts/pages-assemble.mjs reubica out/landing/* en la raíz del artefacto.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isNextDev ? {} : { output: "export" as const }),
  ...(isGithubPages ? { assetPrefix: "/landing" } : {}),
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID || "landing-local",
    NEXT_PUBLIC_LOCAL_ONLY: "true",
  },
  outputFileTracingRoot: projectRoot,
  images: { unoptimized: true },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  webpack(config) {
    config.module.rules.unshift({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      type: "asset/resource",
    });
    return config;
  },
  poweredByHeader: false,
  async redirects() {
    if (!isNextDev) return [];
    return [
      { source: '/', destination: '/landing', permanent: false },
      // Enlaces viejos: la carpeta y la URL eran /alianza.
      { source: '/alianza', destination: '/landing', permanent: false },
      { source: '/alianza/:path*', destination: '/landing/:path*', permanent: false },
      { source: '/landing-profesional', destination: '/landing', permanent: false },
      { source: '/landing-profesional/:path*', destination: '/landing', permanent: false },
    ];
  },
  async rewrites() {
    if (!isNextDev) return [];
    return { beforeFiles: expoDevRewrites() };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          ...(isNextDev
            ? [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
