<script setup lang="ts">
import { Lock, MapPin, ShieldCheck } from 'lucide-vue-next';
import { INSTITUTIONAL_SEAL } from '../config/unmsm';
import BrandLogo from './BrandLogo.vue';

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="mt-auto border-t border-[#E5E7EB] bg-white">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div
        class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"
      >
        <div class="flex items-center gap-3">
          <BrandLogo size="sm" />
          <div>
            <p class="text-sm font-bold text-[#16263E]">Localifácil UNMSM</p>
            <p class="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin class="h-3.5 w-3.5 text-[#7D1119]" />
              <span>{{ INSTITUTIONAL_SEAL }}</span>
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span class="inline-flex items-center gap-1.5">
            <Lock class="h-3.5 w-3.5 text-[#16263E]" />
            <span>Números telefónicos protegidos contra scraping</span>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <ShieldCheck class="h-3.5 w-3.5 text-[#D4A237]" />
            <span>Correo electrónico (@gmail.com o @unmsm.edu.pe) donde recibirás tu QR, boleta y alertas GPS</span>
          </span>
        </div>
      </div>

      <div
        class="mt-6 flex flex-col items-center justify-between gap-2 border-t border-[#E5E7EB] pt-5 text-xs text-slate-400 sm:flex-row"
      >
        <p>
          &copy; {{ currentYear }} Localifácil UNMSM. Todos los derechos
          reservados.
        </p>
        <p>Decana de América - Ciudad Universitaria, Lima, Perú</p>
      </div>
    </div>
  </footer>
</template>
