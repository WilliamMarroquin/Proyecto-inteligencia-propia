// lib/dateUtils.ts

export const TZ_GUATEMALA = 'America/Guatemala';

/**
 * Formatea una fecha al formato DD/MM/YYYY estrictamente en la zona horaria de Guatemala
 */
export function formatToGuatemalaDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-GT', {
    timeZone: TZ_GUATEMALA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatea una fecha a DD/MM/YYYY HH:mm estrictamente en la zona horaria de Guatemala
 */
export function formatToGuatemalaDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleString('es-GT', {
    timeZone: TZ_GUATEMALA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Retorna la fecha y hora actual en Guatemala como objeto Date
 * Util para guardar createdAt o updatedAt si se desea forzar antes de Prisma,
 * aunque Prisma siempre usa UTC. Es mejor guardar UTC y formatear al mostrar.
 */
export function getGuatemalaNow(): Date {
  const now = new Date();
  const gtTime = now.toLocaleString("en-US", {timeZone: TZ_GUATEMALA});
  return new Date(gtTime);
}
