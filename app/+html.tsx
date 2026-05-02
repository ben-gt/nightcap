import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F4ECDA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Roadside Rooms" />

        {/* Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon.png" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />

        {/* Leaflet CSS */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />

        {/* Web fonts — Fraunces (display) + Inter (body). Native uses bundled TTFs via expo-font. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
        />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          /* expo-font on web gives us font-family names like 'Fraunces-SemiBold'. The browser
             only knows about 'Fraunces' (loaded from Google Fonts above), so any element styled
             with a hyphenated name falls back to Times. Fix it by globally remapping any element
             whose inline style references those names to the real Google Fonts family. */
          [style*="Fraunces"] {
            font-family: 'Fraunces', Georgia, serif !important;
          }
          [style*="Inter"] {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #F4ECDA;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .rr-marker {
            background: none !important;
            border: none !important;
          }
          /* Tone down Leaflet attribution to match the warm palette */
          .leaflet-control-attribution {
            background-color: rgba(244, 236, 218, 0.85) !important;
            color: #5C3A21 !important;
            font-size: 10px !important;
            padding: 2px 6px !important;
            border-radius: 6px !important;
            /* Lifted so the peek bar doesn't cover it */
            margin-bottom: 60px !important;
            margin-right: 4px !important;
          }
          .leaflet-control-attribution a {
            color: #C56B3E !important;
            text-decoration: none !important;
          }
          .leaflet-control-attribution a:hover {
            text-decoration: underline !important;
          }
          /* Hide Ukrainian flag emoji that ships with default attribution */
          .leaflet-attribution-flag {
            display: none !important;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
