<script setup lang="ts">
import { MessageCircle } from 'lucide-vue-next';
import { SUPPORT_WHATSAPP_URL } from '../config/unmsm';
</script>

<template>
  <a
    :href="SUPPORT_WHATSAPP_URL"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Soporte y Pagos Yape (Fabio Acólito) por WhatsApp"
    title="Soporte y Pagos Yape (Fabio Acólito)"
    class="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg ring-2 ring-white transition-all hover:scale-[1.02] hover:bg-emerald-700 sm:right-5 sm:bottom-5"
  >
    <MessageCircle class="h-4 w-4 shrink-0" />
    <span class="hidden sm:inline">Soporte y Pagos Yape (Fabio Acólito)</span>
    <span class="sm:hidden">Soporte Yape</span>
  </a>
</template>
