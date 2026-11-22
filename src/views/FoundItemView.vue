<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Navigation,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import BrandLogo from '../components/BrandLogo.vue';
import { useToast } from '../composables/useToast';
import { INSTITUTIONAL_SEAL } from '../config/unmsm';
import { reportScanLocation } from '../services/api';
import type { QrStatusResponse } from '../types/localifacil';

interface Props {
  qrData: QrStatusResponse;
}

interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface CampusPoint {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

const DEFAULT_UNMSM_COORDS: Coords = {
  latitude: -12.056,
  longitude: -77.0844,
};

const CAMPUS_POINTS: CampusPoint[] = [
  {
    id: 'unmsm-central',
    label: 'Ciudad Universitaria UNMSM',
    latitude: -12.056,
    longitude: -77.0844,
  },
  {
    id: 'puerta-1',
    label: 'Puerta 1 / Av. Venezuela',
    latitude: -12.0588,
    longitude: -77.0845,
  },
  {
    id: 'biblioteca',
    label: 'Biblioteca Central',
    latitude: -12.0563,
    longitude: -77.0837,
  },
  {
    id: 'comedor',
    label: 'Comedor Universitario',
    latitude: -12.0574,
    longitude: -77.0819,
  },
  {
    id: 'facultad',
    label: 'Facultad / Pabellón',
    latitude: -12.0549,
    longitude: -77.0853,
  },
];

const props = defineProps<Props>();

const { success, error: showError, info } = useToast();

const deliveryMessage = ref('');
const isSendingEmail = ref(false);
const emailSent = ref(false);

const gpsCoords = ref<Coords | null>(null);
const fallbackCoords = ref<Coords>({ ...DEFAULT_UNMSM_COORDS });
const locationSource = ref<'gps' | 'ip' | 'campus' | 'default'>('default');
const selectedCampusId = ref<string>('unmsm-central');
const gpsStatus = ref<'pending' | 'active' | 'denied'>('pending');

let watchId: number | null = null;
let trackingIntervalId: number | null = null;
let initialTrackingSent = false;

const activeCoords = computed<Coords>(() => {
  return gpsCoords.value ?? fallbackCoords.value;
});

const googleMapsUrl = computed(() => {
  const { latitude, longitude } = activeCoords.value;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
});

const googleMapsEmbedUrl = computed(() => {
  const { latitude, longitude } = activeCoords.value;
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=17&output=embed`;
});

const cleanOwnerPhone = computed(() => {
  const digits = String(props.qrData.telefono ?? '').replace(/\D/g, '');
  return digits.replace(/^51(?=\d{9}$)/, '');
});

const selectedCampusLabel = computed(() => {
  return (
    CAMPUS_POINTS.find((p) => p.id === selectedCampusId.value)?.label ??
    'Ciudad Universitaria UNMSM'
  );
});

const directWhatsappHref = computed(() => {
  const extraNote = deliveryMessage.value.trim();
  const baseText = `Hola, encontré tu objeto con código ${props.qrData.id} de Localifácil UNMSM. Mi ubicación actual: ${googleMapsUrl.value}`;
  const fullText = extraNote ? `${baseText} — Nota: ${extraNote}` : baseText;

  if (cleanOwnerPhone.value) {
    return `https://wa.me/51${cleanOwnerPhone.value}?text=${encodeURIComponent(fullText)}`;
  }

  if (props.qrData.whatsappUrl) {
    return props.qrData.whatsappUrl;
  }

  return '';
});

const directCallHref = computed(() => {
  if (cleanOwnerPhone.value) {
    return `tel:+51${cleanOwnerPhone.value}`;
  }
  return props.qrData.callUrl || '';
});

const sendSilentTracking = async () => {
  try {
    await reportScanLocation({
      action: 'REPORT_SCAN',
      id: props.qrData.id,
      latitude: activeCoords.value.latitude,
      longitude: activeCoords.value.longitude,
      accuracy: activeCoords.value.accuracy,
      contactMethod: 'tracking',
    });
  } catch {
    // El tracking silencioso no interrumpe la experiencia del usuario
  }
};

const fetchIpFallbackLocation = async () => {
  // Si el usuario ya eligió un punto manual del campus o ya hay GPS, no sobrescribir
  if (gpsCoords.value || locationSource.value === 'campus') return;

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return;
    const data = (await res.json()) as {
      latitude?: number;
      longitude?: number;
    };

    const currentSource: string = locationSource.value;
    if (
      typeof data.latitude === 'number' &&
      typeof data.longitude === 'number' &&
      !gpsCoords.value &&
      currentSource !== 'campus'
    ) {
      fallbackCoords.value = {
        latitude: data.latitude,
        longitude: data.longitude,
      };
      locationSource.value = 'ip';
    }
  } catch {
    // Mantiene las coordenadas por defecto de Ciudad Universitaria UNMSM
  }
};

