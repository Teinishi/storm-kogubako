// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  // Your custom configs here
  rules: {
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always', // or "any" to allow both
          normal: 'always',
          component: 'always',
        },
      },
    ],
  },
});
