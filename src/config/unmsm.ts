export interface PlanOption {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  keychainsCount: number;
  badge: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export const APPS_SCRIPT_URL: string =
  import.meta.env.VITE_APPS_SCRIPT_URL ?? '';

export const YAPE_CONFIG = {
  phone: '935 692 034',
  holder: 'Fabio Acólito',
  qrImage: '/yape-qr.png',
} as const;

export const SUPPORT_WHATSAPP_URL =
  'https://wa.me/51935692034?text=Hola%20Fabio,%20tengo%20una%20consulta%20sobre%20Localif%C3%A1cil%20UNMSM';

export const INSTITUTIONAL_SEAL =
  'Comunidad Universitaria UNMSM - Ciudad Universitaria';

export const ALLOWED_EMAIL_REGEX = /^[^\s@]+@(gmail\.com|unmsm\.edu\.pe)$/i;

export const PLANS: PlanOption[] = [
  {
    id: 'plan-individual',
    name: 'Plan Individual',
    price: 10,
    formattedPrice: 'S/ 10.00',
    keychainsCount: 1,
    badge: 'Esencial',
    description:
      'Ideal para proteger tu mochila, llaves, carné universitario o estuche dentro de Ciudad Universitaria.',
    features: [
      '1 Llavero Acrílico personalizado con código QR',
      'Credencial QR Digital descargable al instante',
      'Alertas de ubicación GPS en tiempo real al escanear',
      'Boleta electrónica enviada a tu correo (@gmail.com o @unmsm.edu.pe)',
    ],
  },
  {
    id: 'plan-duo',
    name: 'Plan Dúo',
    price: 18,
    formattedPrice: 'S/ 18.00',
    keychainsCount: 2,
    badge: 'Más popular',
    description:
      'Protege dos artículos esenciales a la vez (mochila y llaves o laptop) con respaldo digital inmediato.',
    features: [
      '2 Llaveros Acrílicos de alta resistencia con QR',
      'QR Digital de alta resolución listo para imprimir',
      'Rastreo silencioso de escaneos y contacto seguro',
      'Boleta electrónica enviada a tu correo (@gmail.com o @unmsm.edu.pe)',
    ],
    popular: true,
  },
];

export const FACULTADES_UNMSM: readonly string[] = [
  'Facultad de Medicina (San Fernando)',
  'Facultad de Derecho y Ciencia Política',
  'Facultad de Letras y Ciencias Humanas',
  'Facultad de Farmacia y Bioquímica',
  'Facultad de Odontología',
  'Facultad de Educación',
  'Facultad de Química e Ingeniería Química',
  'Facultad de Medicina Veterinaria',
  'Facultad de Ciencias Administrativas',
  'Facultad de Ciencias Biológicas',
  'Facultad de Ciencias Contables',
  'Facultad de Ciencias Económicas',
  'Facultad de Ciencias Físicas',
  'Facultad de Ciencias Matemáticas',
  'Facultad de Ciencias Sociales',
  'Facultad de Ingeniería Geológica, Minera, Metalúrgica y Geográfica',
  'Facultad de Ingeniería Industrial',
  'Facultad de Psicología',
  'Facultad de Ingeniería Electrónica y Eléctrica',
  'Facultad de Ingeniería de Sistemas e Informática',
] as const;
