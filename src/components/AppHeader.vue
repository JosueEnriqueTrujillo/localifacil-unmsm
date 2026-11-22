<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next';
import { INSTITUTIONAL_SEAL } from '../config/unmsm';
import BrandLogo from './BrandLogo.vue';
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md"
  >
    <div
      class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
    >
      <a href="/" class="flex items-center gap-3 group">
        <BrandLogo size="md" />
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span
              class="text-lg font-bold tracking-tight text-[#16263E] group-hover:text-[#7D1119] transition-colors"
            >
              Localifácil
            </span>
            <span
              class="rounded-md bg-[#7D1119] px-2 py-0.5 text-[11px] font-bold tracking-wider text-white uppercase"
            >
              UNMSM
            </span>
          </div>
          <span class="text-xs font-medium text-slate-500">
            Recuperación Inteligente de Objetos
          </span>
        </div>
      </a>

      <div
        class="hidden items-center gap-2 rounded-full border border-[#D4A237]/40 bg-[#D4A237]/10 px-3.5 py-1.5 text-xs font-semibold text-[#16263E] sm:flex"
      >
        <ShieldCheck class="h-4 w-4 text-[#7D1119]" />
        <span>{{ INSTITUTIONAL_SEAL }}</span>
      </div>
    </div>
  </header>
</template>
