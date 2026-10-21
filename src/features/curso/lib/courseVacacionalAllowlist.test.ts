import { describe, expect, it } from 'vitest';
import type { CourseAttendanceReportRow } from './courseAttendanceReport';

function buildAllowlist(allowedDocuments: string[]) {
  return { documents: new Set(allowedDocuments), emails: new Set<string>() };
}

function filterRows(
  rows: CourseAttendanceReportRow[],
  allow: { documents: Set<string>; emails: Set<string> },
) {
  return rows.filter((row) => {
    const doc = row.documento?.replace(/\D/g, '') || '';
    const fromKey = row.personKey.match(/^doc_(\d+)$/)?.[1] || '';
    return (doc && allow.documents.has(doc)) || (fromKey && allow.documents.has(fromKey));
  });
}

describe('vacacional roster allowlist', () => {
  it('drops Firestore rows outside the vacacional CSV', () => {
    const rows = [
      { personKey: 'doc_100', documento: '100', rosterName: 'A', weekStats: [] },
      { personKey: 'doc_200', documento: '200', rosterName: 'B', weekStats: [] },
      { personKey: 'doc_999', documento: '999', rosterName: 'Extra', weekStats: [] },
    ] as unknown as CourseAttendanceReportRow[];

    const filtered = filterRows(rows, buildAllowlist(['100', '200']));
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.personKey)).toEqual(['doc_100', 'doc_200']);
  });
});
