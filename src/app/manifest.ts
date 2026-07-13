import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const isDev = process.env.NODE_ENV === 'development';
  return {
    name: isDev ? 'Gestor Eventos Dev' : 'Gestor Eventos',
    short_name: isDev ? 'Eventos-Dev' : 'Eventos',
    description: 'Aplicación de gestión de eventos, usuarios, cuotas y gastos',
    start_url: isDev ? 'https://eventos-dev.duckdns.org/' : '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: isDev ? [
      {
        src: '/dev-icon.jpg',
        sizes: '256x256',
        type: 'image/jpeg',
      }
    ] : [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
