<template>
  <div class="flex h-screen flex-1">
    <NuxtRouteAnnouncer />
    <NavigationSidebar />

    <div class="h-full flex-1">
      <slot />
    </div>
  </div>
</template>
