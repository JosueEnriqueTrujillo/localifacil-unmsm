export type QrStatus = 'ACTIVE' | 'UNASSIGNED' | 'NOT_FOUND';

export interface QrStatusResponse {
  status: QrStatus;
  id: string;
  facultad?: string;
  ownerFirstName?: string;
  telefono?: string | number;
  callUrl?: string;
  whatsappUrl?: string;
  message?: string;
}

export interface RegisterStudentPayload {
  action: 'REGISTER_USER';
  codigoAlumno: string;
  nombres: string;
  facultad: string;
  correo: string;
  telefono: string;
  plan: string;
  monto: number;
  voucherBase64: string;
}

export interface RegisterStudentResponse {
  success: boolean;
  idLlavero?: string;
  boletaUrl?: string;
  message?: string;
}

export type ContactMethod = 'whatsapp' | 'phone' | 'tracking';

export interface ReportScanPayload {
  action: 'REPORT_SCAN';
  id: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  message?: string;
  contactMethod?: ContactMethod;
}

export interface ReportScanResponse {
  success: boolean;
  whatsappUrl?: string;
  phoneUrl?: string;
  message?: string;
}

export type PaymentStatus = 'PENDIENTE' | 'ACTIVO' | string;

export interface AdminRegistrationItem {
  row?: number;
  idLlavero: string;
  nombres: string;
  codigoAlumno: string | number;
  facultad: string;
  plan: string;
  monto: number | string;
  estado: PaymentStatus;
  voucherUrl?: string;
  qrUrl?: string;
  boletaUrl?: string;
  correo?: string;
  telefono?: string | number;
  fecha?: string;
  fechaRegistro?: string;
}

export interface AdminListResponse {
  status?: string;
  success?: boolean;
  registros?: AdminRegistrationItem[];
  records?: AdminRegistrationItem[];
  data?: AdminRegistrationItem[];
  items?: AdminRegistrationItem[];
  error?: string;
  message?: string;
}

export interface ApprovePaymentPayload {
  action: 'APPROVE_PAYMENT';
  pin: string;
  idLlavero: string;
  frontendUrl?: string;
  scanUrl?: string;
}

export interface ApprovePaymentResponse {
  success: boolean;
  idLlavero?: string;
  message?: string;
}
