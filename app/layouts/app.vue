<template>
  <div class="flex flex-1 h-screen">
    <NuxtRouteAnnouncer />
    <NavigationSidebar />

    <div class="flex-1 h-full">
      <slot />
    </div>
  </div>
</template>
