import { redirect } from 'next/navigation';
import CoordinadorScoringV2Page from '@features/coordinador/pages/scoring-v2/CoordinadorScoringV2Page';

export default function CoordinadorScoringTriPage() {
    if (process.env.NODE_ENV !== 'development') {
        redirect('/coordinador');
    }
    return <CoordinadorScoringV2Page />;
}
