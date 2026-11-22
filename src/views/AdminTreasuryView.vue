<script setup lang="ts">
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useToast } from '../composables/useToast';
import { approvePayment, fetchAdminList } from '../services/api';
import type { AdminRegistrationItem } from '../types/localifacil';

type FilterTab = 'ALL' | 'PENDIENTE' | 'ACTIVO';

const { success, error: showError } = useToast();

const pinInput = ref('');
const activePin = ref('');
const showPin = ref(false);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const authError = ref('');
const approvingId = ref<string | null>(null);
const approvalAlert = ref('');
const filterTab = ref<FilterTab>('ALL');
const records = ref<AdminRegistrationItem[]>([]);

const normalizeStatus = (estado?: string): string =>
  String(estado ?? '')
    .trim()
    .toUpperCase();

const isPending = (item: AdminRegistrationItem): boolean =>
  normalizeStatus(item.estado) === 'PENDIENTE';

const isActive = (item: AdminRegistrationItem): boolean =>
  normalizeStatus(item.estado) === 'ACTIVO';

const counts = computed(() => {
  const pending = records.value.filter(isPending).length;
  const active = records.value.filter(isActive).length;
  return {
    all: records.value.length,
    pending,
    active,
  };
});

const filteredRecords = computed(() => {
  if (filterTab.value === 'PENDIENTE') {
    return records.value.filter(isPending);
  }
  if (filterTab.value === 'ACTIVO') {
    return records.value.filter(isActive);
  }
  return records.value;
});

const formatAmount = (monto: number | string): string => {
  const num = Number(monto);
  if (Number.isNaN(num)) {
    return String(monto ?? '—');
  }
  return `S/ ${num.toFixed(2)}`;
};

const loadRecords = async (pinToUse: string): Promise<boolean> => {
  isLoading.value = true;
  authError.value = '';
  try {
    const list = await fetchAdminList(pinToUse);
    records.value = list;
    return true;
  } catch (err) {
    console.error('[AdminTreasuryView] Error cargando registros:', err);
    const msg =
      err instanceof Error
        ? err.message
        : 'No se pudo cargar la lista de pagos.';
    authError.value = msg;
    showError('Error de acceso', msg);
    return false;
  } finally {
    isLoading.value = false;
  }
};

const handleLogin = async () => {
  const cleanPin = pinInput.value.trim();
  if (!cleanPin) {
    authError.value = 'Ingresa el PIN de tesorería para continuar.';
    return;
  }

  const ok = await loadRecords(cleanPin);
  if (ok) {
    activePin.value = cleanPin;
    isAuthenticated.value = true;
    approvalAlert.value = '';
  }
};

const handleRefresh = async () => {
  if (!activePin.value) return;
  await loadRecords(activePin.value);
};

const handleLogout = () => {
  isAuthenticated.value = false;
  activePin.value = '';
  pinInput.value = '';
  records.value = [];
  approvalAlert.value = '';
  authError.value = '';
};

