'use client';

import dynamic from 'next/dynamic';
import { isAdminLocalOnly } from '@/lib/deploy-env';
import AdminRouteBlocked from '@/components/AdminRouteBlocked';

const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

/** En prod (`build:panels`) solo stub; bundle completo en `npm run dev`. */
export default function AdminPage() {
    if (isAdminLocalOnly) {
        return <AdminRouteBlocked />;
    }
    return <AdminDashboard />;
}
