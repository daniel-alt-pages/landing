'use client';
import '@/app/globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@features/auth/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isAdmin } from '@features/auth/lib/admin-auth';
import { isAdminLocalOnly } from '@/lib/deploy-env';
import AdminRouteBlocked from '@/components/AdminRouteBlocked';

function AdminPanelLayoutAuth({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email && isAdmin(user.email)) {
                setAuthorized(true);
            } else {
                setAuthorized(false);
                router.replace('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-white/60 mt-6 text-sm tracking-wide">
                        Verificando credenciales de administrador...
                    </p>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return <>{children}</>;
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
    if (isAdminLocalOnly) {
        return <AdminRouteBlocked />;
    }
    return <AdminPanelLayoutAuth>{children}</AdminPanelLayoutAuth>;
}