const handleApprove = async (item: AdminRegistrationItem) => {
  if (!activePin.value || approvingId.value) return;

  approvingId.value = item.idLlavero;
  approvalAlert.value = '';
  try {
    await approvePayment({
      action: 'APPROVE_PAYMENT',
      pin: activePin.value,
      idLlavero: item.idLlavero,
    });

    await loadRecords(activePin.value);

    const confirmationText = `Pago aprobado para ${item.nombres} (${item.idLlavero}). El código QR y la boleta electrónica ya fueron enviados al Gmail del alumno.`;
    approvalAlert.value = confirmationText;
    success('Pago aprobado y enviado', confirmationText);
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'No se pudo aprobar el pago.';
    showError('Error al aprobar', msg);
  } finally {
    approvingId.value = null;
  }
};
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <!-- Banner Título -->
    <div
      class="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
    >
      <div
        class="bg-gradient-to-r from-[#7D1119] to-[#4A090E] px-6 py-6 text-white"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 text-[#D4A237]">
              <ShieldCheck class="h-4 w-4" />
              <span class="text-xs font-bold tracking-wider uppercase">
                Tesorería y Administración
              </span>
            </div>
            <h1 class="mt-1 text-xl font-extrabold text-white sm:text-2xl">
              Panel de Verificación de Pagos - Localifácil UNMSM
            </h1>
          </div>

          <div v-if="isAuthenticated" class="flex items-center gap-2.5">
            <button
              type="button"
              :disabled="isLoading"
              class="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-60 cursor-pointer"
              @click="handleRefresh"
            >
              <RefreshCw
                class="h-3.5 w-3.5"
                :class="{ 'animate-spin': isLoading }"
              />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 cursor-pointer"
              @click="handleLogout"
            >
              <LogOut class="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Gate de PIN -->
      <div v-if="!isAuthenticated" class="p-6 sm:p-10">
        <form
          class="mx-auto max-w-md space-y-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-6"
          @submit.prevent="handleLogin"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7D1119]/10 text-[#7D1119]"
            >
              <KeyRound class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-[#16263E]">
                Acceso Restringido
              </h2>
              <p class="text-xs text-slate-500">
                Ingresa el PIN de tesorería para revisar y aprobar pagos Yape.
              </p>
            </div>
          </div>

          <div>
            <label
              for="admin-pin"
              class="mb-1.5 block text-xs font-bold tracking-wide text-[#16263E] uppercase"
            >
              PIN de Acceso
            </label>
            <div class="relative">
              <input
                id="admin-pin"
                v-model="pinInput"
                :type="showPin ? 'text' : 'password'"
                placeholder="Ej. 2026UNMSM"
                autocomplete="off"
                class="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pr-10 pl-4 font-mono text-sm text-[#16263E] focus:border-[#7D1119] focus:ring-2 focus:ring-[#7D1119]/15 focus:outline-none"
              />
              <button
                type="button"
                class="absolute top-2.5 right-3 text-slate-400 hover:text-[#16263E] cursor-pointer"
                :aria-label="showPin ? 'Ocultar PIN' : 'Mostrar PIN'"
                @click="showPin = !showPin"
              >
                <EyeOff v-if="showPin" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <p
            v-if="authError"
            class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-[#7D1119]"
          >
            <AlertCircle class="h-4 w-4 shrink-0" />
            <span>{{ authError }}</span>
          </p>

          <button
            type="submit"
            :disabled="isLoading"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7D1119] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5E0C12] disabled:opacity-60 cursor-pointer"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            <ShieldCheck v-else class="h-4 w-4 text-[#D4A237]" />
            <span>{{ isLoading ? 'Verificando PIN...' : 'Ingresar al Panel' }}</span>
          </button>
        </form>
      </div>

      <!-- Contenido del Panel Autenticado -->
      <div v-else class="p-6">
        <!-- Alerta de confirmación tras aprobar -->
        <div
          v-if="approvalAlert"
          class="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
          role="status"
        >
          <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div class="flex-1 text-sm">
            <p class="font-bold">¡Confirmación de Envío!</p>
            <p class="mt-0.5 text-xs sm:text-sm">{{ approvalAlert }}</p>
          </div>
          <button
            type="button"
            class="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            @click="approvalAlert = ''"
          >
            Ocultar
          </button>
        </div>

        <!-- Filtros -->
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
              :class="
                filterTab === 'ALL'
                  ? 'bg-[#16263E] text-white'
                  : 'border border-[#E5E7EB] bg-white text-[#16263E] hover:bg-slate-50'
              "
              @click="filterTab = 'ALL'"
            >
              <span>Todos</span>
              <span
                class="rounded-full px-1.5 py-0.5 text-[11px]"
                :class="
                  filterTab === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                "
              >
                {{ counts.all }}
              </span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
              :class="
                filterTab === 'PENDIENTE'
                  ? 'bg-amber-600 text-white'
                  : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
              "
              @click="filterTab = 'PENDIENTE'"
            >
              <Clock class="h-3.5 w-3.5" />
              <span>Pendientes</span>
              <span
                class="rounded-full px-1.5 py-0.5 text-[11px]"
                :class="
                  filterTab === 'PENDIENTE'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-200/70 text-amber-900'
                "
              >
                {{ counts.pending }}
              </span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
              :class="
                filterTab === 'ACTIVO'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              "
              @click="filterTab = 'ACTIVO'"
            >
              <CheckCircle2 class="h-3.5 w-3.5" />
              <span>Activos</span>
              <span
                class="rounded-full px-1.5 py-0.5 text-[11px]"
                :class="
                  filterTab === 'ACTIVO'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-200/70 text-emerald-900'
                "
              >
                {{ counts.active }}
              </span>
            </button>
          </div>
        </div>

        <!-- Estado vacío -->
        <div
          v-if="filteredRecords.length === 0"
          class="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA] py-12 text-center"
        >
          <p class="text-sm font-semibold text-[#16263E]">
            No hay registros en esta categoría.
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Prueba cambiando el filtro o presiona Actualizar.
          </p>
        </div>

        <!-- Tabla Desktop -->
        <div
          v-else
          class="hidden overflow-x-auto rounded-xl border border-[#E5E7EB] lg:block"
        >
          <table class="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
            <thead class="bg-[#FAFAFA] text-xs font-bold text-slate-600 uppercase">
              <tr>
                <th class="px-4 py-3.5">ID Llavero</th>
                <th class="px-4 py-3.5">Estudiante</th>
                <th class="px-4 py-3.5">Código UNMSM</th>
                <th class="px-4 py-3.5">Facultad</th>
                <th class="px-4 py-3.5">Plan / Monto</th>
                <th class="px-4 py-3.5">Estado</th>
                <th class="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E5E7EB] bg-white">
              <tr
                v-for="item in filteredRecords"
                :key="item.idLlavero || item.row"
                class="hover:bg-slate-50/70"
              >
                <td class="px-4 py-3.5 font-mono text-xs font-bold text-[#16263E]">
                  {{ item.idLlavero }}
                </td>
                <td class="px-4 py-3.5">
                  <p class="font-semibold text-[#16263E]">{{ item.nombres }}</p>
                  <p v-if="item.correo" class="text-xs text-slate-500">
                    {{ item.correo }}
                  </p>
                </td>
                <td class="px-4 py-3.5 font-mono text-xs text-slate-700">
                  {{ item.codigoAlumno }}
                </td>
                <td class="max-w-xs px-4 py-3.5 text-xs text-slate-600">
                  {{ item.facultad }}
                </td>
                <td class="px-4 py-3.5">
                  <p class="text-xs font-semibold text-[#16263E]">{{ item.plan }}</p>
                  <p class="text-xs font-bold text-[#7D1119]">
                    {{ formatAmount(item.monto) }}
                  </p>
                </td>
                <td class="px-4 py-3.5">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                    :class="
                      isPending(item)
                        ? 'bg-amber-100 text-amber-800'
                        : isActive(item)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                    "
                  >
                    <Clock v-if="isPending(item)" class="h-3 w-3" />
                    <CheckCircle2 v-else-if="isActive(item)" class="h-3 w-3" />
                    <span>{{ normalizeStatus(item.estado) || 'DESCONOCIDO' }}</span>
                  </span>
                </td>
                <td class="px-4 py-3.5 text-right">
                  <div class="inline-flex flex-wrap items-center justify-end gap-2">
                    <a
                      v-if="item.voucherUrl"
                      :href="item.voucherUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#16263E] transition-colors hover:border-[#16263E]"
                    >
                      <span>Ver Captura Yape</span>
                      <ExternalLink class="h-3.5 w-3.5" />
                    </a>
                    <span
                      v-else
                      class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400"
                    >
                      Sin captura
                    </span>

                    <button
                      v-if="isPending(item)"
                      type="button"
                      :disabled="approvingId === item.idLlavero"
                      class="inline-flex items-center gap-1.5 rounded-lg bg-[#7D1119] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#5E0C12] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      @click="handleApprove(item)"
                    >
                      <Loader2
                        v-if="approvingId === item.idLlavero"
                        class="h-3.5 w-3.5 animate-spin"
                      />
                      <Send v-else class="h-3.5 w-3.5 text-[#D4A237]" />
                      <span>
                        {{
                          approvingId === item.idLlavero
                            ? 'Aprobando...'
                            : 'Aprobar Pago y Enviar QR'
                        }}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tarjetas Mobile / Tablet -->
        <div
          v-if="filteredRecords.length > 0"
          class="grid gap-4 lg:hidden"
        >
          <div
            v-for="item in filteredRecords"
            :key="item.idLlavero || item.row"
            class="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xs"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <span
                  class="inline-block rounded-md bg-[#16263E] px-2.5 py-0.5 font-mono text-xs font-bold text-white"
                >
                  {{ item.idLlavero }}
                </span>
                <h3 class="mt-2 text-sm font-bold text-[#16263E]">
                  {{ item.nombres }}
                </h3>
                <p class="font-mono text-xs text-slate-500">
                  Código: {{ item.codigoAlumno }}
                </p>
              </div>

              <span
                class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                :class="
                  isPending(item)
                    ? 'bg-amber-100 text-amber-800'
                    : isActive(item)
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                "
              >
                <Clock v-if="isPending(item)" class="h-3 w-3" />
                <CheckCircle2 v-else-if="isActive(item)" class="h-3 w-3" />
                <span>{{ normalizeStatus(item.estado) || 'DESCONOCIDO' }}</span>
              </span>
            </div>

            <div class="mt-3 space-y-1 border-t border-[#E5E7EB] pt-3 text-xs">
              <p class="text-slate-600">
                <span class="font-semibold text-[#16263E]">Facultad:</span>
                {{ item.facultad }}
              </p>
              <p class="text-slate-600">
                <span class="font-semibold text-[#16263E]">Plan:</span>
                {{ item.plan }} —
                <strong class="text-[#7D1119]">{{ formatAmount(item.monto) }}</strong>
              </p>
            </div>

            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                v-if="item.voucherUrl"
                :href="item.voucherUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#16263E] hover:border-[#16263E]"
              >
                <span>Ver Captura Yape</span>
                <ExternalLink class="h-3.5 w-3.5" />
              </a>

              <button
                v-if="isPending(item)"
                type="button"
                :disabled="approvingId === item.idLlavero"
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#7D1119] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#5E0C12] disabled:opacity-60 cursor-pointer"
                @click="handleApprove(item)"
              >
                <Loader2
                  v-if="approvingId === item.idLlavero"
                  class="h-3.5 w-3.5 animate-spin"
                />
                <Send v-else class="h-3.5 w-3.5 text-[#D4A237]" />
                <span>
                  {{
                    approvingId === item.idLlavero
                      ? 'Aprobando...'
                      : 'Aprobar Pago y Enviar QR'
                  }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
