import { normalizeEmailLower } from './courseAccessKeys';

/** Muestra hint sin revelar correo completo (ej. varg***@gmail.com). */
export function maskEnrollmentEmail(email: string): string {
  const normalized = normalizeEmailLower(email);
  const [user, domain] = normalized.split('@');
  if (!user || !domain) return email;
  if (user.length <= 3) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 4)}***@${domain}`;
}

export function isEnrollmentEmailMismatch(
  currentEmail: string | undefined,
  enrollmentEmail: string | undefined | null,
): boolean {
  const current = normalizeEmailLower(currentEmail);
  const enrolled = normalizeEmailLower(enrollmentEmail ?? '');
  if (!current || !enrolled) return false;
  return current !== enrolled;
}
