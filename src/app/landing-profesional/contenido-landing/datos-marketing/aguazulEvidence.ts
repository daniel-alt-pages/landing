import type { ChromaGridItem } from '@/app/landing-profesional/contenido-landing/ui-componentes/ChromaGrid';

export const AGUAZUL_FACEBOOK_POST_URL =
  'https://www.facebook.com/100057634540369/posts/1458459939418477/?rdid=DQXhwI3ItHKEusbH#';

export const AGUAZUL_EVIDENCE_GROUP = {
  code: 'SG11 - 12X',
  institution: 'I.E. San Agustín · Aguazul',
  logo: 'https://ik.imagekit.io/SG/tr:w-1400,q-100,f-png/IE%20SAN%20AGUSTI%C3%8DN%20-%20SIMULACROS.png',
  sourceLabel: 'publicación en Facebook de Institución Educativa San Agustín-Aguazul',
} as const;

export const AGUAZUL_EVIDENCE_ITEMS: readonly ChromaGridItem[] = [
  {
    image:
      'https://scontent-baq1-1.xx.fbcdn.net/v/t39.30808-6/672008629_1458460052751799_6188880236918721804_n.jpg?stp=dst-jpg_s590x590_tt6&_nc_cat=100&ccb=1-7&_nc_sid=833d8c&_nc_ohc=LyHmZmwyHMMQ7kNvwEdjcKc&_nc_oc=AdpYH11EiCReo1_T_fiznCE6Ob8TQX4Srrsw41vFNcPzrHK6fmf09GBebe6xQuSFAfc&_nc_zt=23&_nc_ht=scontent-baq1-1.xx&_nc_gid=iubhDjlR704jRaLY4y8SkQ&_nc_ss=7b289&oh=00_Af4SFEjR0b-u-N_D_s8HJkNxwSReUL8zIJfrCL-XH4vxIg&oe=6A0B72C4',
    title: 'Aplicación digital asistida',
    subtitle: 'Estudiantes usando formulario físico y apoyo digital durante el simulacro.',
    handle: 'SG11 - 12X · evidencia 01',
    borderColor: '#22D3EE',
    gradient: 'linear-gradient(145deg, rgba(34,211,238,0.82), rgba(2,6,23,0.92))',
    url: AGUAZUL_FACEBOOK_POST_URL,
  },
  {
    image:
      'https://scontent-baq1-1.xx.fbcdn.net/v/t39.30808-6/672686713_1458460039418467_4959891365906443321_n.jpg?stp=dst-jpg_s590x590_tt6&_nc_cat=101&ccb=1-7&_nc_sid=833d8c&_nc_ohc=sdyGqg3PiwgQ7kNvwE5dlWW&_nc_oc=AdqVhOl3mv4GqP3NHooTjfDZM5cqc4uWMuwaqGcwCRnxDLj1jM5y4oRGGYC5wu7PLWQ&_nc_zt=23&_nc_ht=scontent-baq1-1.xx&_nc_gid=iubhDjlR704jRaLY4y8SkQ&_nc_ss=7b289&oh=00_Af6AqrKpOylY6QOd0rVmvH00IM0_TnEX1HSh1TGqrmlqHw&oe=6A0B9171',
    title: 'Aula en aplicación',
    subtitle: 'Grupo de estudiantes presentando el simulacro Saber 11 en jornada institucional.',
    handle: 'SG11 - 12X · evidencia 02',
    borderColor: '#10B981',
    gradient: 'linear-gradient(180deg, rgba(16,185,129,0.78), rgba(2,6,23,0.94))',
    url: AGUAZUL_FACEBOOK_POST_URL,
  },
  {
    image:
      'https://scontent-baq1-1.xx.fbcdn.net/v/t39.30808-6/671806448_1458460009418470_8461603332731422936_n.jpg?stp=dst-jpg_s590x590_tt6&_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=ehRKvjNs-rEQ7kNvwEUGi6G&_nc_oc=AdqQsdJQ0ynP31QyVmryjtYimpvC6SwK5TpuLKN21PmWx6ovqG5PuGcdTabrnLJ8erI&_nc_zt=23&_nc_ht=scontent-baq1-1.xx&_nc_gid=iubhDjlR704jRaLY4y8SkQ&_nc_ss=7b289&oh=00_Af4KGrdVvV7NekOs8sK8XiwMqTYBXYnEt6D-04FRNWOhaw&oe=6A0B8278',
    title: 'Cobertura en salón',
    subtitle: 'Registro fotográfico de la aplicación grupal y acompañamiento en aula.',
    handle: 'SG11 - 12X · evidencia 03',
    borderColor: '#F59E0B',
    gradient: 'linear-gradient(145deg, rgba(245,158,11,0.76), rgba(2,6,23,0.94))',
    url: AGUAZUL_FACEBOOK_POST_URL,
  },
];
