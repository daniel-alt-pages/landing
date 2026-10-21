'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@features/auth/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isAdmin } from '@features/auth/lib/admin-auth';
import { warnIfMissingSecurityClaims } from '@features/auth/lib/token-claims';
import { isAdminLocalOnly } from '@/lib/deploy-env';
import AdminRouteBlocked from '@/components/AdminRouteBlocked';

function AdminLayoutAuth({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email && isAdmin(user.email)) {
                localStorage.setItem('admin_session', 'true');
                void warnIfMissingSecurityClaims(user);
                setAuthorized(true);
            } else {
                localStorage.removeItem('admin_session');
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
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-white/60 mt-4 text-sm">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    if (isAdminLocalOnly) {
        return <AdminRouteBlocked />;
    }
    return <AdminLayoutAuth>{children}</AdminLayoutAuth>;
}
