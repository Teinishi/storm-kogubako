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
  compatibilityDate: '2025-07-15',
  nitro: {
    prerender: {
      autoSubfolderIndex: false,
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
  vite: {
    optimizeDeps: {
      entries: [
        'pages/**/*.vue',
        'layouts/**/*.vue',
        'components/**/*.vue',
      ],
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
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
