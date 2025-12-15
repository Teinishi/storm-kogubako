<template>
  <div>
    <NuxtRouteAnnouncer />
    <AppHeader />
    <UMain class="flex flex-col">
      <slot />
      <USeparator class="mt-auto" />
      <AppFooter />
    </UMain>
  </div>
</template>
