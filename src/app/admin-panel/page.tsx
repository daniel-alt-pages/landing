'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { isAdminLocalOnly } from '@/lib/deploy-env';
import AdminRouteBlocked from '@/components/AdminRouteBlocked';

const AdminPanelMain = dynamic(() => import('./AdminPanelMain'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

export default function AdminPanelPage() {
    if (isAdminLocalOnly) {
        return <AdminRouteBlocked />;
    }
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <AdminPanelMain />
        </Suspense>
    );
}
