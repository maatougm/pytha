import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-stylesheets',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-webfonts',
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|woff|woff2)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-assets',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/.*\/api\/.*/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 10,
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 // 24 hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ],
                skipWaiting: true,
                clientsClaim: true,
                cleanupOutdatedCaches: true,
                offlineGoogleAnalytics: false
            },
            manifest: {
                name: 'School Hub - Connecting Education',
                short_name: 'School Hub',
                description: 'Real-time messaging and collaboration platform for teachers, parents, and students',
                theme_color: '#E3F2FD',
                background_color: '#ffffff',
                display: 'standalone',
                display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                id: '/',
                lang: 'en',
                dir: 'ltr',
                categories: ['education', 'productivity', 'social'],
                icons: [
                    {
                        src: '/icons/icon-72x72.png',
                        sizes: '72x72',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-128x128.png',
                        sizes: '128x128',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-144x144.png',
                        sizes: '144x144',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-152x152.png',
                        sizes: '152x152',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-384x384.png',
                        sizes: '384x384',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable any'
                    }
                ],
                screenshots: [
                    {
                        src: '/screenshots/narrow.png',
                        sizes: '750x1334',
                        type: 'image/png',
                        form_factor: 'narrow',
                        label: 'School Hub Mobile View'
                    },
                    {
                        src: '/screenshots/wide.png',
                        sizes: '1920x1080',
                        type: 'image/png',
                        form_factor: 'wide',
                        label: 'School Hub Desktop View'
                    }
                ],
                shortcuts: [
                    {
                        name: 'Messages',
                        short_name: 'Messages',
                        description: 'Open messaging view',
                        url: '/messaging',
                        icons: [{ src: '/icons/messages-96x96.png', sizes: '96x96' }]
                    },
                    {
                        name: 'Courses',
                        short_name: 'Courses',
                        description: 'View courses and classes',
                        url: '/courses',
                        icons: [{ src: '/icons/courses-96x96.png', sizes: '96x96' }]
                    },
                    {
                        name: 'Assignments',
                        short_name: 'Assignments',
                        description: 'View assignments',
                        url: '/assignments',
                        icons: [{ src: '/icons/assignments-96x96.png', sizes: '96x96' }]
                    }
                ]
            },
            devOptions: {
                enabled: true,
                type: 'module',
                navigateFallback: 'index.html'
            }
        })
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/messaging': {
                target: 'http://localhost:3000',
                ws: true,
                changeOrigin: true,
            },
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
                changeOrigin: true,
            },
        },
    },
})
