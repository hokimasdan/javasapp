import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Javas Nursery POS',
    short_name: 'Javas POS',
    description: 'Sistem Manajemen Kasir dan Stok Javas Nursery',
    start_url: '/dashboard', // Langsung buka dashboard saat diklik
    display: 'standalone', // Menghilangkan bar alamat browser (biar full screen)
    background_color: '#ffffff',
    theme_color: '#164e41', // Warna hijau Javas Nursery
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}