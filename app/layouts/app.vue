<template>
  <div>
    <NuxtRouteAnnouncer />
    <AppHeader />
    <UMain class="h-[calc(100vh-var(--ui-header-height))] flex flex-col">
      <slot />
      <USeparator />
      <AppFooter />
    </UMain>
  </div>
</template>
