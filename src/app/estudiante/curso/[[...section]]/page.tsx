import { COURSE_SECTION_PATHS } from '@features/curso/lib/courseRoutePaths';
import CursoPageView from '@features/curso/pages/CursoPageView';

export function generateStaticParams() {
  return [
    { section: [] as string[] },
    ...COURSE_SECTION_PATHS.map((section) => ({ section: [section] })),
  ];
}

export default function CursoSectionPage() {
  return <CursoPageView />;
}
