import '@/app/globals.css';
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Acceso Coordinador · Seamos Genios",
    description: "Acceso privado para coordinadores institucionales.",
    robots: { index: false, follow: false },
};

export default function AccesoLayout({ children }: { children: React.ReactNode }) {
    return children;
}
