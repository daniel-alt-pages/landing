import { getEffectivePhoto } from '@/lib/profileService';

export type PersonPhotoRow = {
  studentId?: string;
  documento?: string;
};

/** ID usado en config/profilePhotos (normalmente documento / students.id). */
export function studentIdForPhotoLookup(
  personKey: string,
  row?: PersonPhotoRow,
): string | null {
  if (row?.studentId?.trim()) return row.studentId.trim();
  const studentMatch = personKey.match(/^student_(.+)$/);
  if (studentMatch?.[1]) return studentMatch[1];
  const doc = row?.documento?.replace(/\D/g, '') || '';
  if (doc) return doc;
  const docMatch = personKey.match(/^doc_(\d+)$/);
  if (docMatch?.[1]) return docMatch[1];
  return null;
}

export function photoUrlForPerson(
  photosMap: Map<string, string> | undefined,
  personKey: string,
  row?: PersonPhotoRow,
): string | null {
  const id = studentIdForPhotoLookup(personKey, row);
  if (!id) return null;
  if (photosMap?.has(id)) return photosMap.get(id)!;
  return getEffectivePhoto(id, photosMap);
}
