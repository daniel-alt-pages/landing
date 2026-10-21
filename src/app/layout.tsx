import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import AppRootChrome from "@/components/AppRootChrome";
/** Bajo /landing para que exista también en GitHub Pages. */
const PRISMIC_APP_ICON = "/landing/brand/sg-services-logo.svg";
/**
 * GitHub Pages sirve solo /landing/*: /sw.js no existe ahí (404). Además sw.js es un
 * kill switch que se desregistra y recarga la pestaña; en Pages nunca hubo un SW previo,
 * así que ahí no se registra nada.
 */
const REGISTER_SW = process.env.GITHUB_PAGES !== "true";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_NAME = "Seamos Genios · Resultados PreICFES";
const SITE_DESCRIPTION =
  "Consulta tus resultados del simulacro PreICFES Saber 11. Dashboard interactivo con puntajes, ranking nacional, análisis de respuestas y evolución simulacro a simulacro.";
const OG_IMAGE = "/og-image.png";

export const metadata: Metadata = {
  metadataBase: new URL('https://simulacros-sg.web.app'),
  title: {
    default: SITE_NAME,
    template: "%s · Seamos Genios",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Seamos Genios",
  authors: [{ name: "Seamos Genios" }],
  keywords: [
    "ICFES",
    "Saber 11",
    "PreICFES",
    "simulacro",
    "resultados",
    "puntaje",
    "ranking",
    "Colombia",
    "educación",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Seamos Genios",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    siteName: "Seamos Genios",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "es_CO",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Seamos Genios – Resultados PreICFES Saber 11",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: {
    icon: [
      { url: PRISMIC_APP_ICON, type: "image/svg+xml" },
    ],
    apple: PRISMIC_APP_ICON,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <head>
        {/* Marca que hay JS: las entradas animadas solo ocultan contenido si esta clase existe. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <AppRootChrome>{children}</AppRootChrome>
        <script
          dangerouslySetInnerHTML={{
            __html:
              process.env.NEXT_PUBLIC_FIREBASE_ENV === 'staging'
                ? `
                window.addEventListener('load', function() {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations()
                      .then(function(regs) { regs.forEach(function(r) { r.unregister(); }); })
                      .catch(function() {});
                  }
                  if ('caches' in window) {
                    caches.keys()
                      .then(function(keys) {
                        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
                      })
                      .catch(function() {});
                  }
                });
              `
                : process.env.NODE_ENV === 'production' && REGISTER_SW
                  ? `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  });
                }
              `
                  : process.env.NODE_ENV === 'production'
                    ? ''
                    : `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.getRegistrations()
                      .then(function(registrations) {
                        registrations.forEach(function(registration) {
                          registration.unregister();
                        });
                      })
                      .catch(function() {});
                  });
                }
                if ('caches' in window) {
                  caches.keys()
                    .then(function(keys) {
                      keys
                        .filter(function(key) { return key.indexOf('sg-') === 0; })
                        .forEach(function(key) { caches.delete(key); });
                    })
                    .catch(function() {});
                }
              `,
          }}
        />
      </body>
    </html>
  );
}
