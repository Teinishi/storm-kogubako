import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { defineNuxtModule } from 'nuxt/kit';

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default defineNuxtModule({
  meta: {
    name: 'generate-theme',
  },
  setup(_, nuxt) {
    nuxt.hook('build:before', async () => {
      const jsonPath = resolve(nuxt.options.rootDir, 'app/theme-colors.json');
      const outputDir = resolve(nuxt.options.rootDir, 'app/assets/css');
      const outputPath = resolve(outputDir, 'generated-theme.css');

      const colors = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));

      let css = '@theme static {\n';

      for (const [key, data] of Object.entries(colors)) {
        if (!isRecord(data)) throw new Error(`Unexpected value for "${key}" in "${jsonPath}".`);

        const { name, shades } = data;
        if (typeof name !== 'string')
          throw new Error(`Unexpected value for "${key}.name" in "${jsonPath}".`);
        if (!isRecord(shades))
          throw new Error(`Unexpected value for "${key}.shades" in "${jsonPath}".`);

        for (const shade of SHADES) {
          if (typeof shades[shade] !== 'string')
            throw new Error(`String expected for "${key}.shades.${shade}" in "${jsonPath}".`);

          css += `  --color-${name}-${shade}: ${shades[shade]};\n`;
        }

        css += '\n';
      }

      css += '}\n';

      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(outputPath, css, 'utf-8');

      console.log(`Generated: ${outputPath}`);
    });
  },
});
