<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

withDefaults(defineProps<Props>(), {
  size: 'md',
});

const imageFailed = ref(false);
const logoSrc = '/logo-localifacil.png';

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};
</script>

<template>
  <div
    class="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#E5E7EB]"
    :class="sizeClasses[size]"
  >
    <img
      v-if="!imageFailed"
      :src="logoSrc"
      alt="Logo Localifácil UNMSM"
      class="h-full w-full object-contain p-1"
      @error="imageFailed = true"
    />
    <!-- Isotipo vectorial fallback: Pin guinda con órbita dorada y QR central -->
    <svg
      v-else
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="h-full w-full p-1.5"
      aria-label="Isotipo Localifácil UNMSM"
    >
      <ellipse
        cx="32"
        cy="34"
        rx="25"
        ry="11"
        transform="rotate(-18 32 34)"
        stroke="#D4A237"
        stroke-width="3"
      />
      <path
        d="M32 6C20.954 6 12 14.954 12 26C12 39.5 32 58 32 58C32 58 52 39.5 52 26C52 14.954 43.046 6 32 6Z"
        fill="#7D1119"
      />
      <rect x="22" y="16" width="20" height="20" rx="3" fill="#FFFFFF" />
      <rect x="24.5" y="18.5" width="5.5" height="5.5" rx="1" fill="#16263E" />
      <rect x="34" y="18.5" width="5.5" height="5.5" rx="1" fill="#16263E" />
      <rect x="24.5" y="28" width="5.5" height="5.5" rx="1" fill="#16263E" />
      <rect x="34" y="28" width="2.5" height="2.5" fill="#7D1119" />
      <rect x="37" y="31" width="2.5" height="2.5" fill="#16263E" />
      <rect x="31.5" y="25" width="2.5" height="2.5" fill="#D4A237" />
    </svg>
  </div>
</template>
