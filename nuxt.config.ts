// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@tresjs/nuxt',
    '@vueuse/nuxt',
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  experimental: {
    typedPages: true,
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    compressPublicAssets: true,
    prerender: {
      autoSubfolderIndex: false,
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
  vite: {
    vue: { features: { optionsAPI: false } },
    optimizeDeps: {
      entries: [
        'pages/**/*.vue',
        'layouts/**/*.vue',
        'components/**/*.vue',
      ],
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'earcut',
        'jszip', // CJS
        'polygon-clipping',
        'sw-mesh-viewer/parser',
        'three',
      ],
    },
  },
  eslint: {
    config: {
      stylistic: {
        indent: 2,
        quotes: 'single',
        semi: true,
      },
    },
  },
  i18n: {
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'ja', file: 'ja.json' },
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
  },
});
