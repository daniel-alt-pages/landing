import '@/app/globals.css';
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar Sesión",
    description:
        "Ingresa con tu correo institucional para consultar tus resultados del simulacro PreICFES Saber 11. Dashboard interactivo, ranking y análisis detallado.",
    openGraph: {
        title: "Iniciar Sesión · Seamos Genios",
        description:
            "Consulta tus resultados PreICFES. Puntajes, ranking nacional y análisis pregunta a pregunta.",
    },
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
