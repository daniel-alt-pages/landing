/**
 * WhatsApp asesor — env NEXT_PUBLIC_SUPPORT_WHATSAPP o default 3042359048 (CO).
 */

import { formatBirthDateDisplay } from '@/lib/birthDateHash';

const DEFAULT_SUPPORT_WHATSAPP = '3042359048';

export interface DirectLoginWhatsAppContext {
    documentId?: string;
    fullName?: string;
    birthDateIso?: string | null;
    locked?: boolean;
    attempts?: number;
}

export function getSupportWhatsAppPhone(): string | null {
    const raw = String(
        process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || DEFAULT_SUPPORT_WHATSAPP
    ).replace(/\D/g, '');
    if (!raw) return null;
    if (raw.startsWith('57') && raw.length >= 12) return raw;
    if (raw.length === 10) return `57${raw}`;
    return raw.length >= 10 ? raw : null;
}

export function buildSupportWhatsAppUrl(message: string): string | null {
    const phone = getSupportWhatsAppPhone();
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildDirectLoginSupportMessage(documentId?: string): string {
    return buildStructuredDirectLoginSupportMessage({ documentId });
}

/** WhatsApp: *negrilla* con asteriscos; saltos con \n */
export function buildStructuredDirectLoginSupportMessage(
    ctx: DirectLoginWhatsAppContext
): string {
    const lines: string[] = [
        '*Solicitud de acceso — Seamos Genios*',
        '',
    ];

    if (ctx.fullName?.trim()) {
        lines.push(`*Nombre:* ${ctx.fullName.trim()}`);
    }
    if (ctx.documentId?.trim()) {
        lines.push(`*Documento:* ${ctx.documentId.trim()}`);
    }
    if (ctx.birthDateIso) {
        lines.push(`*Fecha de nacimiento:* ${formatBirthDateDisplay(ctx.birthDateIso)}`);
    }

    lines.push('');
    if (ctx.locked) {
        lines.push('*Situación:* acceso con documento bloqueado temporalmente.');
    } else if (ctx.attempts && ctx.attempts > 0) {
        lines.push(`*Situación:* ${ctx.attempts} intento(s) fallidos de documento + fecha.`);
    } else {
        lines.push('*Situación:* no pude ingresar con documento y fecha.');
    }

    lines.push('');
    lines.push('¿Me ayudan a revisar mi acceso?');
    lines.push('Gracias.');

    return lines.join('\n');
}

export function buildDirectLoginSupportUrl(ctx: DirectLoginWhatsAppContext): string | null {
    return buildSupportWhatsAppUrl(buildStructuredDirectLoginSupportMessage(ctx));
}

export function buildCourseSupportMessage(courseName: string, studentName?: string): string {
    const lines: string[] = [
        '*Soporte curso — Seamos Genios*',
        '',
        `*Curso:* ${courseName.trim()}`,
    ];
    if (studentName?.trim()) {
        lines.push(`*Estudiante:* ${studentName.trim()}`);
    }
    lines.push('');
    lines.push('Necesito ayuda con mi curso intensivo.');
    lines.push('Gracias.');
    return lines.join('\n');
}

export function buildCourseSupportUrl(courseName: string, studentName?: string): string | null {
    return buildSupportWhatsAppUrl(buildCourseSupportMessage(courseName, studentName));
}

export interface CoordinatorExcelRequestContext {
    fullName?: string;
    institution?: string;
    simulation?: string;
    reportScope?: string;
    reportScopeLabel?: string;
    extraNotes?: string;
    sourcePanel?: string;
}

export function buildCoordinatorExcelRequestMessage(
    ctx: CoordinatorExcelRequestContext
): string {
    const lines: string[] = [
        '*Solicitud reporte Excel — Seamos Genios*',
        '',
    ];
    if (ctx.fullName?.trim()) lines.push(`*Coordinador:* ${ctx.fullName.trim()}`);
    if (ctx.institution?.trim()) lines.push(`*Institución:* ${ctx.institution.trim()}`);
    if (ctx.simulation?.trim()) lines.push(`*Simulacro:* ${ctx.simulation.trim()}`);
    if (ctx.reportScopeLabel?.trim()) {
        lines.push(`*Alcance:* ${ctx.reportScopeLabel.trim()}`);
    } else if (ctx.reportScope?.trim()) {
        lines.push(`*Alcance:* ${ctx.reportScope.trim()}`);
    }
    if (ctx.sourcePanel?.trim()) lines.push(`*Panel:* ${ctx.sourcePanel.trim()}`);
    if (ctx.extraNotes?.trim()) {
        lines.push('');
        lines.push(`*Notas:* ${ctx.extraNotes.trim()}`);
    }
    lines.push('');
    lines.push('¿Me pueden enviar el Excel institucional?');
    lines.push('Gracias.');
    return lines.join('\n');
}

export function buildCoordinatorExcelRequestUrl(
    ctx: CoordinatorExcelRequestContext
): string | null {
    return buildSupportWhatsAppUrl(buildCoordinatorExcelRequestMessage(ctx));
}
