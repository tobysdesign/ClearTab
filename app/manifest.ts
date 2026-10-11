import type { MetadataRoute } from 'next'

// Web app manifest (served at /manifest.webmanifest) for bookmarks and
// "Add to Home Screen". public/manifest.json is the Chrome extension's manifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ClearTab',
    short_name: 'ClearTab',
    description: 'Notes, tasks and every calendar you use, in one calm dashboard.',
    start_url: '/tab',
    display: 'standalone',
    background_color: '#161616',
    theme_color: '#161616',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
