<script setup lang="ts">
import {
  Building2,
  GraduationCap,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
} from 'lucide-vue-next';
import { onMounted, onUnmounted, ref } from 'vue';
import BrandLogo from '../components/BrandLogo.vue';
import { useToast } from '../composables/useToast';
import { INSTITUTIONAL_SEAL } from '../config/unmsm';
import { reportScanLocation } from '../services/api';
import type { ContactMethod, QrStatusResponse } from '../types/localifacil';

interface Props {
  qrData: QrStatusResponse;
}

const props = defineProps<Props>();

const { error: showError, info } = useToast();

const deliveryMessage = ref('');
const isSendingAction = ref<ContactMethod | null>(null);

const currentCoords = ref<{
  latitude: number;
  longitude: number;
  accuracy?: number;
} | null>(null);

const gpsStatus = ref<'pending' | 'active' | 'denied'>('pending');
let watchId: number | null = null;
let trackingIntervalId: number | null = null;
let initialTrackingSent = false;

const sendSilentTracking = async () => {
  try {
    await reportScanLocation({
      action: 'REPORT_SCAN',
      id: props.qrData.id,
      latitude: currentCoords.value?.latitude,
      longitude: currentCoords.value?.longitude,
      accuracy: currentCoords.value?.accuracy,
      contactMethod: 'tracking',
    });
  } catch {
    // El tracking silencioso de sesión no interrumpe la experiencia del usuario
  }
};

const startGeolocationTracking = () => {
  if (!('geolocation' in navigator)) {
    gpsStatus.value = 'denied';
    void sendSilentTracking();
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      gpsStatus.value = 'active';
      currentCoords.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      if (!initialTrackingSent) {
        initialTrackingSent = true;
        void sendSilentTracking();
      }
    },
    () => {
      gpsStatus.value = 'denied';
      if (!initialTrackingSent) {
        initialTrackingSent = true;
        void sendSilentTracking();
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    }
  );

  // Enviar actualización silenciosa cada 20 segundos mientras la pestaña siga abierta
  trackingIntervalId = window.setInterval(() => {
    void sendSilentTracking();
  }, 20000);
};

const handleSecureContact = async (method: 'whatsapp' | 'phone') => {
  if (isSendingAction.value) return;
  isSendingAction.value = method;

  try {
    const response = await reportScanLocation({
      action: 'REPORT_SCAN',
      id: props.qrData.id,
      latitude: currentCoords.value?.latitude,
      longitude: currentCoords.value?.longitude,
      accuracy: currentCoords.value?.accuracy,
      message: deliveryMessage.value.trim() || undefined,
      contactMethod: method,
    });

    const targetUrl =
      method === 'whatsapp' ? response.whatsappUrl : response.phoneUrl;

    if (!targetUrl) {
      showError(
        'Enlace no disponible',
        'El servidor no devolvió el canal de contacto configurado.'
      );
      return;
    }

    info(
      'Conectando de forma segura',
      'Se notificó al estudiante con tu mensaje y ubicación.'
    );
    window.location.href = targetUrl;
  } catch (err) {
    showError(
      'Error al contactar',
      err instanceof Error
        ? err.message
        : 'No se pudo procesar la solicitud de contacto.'
    );
  } finally {
    isSendingAction.value = null;
  }
};

onMounted(() => {
  startGeolocationTracking();
});

