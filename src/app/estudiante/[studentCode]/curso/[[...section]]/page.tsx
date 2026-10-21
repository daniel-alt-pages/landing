import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPublicStudentCode } from '@features/curso/lib/courseAccessKeys';
import { COURSE_SECTION_PATHS } from '@features/curso/lib/courseRoutePaths';
import { studentCodesForStaticExport } from '@features/curso/lib/staticExportStudentCodes';
import CursoPageView from '@features/curso/pages/CursoPageView';

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function readRosterStudentCodes(): string[] {
  const rosterPath = join(
    process.cwd(),
    'public',
    'data',
    'course',
    'roster_preicfes-sg26.csv',
  );
  if (!existsSync(rosterPath)) return ['sg_demo'];

  const lines = readFileSync(rosterPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return ['sg_demo'];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const docIndex = header.indexOf('numero_identificacion');
  const emailIndex = header.indexOf('correo');
  const codes = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return buildPublicStudentCode({
      studentId: cells[docIndex] || '',
      documento: cells[docIndex] || '',
      emailLower: cells[emailIndex] || '',
    });
  });

  return [...new Set(['sg_demo', ...codes.filter(Boolean)])];
}

export function generateStaticParams() {
  return studentCodesForStaticExport(readRosterStudentCodes).flatMap((studentCode) => [
    { studentCode, section: [] as string[] },
    ...COURSE_SECTION_PATHS.map((section) => ({
      studentCode,
      section: [section],
    })),
  ]);
}

export default function CursoStudentCodeSectionPage() {
  return <CursoPageView />;
}
