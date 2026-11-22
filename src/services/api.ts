import { APPS_SCRIPT_URL } from '../config/unmsm';
import type {
  AdminListResponse,
  AdminRegistrationItem,
  ApprovePaymentPayload,
  ApprovePaymentResponse,
  QrStatusResponse,
  RegisterStudentPayload,
  RegisterStudentResponse,
  ReportScanPayload,
  ReportScanResponse,
} from '../types/localifacil';

const ensureEndpointConfigured = (): string => {
  if (!APPS_SCRIPT_URL) {
    throw new Error(
      'Falta configurar VITE_APPS_SCRIPT_URL en las variables de entorno.'
    );
  }
  return APPS_SCRIPT_URL;
};

async function postToAppsScript<TPayload, TResponse>(
  payload: TPayload
): Promise<TResponse> {
  const endpoint = ensureEndpointConfigured();

  const response = await fetch(endpoint, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Error de comunicación con el servidor (${response.status}).`
    );
  }

  const data = (await response.json()) as TResponse & {
    success?: boolean;
    error?: string;
    message?: string;
  };

  if (data.success === false) {
    throw new Error(
      data.error || data.message || 'No se pudo completar la operación.'
    );
  }

  return data;
}

export async function checkQrStatus(id: string): Promise<QrStatusResponse> {
  const endpoint = ensureEndpointConfigured();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${endpoint}${separator}id=${encodeURIComponent(id)}`;

  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo verificar el código QR (${response.status}).`
    );
  }

  const data = (await response.json()) as QrStatusResponse;
  return data;
}

export async function registerStudent(
  payload: RegisterStudentPayload
): Promise<RegisterStudentResponse> {
  const sanitizedPayload: RegisterStudentPayload = {
    action: 'REGISTER_USER',
    codigoAlumno: String(payload.codigoAlumno ?? '').trim(),
    nombres: String(payload.nombres ?? '').trim(),
    facultad: String(payload.facultad ?? '').trim(),
    correo: String(payload.correo ?? '').trim().toLowerCase(),
    telefono: String(payload.telefono ?? '').trim(),
    plan: String(payload.plan ?? '').trim(),
    monto: Number(payload.monto ?? 0),
    voucherBase64: String(payload.voucherBase64 ?? ''),
  };

  return postToAppsScript<RegisterStudentPayload, RegisterStudentResponse>(
    sanitizedPayload
  );
}

export async function reportScanLocation(
  payload: ReportScanPayload
): Promise<ReportScanResponse> {
  return postToAppsScript<ReportScanPayload, ReportScanResponse>(payload);
}

export async function fetchAdminList(
  pin: string
): Promise<AdminRegistrationItem[]> {
  const endpoint = ensureEndpointConfigured();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${endpoint}${separator}action=LIST_ADMIN&pin=${encodeURIComponent(pin.trim())}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      const msg = `No se pudo consultar el panel de tesorería (${response.status}).`;
      console.error('[fetchAdminList] HTTP error:', response.status, response.statusText);
      throw new Error(msg);
    }

    const rawText = await response.text();
    let json: AdminListResponse | AdminRegistrationItem[];
    try {
      json = JSON.parse(rawText) as AdminListResponse | AdminRegistrationItem[];
    } catch (parseErr) {
      console.error('[fetchAdminList] JSON parse error:', parseErr, 'Raw response:', rawText);
      throw new Error('La respuesta del servidor no tiene formato JSON válido.');
    }

    if (Array.isArray(json)) {
      return json;
    }

    if (json.success === false || String(json.status ?? '').toUpperCase() === 'ERROR') {
      throw new Error(
        json.error || json.message || 'PIN de acceso incorrecto o sin autorización.'
      );
    }

    return json.registros || json.records || json.data || json.items || [];
  } catch (err) {
    console.error('[fetchAdminList] Error:', err);
    throw err;
  }
}

export async function approvePayment(
  payload: ApprovePaymentPayload
): Promise<ApprovePaymentResponse> {
  const cleanId = String(payload.idLlavero ?? '').trim();
  const cleanOrigin =
    payload.frontendUrl ?? window.location.origin.replace(/\/+$/, '');
  const scanUrl =
    payload.scanUrl ?? `${cleanOrigin}/?id=${encodeURIComponent(cleanId)}`;

  return postToAppsScript<ApprovePaymentPayload, ApprovePaymentResponse>({
    action: 'APPROVE_PAYMENT',
    pin: String(payload.pin ?? '').trim(),
    idLlavero: cleanId,
    frontendUrl: cleanOrigin,
    scanUrl,
  });
}
