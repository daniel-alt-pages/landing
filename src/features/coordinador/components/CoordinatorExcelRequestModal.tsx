'use client';

import { CoordinatorExcelRequestShell } from '@features/coordinador/components/CoordinatorExcelRequestForm';

export type CoordinatorExcelRequestModalProps = {
    open: boolean;
    onClose: () => void;
    institutionName: string;
    simulationId: string;
    availableInstitutions: string[];
    availableSimulations: string[];
    sourcePanel?: string;
};

export default function CoordinatorExcelRequestModal(props: CoordinatorExcelRequestModalProps) {
    return <CoordinatorExcelRequestShell {...props} />;
}
