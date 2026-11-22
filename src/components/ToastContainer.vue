<script setup lang="ts">
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-vue-next';
import { useToast, type ToastType } from '../composables/useToast';

const { toasts, removeToast } = useToast();

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-white text-[#16263E]',
  error: 'border-red-200 bg-white text-[#16263E]',
  warning: 'border-[#D4A237]/50 bg-white text-[#16263E]',
  info: 'border-slate-200 bg-white text-[#16263E]',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-[#7D1119]',
  warning: 'text-[#D4A237]',
  info: 'text-[#16263E]',
};
</script>

<template>
  <div
    class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5 sm:right-6 sm:bottom-6"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg"
        :class="styleMap[toast.type]"
      >
        <component
          :is="iconMap[toast.type]"
          class="mt-0.5 h-5 w-5 shrink-0"
          :class="iconColorMap[toast.type]"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-[#16263E]">{{ toast.title }}</p>
          <p v-if="toast.message" class="mt-0.5 text-xs text-slate-600">
            {{ toast.message }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cerrar notificación"
          @click="removeToast(toast.id)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
