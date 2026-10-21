'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Producción sin panel admin: redirige a login. */
export default function AdminRouteBlocked() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/login');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#07080d]">
            <p className="text-white/50 text-sm">Redirigiendo…</p>
        </div>
    );
}
