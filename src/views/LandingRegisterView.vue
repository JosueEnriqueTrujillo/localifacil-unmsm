<script setup lang="ts">
import {
  AlertCircle,
  ArrowDown,
  Award,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  User,
} from 'lucide-vue-next';
import { computed, reactive, ref } from 'vue';
import PendingVerificationModal from '../components/PendingVerificationModal.vue';
import { useToast } from '../composables/useToast';
import {
  ALLOWED_EMAIL_REGEX,
  FACULTADES_UNMSM,
  PLANS,
  YAPE_CONFIG,
  type PlanOption,
} from '../config/unmsm';
import { registerStudent } from '../services/api';
import { compressImageToBase64 } from '../utils/image';

interface Props {
  physicalKeychainId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  physicalKeychainId: null,
});

const { success, error: showError, info } = useToast();

const formSectionRef = ref<HTMLElement | null>(null);
const plansSectionRef = ref<HTMLElement | null>(null);
const yapeQrFailed = ref(false);

const selectedPlan = ref<PlanOption>(PLANS[1] ?? PLANS[0]!);

const form = reactive({
  fullName: '',
  studentCode: '',
  email: '',
  phone: '',
  facultad: '',
});

const touched = reactive({
  fullName: false,
  studentCode: false,
  email: false,
  phone: false,
  facultad: false,
  paymentProof: false,
});

const paymentProofBase64 = ref<string>('');
const paymentProofName = ref<string>('');
const isCompressing = ref(false);
const isSubmitting = ref(false);

const modalState = reactive({
  open: false,
  idLlavero: '',
  studentName: '',
  facultad: '',
  email: '',
});

const isPhysicalActivation = computed(() => Boolean(props.physicalKeychainId));

const computedLlaveroId = computed(() => {
  if (props.physicalKeychainId) {
    return props.physicalKeychainId;
  }
  const cleanCode = form.studentCode.replace(/\D/g, '');
  return cleanCode ? `LF-${cleanCode}` : 'LF-[CódigoAlumno]';
});

// Validaciones estrictas
const errors = computed(() => {
  const errs: Record<string, string> = {};

  if (!form.fullName.trim() || form.fullName.trim().length < 3) {
    errs.fullName = 'Ingresa tus nombres y apellidos completos.';
  }

  if (!/^\d{8}$/.test(form.studentCode.trim())) {
    errs.studentCode =
      'El código universitario debe tener exactamente 8 dígitos numéricos.';
  }

  if (!ALLOWED_EMAIL_REGEX.test(form.email.trim())) {
    errs.email =
      'Ingresa un correo válido terminado en @gmail.com o @unmsm.edu.pe.';
  }

  if (!/^9\d{8}$/.test(form.phone.trim())) {
    errs.phone =
      'Ingresa un número de celular válido de 9 dígitos que empiece en 9.';
  }

  if (!form.facultad) {
    errs.facultad = 'Selecciona tu facultad dentro de la UNMSM.';
  }

  if (!paymentProofBase64.value) {
    errs.paymentProof = 'Adjunta la captura de pantalla de tu pago por Yape.';
  }

  return errs;
});

const isFormValid = computed(() => Object.keys(errors.value).length === 0);

