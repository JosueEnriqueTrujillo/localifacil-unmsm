<script setup lang="ts">
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-vue-next';
import QRCode from 'qrcode';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useToast } from '../composables/useToast';

interface Props {
  open: boolean;
  idLlavero: string;
  studentName: string;
  facultad: string;
  boletaUrl?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { success, error: showError } = useToast();
const qrCanvasRef = ref<HTMLCanvasElement | null>(null);
const isDownloading = ref(false);

const targetQrUrl = computed(() => {
  return `${window.location.origin}/?id=${encodeURIComponent(props.idLlavero)}`;
});

const renderQrToCanvas = async () => {
  if (!props.open || !props.idLlavero) return;
  await nextTick();
  const canvas = qrCanvasRef.value;
  if (!canvas) return;

  try {
    await QRCode.toCanvas(canvas, targetQrUrl.value, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#16263E',
        light: '#FFFFFF',
      },
    });
  } catch {
    showError(
      'Error al generar QR',
      'No se pudo renderizar el código QR en el navegador.'
    );
  }
};

const downloadQrPng = async () => {
  if (!props.idLlavero) return;
  isDownloading.value = true;

  try {
    const highResDataUrl = await QRCode.toDataURL(targetQrUrl.value, {
      width: 1024,
      margin: 3,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#16263E',
        light: '#FFFFFF',
      },
    });

    const link = document.createElement('a');
    link.href = highResDataUrl;
    link.download = `Localifacil-QR-${props.idLlavero}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success(
      'QR descargado',
      `Se guardó Localifacil-QR-${props.idLlavero}.png en alta resolución.`
    );
  } catch {
    showError(
      'Error de descarga',
      'No se pudo exportar la imagen PNG del código QR.'
    );
  } finally {
    isDownloading.value = false;
  }
};

watch(
  () => [props.open, props.idLlavero],
  () => {
    renderQrToCanvas();
  }
);

onMounted(() => {
  renderQrToCanvas();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#16263E]/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-qr-title"
    >
      <div
        class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
      >
        <!-- Header del modal -->
        <div
          class="bg-gradient-to-r from-[#7D1119] to-[#4A090E] px-6 py-5 text-white"
        >
          <button
            type="button"
            class="absolute top-4 right-4 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar ventana"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>

          <div class="flex items-center gap-2.5 text-[#D4A237]">
            <CheckCircle2 class="h-5 w-5" />
            <span class="text-xs font-bold tracking-wider uppercase">
              Registro Completado
            </span>
          </div>
          <h2 id="modal-qr-title" class="mt-1 text-xl font-bold text-white">
            Tu Credencial Digital Localifácil
          </h2>
          <p class="mt-0.5 text-xs text-white/80">
            Código asignado y listo para proteger tus pertenencias en San Marcos.
          </p>
        </div>

        <!-- Contenido de la credencial -->
        <div class="p-6">
          <div
            class="flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-5 text-center"
          >
            <div
              class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#16263E] px-3.5 py-1 text-xs font-bold tracking-wide text-white"
            >
              <QrCode class="h-3.5 w-3.5 text-[#D4A237]" />
              <span>ID: {{ idLlavero }}</span>
            </div>

            <div
              class="rounded-xl border-2 border-[#D4A237]/40 bg-white p-3 shadow-sm"
            >
              <canvas ref="qrCanvasRef" class="block h-56 w-56 sm:h-60 sm:w-60" />
            </div>

            <div class="mt-4 w-full border-t border-[#E5E7EB] pt-3">
              <p class="text-sm font-bold text-[#16263E]">{{ studentName }}</p>
              <p class="mt-0.5 text-xs font-medium text-[#7D1119]">
                {{ facultad }}
              </p>
              <p
                class="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-500"
              >
                <ShieldCheck class="h-3.5 w-3.5 text-[#D4A237]" />
                <span>Comunidad Universitaria UNMSM - Ciudad Universitaria</span>
              </p>
            </div>
          </div>

          <p class="mt-3 text-center text-xs text-slate-500">
            URL de enlace:
            <span class="font-mono font-medium text-[#16263E] break-all">
              {{ targetQrUrl }}
            </span>
          </p>

          <!-- Botones de acción -->
          <div class="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              :disabled="isDownloading"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7D1119] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#5E0C12] disabled:opacity-60 cursor-pointer"
              @click="downloadQrPng"
            >
              <Download class="h-4 w-4" />
              <span>Descargar mi QR en PNG</span>
            </button>

            <a
              v-if="boletaUrl"
              :href="boletaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#16263E] bg-white px-4 py-3 text-sm font-semibold text-[#16263E] transition-colors hover:bg-[#16263E] hover:text-white"
            >
              <FileText class="h-4 w-4" />
              <span>Descargar Boleta Electrónica (PDF)</span>
              <ExternalLink class="h-3.5 w-3.5" />
            </a>

            <button
              v-else
              type="button"
              disabled
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
              title="La boleta se enviará a tu correo institucional"
            >
              <FileText class="h-4 w-4" />
              <span>Boleta enviada al correo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
