<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const { t: gt } = useI18n({ useScope: 'global' });
const { t } = useI18n();

const open = useNavMenu();

function closeMenu() {
  open.value = false;
}

const items = computed<NavigationMenuItem[][]>(() => {
  return [
    [
      {
        icon: 'i-lucide-home',
        label: t('home'),
        onSelect: closeMenu,
        to: '/',
      },
    ],
    [
      {
        label: gt('web_tools_for_stormworks'),
        type: 'label',
      },
      ...WEB_TOOLS.map(({ key, to, icon }) => ({
        icon,
        label: gt(key),
        onSelect: closeMenu,
        to,
      })),
    ],
    [
      {
        label: gt('other_tools'),
        type: 'label',
      },
      ...OTHER_TOOLS.map(({ key, to, icon }) => ({
        icon,
        label: gt(key),
        onSelect: closeMenu,
        to,
      })),
    ],
  ];
});
</script>

<template>
  <USlideover v-model:open="open" side="left" close-icon="i-lucide-x" inset>
    <template #body>
      <div class="flex h-full flex-col gap-4">
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          :ui="{ link: 'p-1.5 overflow-hidden' }"
          class="grow"
        />

        <div class="flex items-center justify-between">
          <LocaleSelect class="shrink" />
          <UColorModeSwitch />
        </div>
        <p class="text-muted text-sm">© 2026 Teinishi</p>
      </div>
    </template>
  </USlideover>
</template>

<i18n lang="json">
{
  "en": {
    "home": "Home"
  },
  "ja": {
    "home": "ホーム"
  }
}
</i18n>