onUnmounted(() => {
  if (watchId !== null && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
  if (trackingIntervalId !== null) {
    window.clearInterval(trackingIntervalId);
  }
});
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
    <div
      class="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-md"
    >
      <!-- Cabecera institucional de la tarjeta -->
      <div
        class="bg-gradient-to-r from-[#7D1119] to-[#4A090E] px-6 py-6 text-white"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <BrandLogo size="md" />
            <div>
              <span
                class="text-xs font-bold tracking-wider text-[#D4A237] uppercase"
              >
                Objeto Protegido Localifácil
              </span>
              <h1 class="text-xl font-extrabold text-white">
                Código {{ qrData.id }}
              </h1>
            </div>
          </div>

          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-[#D4A237]/40 bg-[#D4A237]/15 px-3 py-1 text-xs font-semibold text-[#D4A237]"
          >
            <ShieldCheck class="h-3.5 w-3.5" />
            <span>Activo</span>
          </span>
        </div>
      </div>

      <div class="space-y-6 p-6 sm:p-8">
        <!-- Tarjeta de Identificación Institucional -->
        <div
          class="rounded-2xl border-2 border-[#7D1119]/20 bg-[#7D1119]/5 p-5"
        >
          <div class="flex items-start gap-3.5">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7D1119] text-white"
            >
              <GraduationCap class="h-6 w-6" />
            </div>
            <div>
              <p class="text-xs font-bold tracking-wider text-[#7D1119] uppercase">
                Identificación Institucional
              </p>
              <p class="mt-1 text-base font-bold text-[#16263E] sm:text-lg">
                Este objeto pertenece a un estudiante de la
                <span class="text-[#7D1119]">
                  {{ qrData.facultad || 'UNMSM' }}
                </span>
                - UNMSM
              </p>
            </div>
          </div>
        </div>

        <!-- Recuadro informativo de entrega en facultad -->
        <div
          class="rounded-xl border border-[#D4A237]/40 bg-[#D4A237]/10 p-4"
        >
          <div class="flex items-start gap-3">
            <Building2 class="mt-0.5 h-5 w-5 shrink-0 text-[#16263E]" />
            <p class="text-sm leading-relaxed text-[#16263E]">
              ¿No logras contactar al dueño? Puedes dejar este objeto de forma
              segura en la recepción o portería de la
              <strong class="font-bold">
                {{ qrData.facultad || 'facultad correspondiente' }}
              </strong>
              dentro de Ciudad Universitaria.
            </p>
          </div>
        </div>

        <!-- Estado de ubicación GPS -->
        <div
          class="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-xs"
        >
          <div class="flex items-center gap-2 text-[#16263E]">
            <MapPin
              class="h-4 w-4"
              :class="
                gpsStatus === 'active' ? 'text-emerald-600' : 'text-[#D4A237]'
              "
            />
            <span class="font-medium">
              {{
                gpsStatus === 'active'
                  ? 'Ubicación GPS lista para notificar al dueño'
                  : gpsStatus === 'denied'
                    ? 'Ubicación GPS no autorizada (puedes escribir el punto de entrega)'
                    : 'Obteniendo ubicación aproximada...'
              }}
            </span>
          </div>

          <span
            class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500"
          >
            <Lock class="h-3.5 w-3.5 text-[#16263E]" />
            <span>Privacidad protegida</span>
          </span>
        </div>

        <!-- Mensaje o punto de entrega opcional -->
        <div>
          <label
            for="deliveryMessage"
            class="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[#16263E]"
          >
            <MessageSquare class="h-4 w-4 text-[#7D1119]" />
            <span>Mensaje o punto de entrega (opcional)</span>
          </label>
          <textarea
            id="deliveryMessage"
            v-model="deliveryMessage"
            rows="3"
            maxlength="240"
            placeholder="Ej. Lo dejé en la garita de la facultad o estoy frente a la biblioteca central"
            class="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#16263E] placeholder:text-slate-400 focus:border-[#7D1119] focus:ring-2 focus:ring-[#7D1119]/15 focus:outline-none"
          />
        </div>

        <!-- Botones de contacto seguro (sin exponer el teléfono en HTML) -->
        <div class="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            :disabled="isSendingAction !== null"
            class="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#7D1119] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5E0C12] disabled:opacity-60 cursor-pointer"
            @click="handleSecureContact('whatsapp')"
          >
            <Loader2
              v-if="isSendingAction === 'whatsapp'"
              class="h-4 w-4 animate-spin"
            />
            <MessageCircle v-else class="h-4 w-4 text-[#D4A237]" />
            <span>Contactar por WhatsApp</span>
          </button>

          <button
            type="button"
            :disabled="isSendingAction !== null"
            class="inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#16263E] bg-[#16263E] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#16263E]/90 disabled:opacity-60 cursor-pointer"
            @click="handleSecureContact('phone')"
          >
            <Loader2
              v-if="isSendingAction === 'phone'"
              class="h-4 w-4 animate-spin"
            />
            <PhoneCall v-else class="h-4 w-4 text-[#D4A237]" />
            <span>Llamar al dueño</span>
          </button>
        </div>

        <p class="text-center text-xs text-slate-500">
          {{ INSTITUTIONAL_SEAL }}
        </p>
      </div>
    </div>
  </section>
</template>