const selectCampusPoint = (point: CampusPoint) => {
  selectedCampusId.value = point.id;
  fallbackCoords.value = {
    latitude: point.latitude,
    longitude: point.longitude,
  };
  locationSource.value = 'campus';
  if (!deliveryMessage.value.trim()) {
    deliveryMessage.value = `Referencia en campus: ${point.label}`;
  }
  void sendSilentTracking();
};

const clearGeolocationWatch = () => {
  if (watchId !== null && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
};

const startGeolocationTracking = () => {
  clearGeolocationWatch();

  if (!('geolocation' in navigator)) {
    gpsStatus.value = 'denied';
    void fetchIpFallbackLocation();
    void sendSilentTracking();
    return;
  }

  gpsStatus.value = 'pending';

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      gpsStatus.value = 'active';
      locationSource.value = 'gps';
      gpsCoords.value = {
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
      void fetchIpFallbackLocation();
      if (!initialTrackingSent) {
        initialTrackingSent = true;
        void sendSilentTracking();
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 8000,
    }
  );

  if (trackingIntervalId === null) {
    trackingIntervalId = window.setInterval(() => {
      void sendSilentTracking();
    }, 20000);
  }
};

const retryGps = () => {
  info('Solicitando GPS', 'Intentando obtener tu ubicación exacta...');
  startGeolocationTracking();
};

const notifyContactAttempt = (method: 'whatsapp' | 'phone') => {
  void reportScanLocation({
    action: 'REPORT_SCAN',
    id: props.qrData.id,
    latitude: activeCoords.value.latitude,
    longitude: activeCoords.value.longitude,
    accuracy: activeCoords.value.accuracy,
    message:
      deliveryMessage.value.trim() ||
      (gpsStatus.value === 'denied'
        ? `Referencia: ${selectedCampusLabel.value}`
        : undefined),
    contactMethod: method,
  }).catch(() => {
    // No bloquea la apertura directa de WhatsApp o marcador telefónico
  });
};

const handleSendInternalNotification = async () => {
  if (isSendingEmail.value) return;
  isSendingEmail.value = true;
  emailSent.value = false;

  try {
    await reportScanLocation({
      action: 'REPORT_SCAN',
      id: props.qrData.id,
      latitude: activeCoords.value.latitude,
      longitude: activeCoords.value.longitude,
      accuracy: activeCoords.value.accuracy,
      message:
        deliveryMessage.value.trim() ||
        (gpsStatus.value === 'denied'
          ? `Referencia: ${selectedCampusLabel.value}`
          : 'Objeto escaneado'),
      contactMethod: 'tracking',
    });

    emailSent.value = true;
    success(
      'Notificación enviada',
      'El dueño recibió tu mensaje y ubicación en su correo.'
    );
  } catch (err) {
    showError(
      'No se pudo enviar la notificación',
      err instanceof Error
        ? err.message
        : 'Ocurrió un error al enviar la notificación al correo.'
    );
  } finally {
    isSendingEmail.value = false;
  }
};

onMounted(() => {
  startGeolocationTracking();
});

onUnmounted(() => {
  clearGeolocationWatch();
  if (trackingIntervalId !== null) {
    window.clearInterval(trackingIntervalId);
    trackingIntervalId = null;
  }
});
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
    <div
      class="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-md"
    >
      <!-- Cabecera institucional -->
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
        <!-- Identificación Institucional -->
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

        <!-- Botones Directos de Contacto Inmediato -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-[#16263E] uppercase tracking-wide">
              Contacto Inmediato con el Dueño
            </h2>
            <span
              class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500"
            >
              <Lock class="h-3.5 w-3.5 text-[#16263E]" />
              <span>Canal Directo</span>
            </span>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <a
              v-if="directWhatsappHref"
              :href="directWhatsappHref"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
              @click="notifyContactAttempt('whatsapp')"
            >
              <MessageCircle class="h-5 w-5" />
              <span>Escribir por WhatsApp</span>
            </a>

            <a
              v-if="directCallHref"
              :href="directCallHref"
              class="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#7D1119] px-5 py-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5E0C12]"
              @click="notifyContactAttempt('phone')"
            >
              <PhoneCall class="h-5 w-5 text-[#D4A237]" />
              <span>Llamar Ahora</span>
            </a>
          </div>
        </div>

        <!-- Ubicación en Tiempo Real + Mapa Embebido -->
        <div
          class="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] bg-white px-4 py-3"
          >
            <div class="flex items-center gap-2 text-xs">
              <MapPin
                class="h-4 w-4 shrink-0"
                :class="
                  gpsStatus === 'active'
                    ? 'text-emerald-600'
                    : gpsStatus === 'denied'
                      ? 'text-amber-600'
                      : 'text-[#D4A237]'
                "
              />
              <span class="font-bold text-[#16263E]">
                {{
                  gpsStatus === 'active'
                    ? 'Ubicación GPS en tiempo real activa'
                    : gpsStatus === 'denied'
                      ? locationSource === 'campus'
                        ? `Ubicación referencial: ${selectedCampusLabel}`
                        : locationSource === 'ip'
                          ? 'Ubicación aproximada por red (GPS bloqueado)'
                          : 'Ubicación referencial: Ciudad Universitaria UNMSM'
                      : 'Obteniendo ubicación GPS exacta...'
                }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <span class="font-mono text-[11px] font-semibold text-slate-600">
                {{ activeCoords.latitude.toFixed(6) }},
                {{ activeCoords.longitude.toFixed(6) }}
              </span>
              <a
                :href="googleMapsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-2.5 py-1 text-[11px] font-bold text-[#16263E] transition-colors hover:border-[#7D1119] hover:text-[#7D1119]"
              >
                <Navigation class="h-3 w-3" />
                <span>Abrir en Google Maps</span>
                <ExternalLink class="h-3 w-3" />
              </a>
            </div>
          </div>

          <!-- Aviso y Respaldo si el GPS está bloqueado -->
          <div
            v-if="gpsStatus === 'denied'"
            class="space-y-3 border-b border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-start gap-2">
                <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p class="font-bold">
                    Permiso de GPS bloqueado o no disponible
                  </p>
                  <p class="mt-0.5 text-amber-900/90">
                    Puedes reintentar el GPS o elegir un punto de referencia en
                    el campus para enviarlo al dueño.
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700 cursor-pointer"
                @click="retryGps"
              >
                <RefreshCw class="h-3.5 w-3.5" />
                <span>Reintentar GPS</span>
              </button>
            </div>

            <!-- Selector rápido de punto de referencia en campus -->
            <div>
              <p class="mb-1.5 text-[11px] font-bold tracking-wide text-amber-900 uppercase">
                Punto de referencia rápido en campus:
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="point in CAMPUS_POINTS"
                  :key="point.id"
                  type="button"
                  class="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer"
                  :class="
                    selectedCampusId === point.id && locationSource === 'campus'
                      ? 'bg-[#7D1119] text-white'
                      : 'border border-amber-300 bg-white text-[#16263E] hover:border-[#7D1119]'
                  "
                  @click="selectCampusPoint(point)"
                >
                  {{ point.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Mapa Visual Embebido -->
          <div class="relative h-56 w-full bg-slate-200 sm:h-64">
            <iframe
              :src="googleMapsEmbedUrl"
              title="Mapa de ubicación actual"
              class="h-full w-full border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen
            />
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

        <!-- Formulario opcional para notificación interna por correo -->
        <form
          class="space-y-3 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 sm:p-5"
          @submit.prevent="handleSendInternalNotification"
        >
          <label
            for="deliveryMessage"
            class="flex items-center gap-2 text-sm font-semibold text-[#16263E]"
          >
            <MessageSquare class="h-4 w-4 text-[#7D1119]" />
            <span>Enviar notificación por correo al dueño (opcional)</span>
          </label>
          <textarea
            id="deliveryMessage"
            v-model="deliveryMessage"
            rows="3"
            maxlength="240"
            placeholder="Ej. Lo dejé en la garita de la facultad o estoy frente a la biblioteca central"
            class="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#16263E] placeholder:text-slate-400 focus:border-[#7D1119] focus:ring-2 focus:ring-[#7D1119]/15 focus:outline-none"
          />

          <div class="flex flex-wrap items-center justify-between gap-3">
            <span
              v-if="emailSent"
              class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"
            >
              <CheckCircle2 class="h-4 w-4" />
              <span>Alerta y ubicación enviadas al correo del dueño.</span>
            </span>
            <span v-else class="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Mail class="h-3.5 w-3.5 text-[#7D1119]" />
              <span>Incluye tus coordenadas actuales automáticamente.</span>
            </span>

            <button
              type="submit"
              :disabled="isSendingEmail"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-[#16263E] bg-[#16263E] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#16263E]/90 disabled:opacity-60 cursor-pointer"
            >
              <Loader2 v-if="isSendingEmail" class="h-3.5 w-3.5 animate-spin" />
              <Send v-else class="h-3.5 w-3.5 text-[#D4A237]" />
              <span>
                {{
                  isSendingEmail
                    ? 'Enviando alerta...'
                    : 'Notificar por Correo y GPS'
                }}
              </span>
            </button>
          </div>
        </form>

        <p class="text-center text-xs text-slate-500">
          {{ INSTITUTIONAL_SEAL }}
        </p>
      </div>
    </div>
  </section>
</template>
