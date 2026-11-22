<script setup lang="ts">
import { CheckCircle2, Clock, Mail, QrCode, ShieldCheck, X } from 'lucide-vue-next';
import { YAPE_CONFIG } from '../config/unmsm';

interface Props {
  open: boolean;
  idLlavero: string;
  studentName: string;
  facultad: string;
  email: string;
}

defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#16263E]/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pending-title"
    >
      <div
        class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
      >
        <!-- Header -->
        <div
          class="bg-gradient-to-r from-[#7D1119] to-[#4A090E] px-6 py-5 text-white"
        >
          <button
            type="button"
            class="absolute top-4 right-4 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Cerrar ventana"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>

          <div class="flex items-center gap-2 text-[#D4A237]">
            <Clock class="h-5 w-5" />
            <span class="text-xs font-bold tracking-wider uppercase">
              Solicitud Recibida
            </span>
          </div>
          <h2 id="modal-pending-title" class="mt-1 text-xl font-bold text-white">
            Registro en Verificación de Pago
          </h2>
        </div>

        <!-- Body -->
        <div class="p-6">
          <div
            class="flex flex-col items-center rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-center"
          >
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"
            >
              <CheckCircle2 class="h-6 w-6" />
            </div>

            <div
              class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#16263E] px-4 py-1.5 text-xs font-bold tracking-wide text-white"
            >
              <QrCode class="h-3.5 w-3.5 text-[#D4A237]" />
              <span>Código asignado: {{ idLlavero }}</span>
            </div>

            <p class="mt-4 text-sm leading-relaxed text-[#16263E]">
              Hemos recibido tu solicitud y captura de Yape dirigida a
              <strong class="font-bold">{{ YAPE_CONFIG.holder }} ({{ YAPE_CONFIG.phone }})</strong>.
              En cuanto validemos el pago, recibirás automáticamente tu código QR
              y boleta electrónica en tu correo electrónico.
            </p>
          </div>

          <div
            class="mt-4 space-y-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-xs text-slate-600"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-slate-500">Estudiante:</span>
              <span class="font-bold text-[#16263E]">{{ studentName }}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-slate-500">Facultad:</span>
              <span class="text-right font-semibold text-[#7D1119]">{{ facultad }}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-slate-500">Correo destino:</span>
              <span class="inline-flex items-center gap-1 font-mono font-semibold text-[#16263E]">
                <Mail class="h-3.5 w-3.5 text-[#7D1119]" />
                {{ email }}
              </span>
            </div>
          </div>

          <p
            class="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500"
          >
            <ShieldCheck class="h-3.5 w-3.5 text-[#D4A237]" />
            <span>Validación oficial por Tesorería Localifácil UNMSM</span>
          </p>

          <button
            type="button"
            class="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#7D1119] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5E0C12] cursor-pointer"
            @click="emit('close')"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
