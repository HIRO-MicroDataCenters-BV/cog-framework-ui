<template>
  <div class="h-svh oveflow-hidden">
    <Suspense>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <template #fallback>
        <div class="flex items-center justify-center h-screen w-full">
          <svg
            class="animate-spin w-8 h-8 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </template>
    </Suspense>
  </div>
  <Toaster position="top-right" expand rich-colors />
</template>

<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';

useHead({
  title: 'COG',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'msapplication-TileColor', content: '#ffffff' },
    { name: 'msapplication-TileImage', content: '/favicon-144x144.png' },
    { name: 'msapplication-config', content: '/browserconfig.xml' },
  ],
  link: [
    { rel: 'apple-touch-icon', sizes: '57x57', href: '/favicon-57x57.png' },
    { rel: 'apple-touch-icon', sizes: '60x60', href: '/favicon-60x60.png' },
    { rel: 'apple-touch-icon', sizes: '72x72', href: '/favicon-72x72.png' },
    { rel: 'apple-touch-icon', sizes: '76x76', href: '/favicon-76x76.png' },
    { rel: 'apple-touch-icon', sizes: '114x114', href: '/favicon-114x114.png' },
    { rel: 'apple-touch-icon', sizes: '120x120', href: '/favicon-120x120.png' },
    { rel: 'apple-touch-icon', sizes: '144x144', href: '/favicon-144x144.png' },
    { rel: 'apple-touch-icon', sizes: '152x152', href: '/favicon-152x152.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon-180x180.png' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '96x96',
      href: '/favicon-96x96.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '192x192',
      href: '/favicon-192x192.png',
    },
    { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
  ],
});
const { t } = useI18n();
</script>
