<template>
  <UFooter>
    <template #left>
      <p class="text-muted text-sm">
        © 2025 Teinishi
      </p>
      <UButton
        color="neutral"
        variant="ghost"
        to="https://stormskey.works/@teinishi"
        target="_blank"
        aria-label="Stormskey"
      >
        {{ $t('stormskey') }}
      </UButton>
      <UButton
        icon="i-simple-icons-x"
        color="neutral"
        variant="ghost"
        to="https://x.com/Te___24"
        target="_blank"
        aria-label="X"
      />
    </template>

    <template #right>
      <UButton
        color="neutral"
        variant="ghost"
        to="https://github.com/Teinishi/storm-kogubako"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
      />
    </template>
  </UFooter>
</template>
