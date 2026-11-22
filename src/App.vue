<script setup lang="ts">
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import AppFooter from './components/AppFooter.vue';
import AppHeader from './components/AppHeader.vue';
import SupportWhatsAppButton from './components/SupportWhatsAppButton.vue';
import ToastContainer from './components/ToastContainer.vue';
import { useToast } from './composables/useToast';
import { checkQrStatus } from './services/api';
import type { QrStatusResponse } from './types/localifacil';
import AdminTreasuryView from './views/AdminTreasuryView.vue';
import FoundItemView from './views/FoundItemView.vue';
import LandingRegisterView from './views/LandingRegisterView.vue';

const { error: showError } = useToast();

type AppMode = 'loading' | 'landing' | 'found' | 'not_found' | 'error' | 'admin';

const mode = ref<AppMode>('landing');
const qrIdFromUrl = ref<string | null>(null);
const qrData = ref<QrStatusResponse | null>(null);
const errorMessage = ref<string>('');

const resolveRouteFromQuery = async () => {
  const params = new URLSearchParams(window.location.search);
  const isAdmin = params.get('admin') === '1';

  if (isAdmin) {
    qrIdFromUrl.value = null;
    qrData.value = null;
    mode.value = 'admin';
    return;
  }

  const rawId = params.get('id')?.trim();

  if (!rawId) {
    qrIdFromUrl.value = null;
    qrData.value = null;
    mode.value = 'landing';
    return;
  }

  qrIdFromUrl.value = rawId;
  mode.value = 'loading';
  errorMessage.value = '';

  try {
    const response = await checkQrStatus(rawId);
    qrData.value = response;

    if (response.status === 'ACTIVE') {
      mode.value = 'found';
    } else if (response.status === 'UNASSIGNED') {
      mode.value = 'landing';
    } else {
      mode.value = 'not_found';
    }
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'No se pudo verificar el estado del código QR.';
    errorMessage.value = msg;
    mode.value = 'error';
    showError('Error de verificación', msg);
  }
};

const goHome = () => {
  window.location.href = '/';
};

onMounted(() => {
  void resolveRouteFromQuery();
});
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#FAFAFA] text-[#16263E]">
    <AppHeader />

    <main class="flex-1">
      <!-- Skeleton Loader limpio mientras consulta GET ?id=... -->
      <section
        v-if="mode === 'loading'"
        class="mx-auto max-w-2xl px-4 py-12 sm:px-6"
        aria-busy="true"
        aria-label="Cargando información del llavero"
      >
        <div
          class="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
        >
          <div class="h-24 animate-pulse bg-[#7D1119]/20" />
          <div class="space-y-5 p-6 sm:p-8">
            <div class="h-20 animate-pulse rounded-xl bg-slate-200" />
            <div class="h-16 animate-pulse rounded-xl bg-slate-100" />
            <div class="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="h-12 animate-pulse rounded-xl bg-slate-200" />
              <div class="h-12 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>
      </section>

      <!-- Vista 3: Panel de Administrador / Tesorería (?admin=1) -->
      <AdminTreasuryView v-else-if="mode === 'admin'" />

      <!-- Vista 2: Objeto Perdido (ACTIVE) -->
      <FoundItemView
        v-else-if="mode === 'found' && qrData"
        :qr-data="qrData"
      />

      <!-- Vista 1: Landing + Registro (sin ?id o con ?id UNASSIGNED) -->
      <LandingRegisterView
        v-else-if="mode === 'landing'"
        :physical-keychain-id="qrIdFromUrl"
      />

      <!-- Estado NOT_FOUND o Error de red -->
      <section
        v-else
        class="mx-auto max-w-lg px-4 py-16 text-center sm:px-6"
      >
        <div
          class="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm"
        >
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7D1119]/10 text-[#7D1119]"
          >
            <AlertTriangle class="h-7 w-7" />
          </div>

          <h1 class="mt-4 text-xl font-bold text-[#16263E]">
            {{
              mode === 'not_found'
                ? 'Código QR no reconocido'
                : 'No pudimos consultar el código'
            }}
          </h1>

          <p class="mt-2 text-sm text-slate-600">
            {{
              mode === 'not_found'
                ? `El código "${qrIdFromUrl}" no se encuentra registrado en el sistema de Localifácil UNMSM.`
                : errorMessage
            }}
          </p>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7D1119] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5E0C12] cursor-pointer"
              @click="resolveRouteFromQuery"
            >
              <RefreshCw class="h-4 w-4" />
              <span>Reintentar</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#16263E] transition-colors hover:bg-slate-50 cursor-pointer"
              @click="goHome"
            >
              <ArrowLeft class="h-4 w-4" />
              <span>Ir al inicio</span>
            </button>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
    <SupportWhatsAppButton />
    <ToastContainer />
  </div>
</template>