const selectPlan = (plan: PlanOption) => {
  selectedPlan.value = plan;
  info('Plan seleccionado', `${plan.name} (${plan.formattedPrice})`);
  formSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const scrollToPlans = () => {
  plansSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const scrollToForm = () => {
  formSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const copyYapePhone = async () => {
  const cleanPhone = YAPE_CONFIG.phone.replace(/\s+/g, '');
  try {
    await navigator.clipboard.writeText(cleanPhone);
    success('Número copiado', `Yape ${YAPE_CONFIG.phone} copiado al portapapeles.`);
  } catch {
    info('Número de Yape', `Yapea al ${YAPE_CONFIG.phone}`);
  }
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  touched.paymentProof = true;

  if (!file) {
    paymentProofBase64.value = '';
    paymentProofName.value = '';
    return;
  }

  isCompressing.value = true;
  try {
    const compressed = await compressImageToBase64(file);
    paymentProofBase64.value = compressed;
    paymentProofName.value = file.name;
    success(
      'Captura adjuntada',
      'Imagen optimizada correctamente para el envío.'
    );
  } catch (err) {
    paymentProofBase64.value = '';
    paymentProofName.value = '';
    showError(
      'Error al procesar imagen',
      err instanceof Error ? err.message : 'Intenta con otra captura válida.'
    );
  } finally {
    isCompressing.value = false;
  }
};

const markAllTouched = () => {
  touched.fullName = true;
  touched.studentCode = true;
  touched.email = true;
  touched.phone = true;
  touched.facultad = true;
  touched.paymentProof = true;
};

const handleSubmit = async () => {
  markAllTouched();

  if (!isFormValid.value) {
    showError(
      'Revisa el formulario',
      'Completa todos los campos institucionales correctamente.'
    );
    return;
  }

  isSubmitting.value = true;
  try {
    const codigoAlumno = form.studentCode.trim();
    const nombres = form.fullName.trim();
    const correo = form.email.trim().toLowerCase();
    const telefono = form.phone.trim();

    const response = await registerStudent({
      action: 'REGISTER_USER',
      codigoAlumno,
      nombres,
      facultad: form.facultad,
      correo,
      telefono,
      plan: selectedPlan.value.name,
      monto: selectedPlan.value.price,
      voucherBase64: paymentProofBase64.value,
    });

    modalState.idLlavero = response.idLlavero || `LF-${codigoAlumno}`;
    modalState.studentName = nombres;
    modalState.facultad = form.facultad;
    modalState.email = correo;
    modalState.open = true;

    success(
      'Solicitud enviada',
      'Tu registro y captura de Yape están en verificación de pago.'
    );
  } catch (err) {
    showError(
      'No se pudo completar el registro',
      err instanceof Error
        ? err.message
        : 'Ocurrió un error al conectar con el servidor.'
    );
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section
      class="relative overflow-hidden bg-gradient-to-br from-[#7D1119] via-[#660D14] to-[#4A090E] text-white"
    >
      <div
        class="pointer-events-none absolute inset-0 opacity-15"
        style="
          background-image: radial-gradient(
            circle at 80% 20%,
            #d4a237 0%,
            transparent 45%
          );
        "
      />

      <div class="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div class="grid items-center gap-10 lg:grid-cols-12">
          <div class="lg:col-span-7">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-[#D4A237]/50 bg-[#D4A237]/15 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#D4A237]"
            >
              <Sparkles class="h-3.5 w-3.5" />
              <span>Comunidad Universitaria UNMSM - Ciudad Universitaria</span>
            </div>

            <h1
              class="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-tight"
            >
              Recupera tus objetos perdidos dentro de
              <span class="text-[#D4A237]">San Marcos</span> en minutos
            </h1>

            <p class="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              Protege tu mochila, llaves, laptop o carné universitario con un
              llavero inteligente QR. Quien lo encuentre podrá contactarte de
              forma segura sin exponer tu número telefónico y recibirás su
              ubicación GPS al instante.
            </p>

            <div class="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-[#D4A237] px-6 py-3.5 text-sm font-bold text-[#16263E] shadow-lg transition-all hover:bg-[#B88928] cursor-pointer"
                @click="isPhysicalActivation ? scrollToForm() : scrollToPlans()"
              >
                <span>
                  {{
                    isPhysicalActivation
                      ? 'Activar mi llavero físico ahora'
                      : 'Ver planes y activar mi QR'
                  }}
                </span>
                <ArrowDown class="h-4 w-4" />
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 cursor-pointer"
                @click="scrollToForm"
              >
                <QrCode class="h-4 w-4 text-[#D4A237]" />
                <span>Ir al registro directo</span>
              </button>
            </div>
          </div>

          <!-- Tarjetas de valor institucional -->
          <div class="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <div
              class="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
            >
              <div class="flex items-start gap-3.5">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4A237]/20 text-[#D4A237]"
                >
                  <MapPin class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white">
                    Geolocalización GPS Silenciosa
                  </h3>
                  <p class="mt-1 text-xs leading-relaxed text-white/80">
                    Cada escaneo registra las coordenadas aproximadas dentro o
                    fuera del campus para facilitar el reencuentro.
                  </p>
                </div>
              </div>
            </div>

            <div
              class="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
            >
              <div class="flex items-start gap-3.5">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4A237]/20 text-[#D4A237]"
                >
                  <Lock class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white">
                    Privacidad Anti-Scraping
                  </h3>
                  <p class="mt-1 text-xs leading-relaxed text-white/80">
                    Tu número jamás se muestra en la web. Solo se muestra tu
                    facultad y un puente seguro de WhatsApp o llamada.
                  </p>
                </div>
              </div>
            </div>

            <div
              class="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:col-span-2 lg:col-span-1"
            >
              <div class="flex items-start gap-3.5">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4A237]/20 text-[#D4A237]"
                >
                  <GraduationCap class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white">
                    Respaldo de las 20 Facultades UNMSM
                  </h3>
                  <p class="mt-1 text-xs leading-relaxed text-white/80">
                    Validación con código UNMSM de 8 dígitos, facultad y opción
                    de entrega segura en la garita de tu facultad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Sección de Planes -->
    <section
      ref="plansSectionRef"
      class="mx-auto max-w-6xl px-4 py-14 sm:px-6"
    >
      <div class="text-center">
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-[#7D1119]/10 px-3 py-1 text-xs font-bold tracking-wider text-[#7D1119] uppercase"
        >
          <Award class="h-3.5 w-3.5" />
          <span>Planes Estudiantiles</span>
        </span>
        <h2 class="mt-3 text-2xl font-extrabold text-[#16263E] sm:text-3xl">
          Elige tu protección Localifácil
        </h2>
        <p class="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          Pago único sin mensualidades. Incluye llavero acrílico físico con QR
          grabado y credencial digital descargable al instante.
        </p>
      </div>

      <div class="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
        <div
          v-for="plan in PLANS"
          :key="plan.id"
          class="relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all"
          :class="
            selectedPlan.id === plan.id
              ? 'border-[#7D1119] ring-2 ring-[#7D1119]/15 shadow-md'
              : 'border-[#E5E7EB] hover:border-[#D4A237]'
          "
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="
                plan.popular
                  ? 'bg-[#D4A237]/20 text-[#16263E]'
                  : 'bg-slate-100 text-slate-700'
              "
            >
              {{ plan.badge }}
            </span>

            <span
              v-if="selectedPlan.id === plan.id"
              class="inline-flex items-center gap-1 text-xs font-bold text-[#7D1119]"
            >
              <CheckCircle2 class="h-4 w-4" />
              <span>Seleccionado</span>
            </span>
          </div>

          <h3 class="mt-4 text-xl font-bold text-[#16263E]">{{ plan.name }}</h3>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-[#7D1119]">
              {{ plan.formattedPrice }}
            </span>
            <span class="text-xs font-medium text-slate-500">pago único</span>
          </div>
          <p class="mt-2 text-sm text-slate-600">{{ plan.description }}</p>

          <ul class="mt-5 flex-1 space-y-2.5 border-t border-[#E5E7EB] pt-5">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-2.5 text-sm text-[#16263E]"
            >
              <Check class="mt-0.5 h-4 w-4 shrink-0 text-[#7D1119]" />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <button
            type="button"
            class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer"
            :class="
              selectedPlan.id === plan.id
                ? 'bg-[#7D1119] text-white hover:bg-[#5E0C12]'
                : 'border border-[#16263E] bg-white text-[#16263E] hover:bg-[#16263E] hover:text-white'
            "
            @click="selectPlan(plan)"
          >
            <span>Seleccionar Plan</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Sección Formulario de Registro Institucional + Yape -->
    <section
      id="registro"
      ref="formSectionRef"
      class="mx-auto max-w-4xl px-4 pb-16 sm:px-6"
    >
      <div
        class="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
      >
        <!-- Alerta Modo Activación de Llavero Físico -->
        <div
          v-if="isPhysicalActivation"
          class="border-b border-[#D4A237]/40 bg-gradient-to-r from-[#7D1119] to-[#5E0C12] px-6 py-4 text-white"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4A237] text-[#16263E]"
            >
              <KeyRound class="h-5 w-5" />
            </div>
            <div>
              <p class="text-xs font-bold tracking-wider text-[#D4A237] uppercase">
                Modo Activación de Llavero Físico
              </p>
              <p class="text-sm font-semibold text-white sm:text-base">
                Estás activando el llavero físico con código:
                <span
                  class="ml-1 rounded bg-white/15 px-2 py-0.5 font-mono font-bold text-[#D4A237]"
                >
                  {{ physicalKeychainId }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div class="border-b border-[#E5E7EB] bg-[#FAFAFA] px-6 py-5">
          <h2 class="text-xl font-bold text-[#16263E]">
            Registro Institucional y Activación
          </h2>
          <p class="mt-1 text-sm text-slate-600">
            Completa tus datos sanmarquinos para vincular tu código QR y emitir
            tu credencial digital.
          </p>
        </div>

        <form class="space-y-6 p-6 sm:p-8" novalidate @submit.prevent="handleSubmit">
          <!-- Campo ID de Llavero (bloqueado si es físico o autogenerado) -->
          <div
            class="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4"
          >
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-2.5">
                <QrCode class="h-5 w-5 text-[#7D1119]" />
                <div>
                  <label
                    for="llavero-id"
                    class="block text-xs font-bold tracking-wide text-[#16263E] uppercase"
                  >
                    Código de Llavero Asignado
                  </label>
                  <p class="text-xs text-slate-500">
                    {{
                      isPhysicalActivation
                        ? 'Código físico pre-impreso vinculado a esta activación.'
                        : 'Se genera automáticamente con tu código de alumno.'
                    }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <input
                  id="llavero-id"
                  type="text"
                  :value="computedLlaveroId"
                  readonly
                  disabled
                  class="w-full rounded-lg border border-[#D4A237]/50 bg-white px-3.5 py-2 text-center font-mono text-sm font-bold text-[#16263E] sm:w-44"
                />
                <Lock class="h-4 w-4 shrink-0 text-[#D4A237]" />
              </div>
            </div>
          </div>

          <!-- Datos del Estudiante -->
          <div class="grid gap-5 sm:grid-cols-2">
            <!-- Nombres y Apellidos -->
            <div class="sm:col-span-2">
              <label
                for="fullName"
                class="mb-1.5 block text-sm font-semibold text-[#16263E]"
              >
                Nombres y Apellidos completos
              </label>
              <div class="relative">
                <User
                  class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400"
                />
                <input
                  id="fullName"
                  v-model="form.fullName"
                  type="text"
                  placeholder="Ej. María Fernanda Quispe Huamán"
                  class="w-full rounded-xl border bg-white py-2.5 pr-4 pl-10 text-sm text-[#16263E] placeholder:text-slate-400 focus:ring-2 focus:outline-none"
                  :class="
                    touched.fullName && errors.fullName
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#E5E7EB] focus:border-[#7D1119] focus:ring-[#7D1119]/15'
                  "
                  @blur="touched.fullName = true"
                />
              </div>
              <p
                v-if="touched.fullName && errors.fullName"
                class="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#7D1119]"
              >
                <AlertCircle class="h-3.5 w-3.5" />
                <span>{{ errors.fullName }}</span>
              </p>
            </div>

            <!-- Código Universitario -->
            <div>
              <label
                for="studentCode"
                class="mb-1.5 block text-sm font-semibold text-[#16263E]"
              >
                Código Universitario UNMSM
              </label>
              <div class="relative">
                <CreditCard
                  class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400"
                />
                <input
                  id="studentCode"
                  v-model="form.studentCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="8"
                  placeholder="Ej. 21200145"
                  class="w-full rounded-xl border bg-white py-2.5 pr-4 pl-10 font-mono text-sm text-[#16263E] placeholder:font-sans placeholder:text-slate-400 focus:ring-2 focus:outline-none"
                  :class="
                    touched.studentCode && errors.studentCode
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#E5E7EB] focus:border-[#7D1119] focus:ring-[#7D1119]/15'
                  "
                  @blur="touched.studentCode = true"
                />
              </div>
              <p
                v-if="touched.studentCode && errors.studentCode"
                class="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#7D1119]"
              >
                <AlertCircle class="h-3.5 w-3.5" />
                <span>{{ errors.studentCode }}</span>
              </p>
            </div>

            <!-- Teléfono / WhatsApp -->
            <div>
              <label
                for="phone"
                class="mb-1.5 block text-sm font-semibold text-[#16263E]"
              >
                Teléfono / WhatsApp
              </label>
              <div class="relative">
                <Phone
                  class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400"
                />
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  inputmode="numeric"
                  maxlength="9"
                  placeholder="Ej. 987654321"
                  class="w-full rounded-xl border bg-white py-2.5 pr-4 pl-10 font-mono text-sm text-[#16263E] placeholder:font-sans placeholder:text-slate-400 focus:ring-2 focus:outline-none"
                  :class="
                    touched.phone && errors.phone
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#E5E7EB] focus:border-[#7D1119] focus:ring-[#7D1119]/15'
                  "
                  @blur="touched.phone = true"
                />
              </div>
              <p
                v-if="touched.phone && errors.phone"
                class="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#7D1119]"
              >
                <AlertCircle class="h-3.5 w-3.5" />
                <span>{{ errors.phone }}</span>
              </p>
            </div>

            <!-- Correo Electrónico -->
            <div class="sm:col-span-2">
              <label
                for="email"
                class="mb-1.5 block text-sm font-semibold text-[#16263E]"
              >
                Correo electrónico (@gmail.com o @unmsm.edu.pe) donde recibirás tu QR, boleta y alertas GPS
              </label>
              <div class="relative">
                <Mail
                  class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400"
                />
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="Ej. maria.quispe@gmail.com o maria.quispe@unmsm.edu.pe"
                  class="w-full rounded-xl border bg-white py-2.5 pr-4 pl-10 text-sm text-[#16263E] placeholder:text-slate-400 focus:ring-2 focus:outline-none"
                  :class="
                    touched.email && errors.email
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#E5E7EB] focus:border-[#7D1119] focus:ring-[#7D1119]/15'
                  "
                  @blur="touched.email = true"
                />
              </div>
              <p
                v-if="touched.email && errors.email"
                class="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#7D1119]"
              >
                <AlertCircle class="h-3.5 w-3.5" />
                <span>{{ errors.email }}</span>
              </p>
            </div>

            <!-- Facultad UNMSM -->
            <div class="sm:col-span-2">
              <label
                for="facultad"
                class="mb-1.5 block text-sm font-semibold text-[#16263E]"
              >
                Facultad UNMSM
              </label>
              <div class="relative">
                <GraduationCap
                  class="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400"
                />
                <select
                  id="facultad"
                  v-model="form.facultad"
                  class="w-full rounded-xl border bg-white py-2.5 pr-4 pl-10 text-sm text-[#16263E] focus:ring-2 focus:outline-none"
                  :class="
                    touched.facultad && errors.facultad
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#E5E7EB] focus:border-[#7D1119] focus:ring-[#7D1119]/15'
                  "
                  @blur="touched.facultad = true"
                >
                  <option value="" disabled>
                    Selecciona una de las 20 facultades...
                  </option>
                  <option
                    v-for="fac in FACULTADES_UNMSM"
                    :key="fac"
                    :value="fac"
                  >
                    {{ fac }}
                  </option>
                </select>
              </div>
              <p
                v-if="touched.facultad && errors.facultad"
                class="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#7D1119]"
              >
                <AlertCircle class="h-3.5 w-3.5" />
                <span>{{ errors.facultad }}</span>
              </p>
            </div>
          </div>

          <!-- Pasarela Simulada Yape -->
          <div
            class="rounded-2xl border border-[#D4A237]/40 bg-[#FAFAFA] p-5 sm:p-6"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7D1119] text-white"
                >
                  <Smartphone class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="text-base font-bold text-[#16263E]">
                    Pago Seguro con Yape
                  </h3>
                  <p class="text-xs text-slate-500">
                    Plan seleccionado: {{ selectedPlan.name }}
                  </p>
                </div>
              </div>

              <div class="text-right">
                <span class="block text-xs font-medium text-slate-500">
                  Monto total a yapear
                </span>
                <span class="text-2xl font-extrabold text-[#7D1119]">
                  {{ selectedPlan.formattedPrice }}
                </span>
              </div>
            </div>

            <div class="mt-5 grid items-center gap-5 md:grid-cols-12">
              <!-- QR Yape + Datos -->
              <div
                class="flex flex-col items-center rounded-xl border border-[#E5E7EB] bg-white p-4 text-center md:col-span-5"
              >
                <div
                  class="flex h-52 w-40 items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#742384]"
                >
                  <img
                    v-if="!yapeQrFailed"
                    :src="YAPE_CONFIG.qrImage"
                    alt="Código QR Yape Fabio Cieza - Localifácil UNMSM"
                    class="h-full w-full object-contain"
                    @error="yapeQrFailed = true"
                  />
                  <div
                    v-else
                    class="flex flex-col items-center gap-1.5 p-3 text-slate-400"
                  >
                    <QrCode class="h-10 w-10 text-[#16263E]" />
                    <span class="text-[11px] font-medium text-slate-500">
                      QR Yape Institucional
                    </span>
                  </div>
                </div>

                <p class="mt-3 text-xs font-semibold text-slate-500">
                  Titular: {{ YAPE_CONFIG.holder }}
                </p>
                <button
                  type="button"
                  class="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1.5 font-mono text-sm font-bold text-[#16263E] transition-colors hover:border-[#7D1119] hover:text-[#7D1119] cursor-pointer"
                  @click="copyYapePhone"
                >
                  <span>{{ YAPE_CONFIG.phone }}</span>
                  <Copy class="h-3.5 w-3.5" />
                </button>
              </div>

              <!-- Upload captura de pago -->
              <div class="md:col-span-7">
                <label
                  for="paymentProof"
                  class="mb-2 block text-sm font-semibold text-[#16263E]"
                >
                  Sube tu captura de pantalla de Yape
                </label>

                <label
                  for="paymentProof"
                  class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white px-4 py-6 text-center transition-colors"
                  :class="
                    touched.paymentProof && errors.paymentProof
                      ? 'border-red-300 hover:border-red-400'
                      : 'border-[#E5E7EB] hover:border-[#7D1119]'
                  "
                >
                  <Loader2
                    v-if="isCompressing"
                    class="h-8 w-8 animate-spin text-[#7D1119]"
                  />
                  <Upload v-else class="h-8 w-8 text-[#7D1119]" />

                  <span class="mt-2 text-sm font-semibold text-[#16263E]">
                    {{
                      isCompressing
                        ? 'Optimizando captura...'
                        : paymentProofName || 'Seleccionar captura de Yape'
                    }}
                  </span>
                  <span class="mt-1 text-xs text-slate-500">
                    PNG, JPG o WEBP (se comprime automáticamente a máx. 800px)
                  </span>

                  <input
                    id="paymentProof"
                    type="file"
                    accept="image/*"
                    class="sr-only"
                    @change="handleFileChange"
                  />
                </label>

                <!-- Preview de captura comprimida -->
                <div
                  v-if="paymentProofBase64"
                  class="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5"
                >
                  <img
                    :src="paymentProofBase64"
                    alt="Vista previa de captura Yape"
                    class="h-12 w-12 rounded-lg border border-emerald-200 object-cover"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-bold text-[#16263E]">
                      Captura lista para enviar
                    </p>
                    <p class="text-[11px] text-emerald-700">
                      Comprimida en JPEG (calidad 0.7)
                    </p>
                  </div>
                  <CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-600" />
                </div>

                <p
                  v-if="touched.paymentProof && errors.paymentProof"
                  class="mt-2 flex items-center gap-1 text-xs font-medium text-[#7D1119]"
                >
                  <AlertCircle class="h-3.5 w-3.5" />
                  <span>{{ errors.paymentProof }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Botón de envío -->
          <div class="pt-2">
            <button
              type="submit"
              :disabled="isSubmitting || isCompressing"
              class="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#7D1119] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#5E0C12] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="h-5 w-5 animate-spin" />
              <ShieldCheck v-else class="h-5 w-5 text-[#D4A237]" />
              <span>
                {{
                  isSubmitting
                    ? 'Registrando y generando tu QR...'
                    : `Completar Registro y Activar QR (${selectedPlan.formattedPrice})`
                }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- Modal de Confirmación Post-Registro -->
    <PendingVerificationModal
      :open="modalState.open"
      :id-llavero="modalState.idLlavero"
      :student-name="modalState.studentName"
      :facultad="modalState.facultad"
      :email="modalState.email"
      @close="modalState.open = false"
    />
  </div>
</template>
