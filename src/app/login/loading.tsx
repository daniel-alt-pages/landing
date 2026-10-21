export default function LoginLoading() {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: '#0a0b10' }}
        >
            <div className="w-full max-w-md animate-pulse">
                {/* Brand */}
                <div className="text-center mb-6">
                    <div className="h-3 w-28 rounded bg-white/[0.06] mx-auto" />
                </div>

                {/* Glass card */}
                <div
                    className="rounded-3xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <div className="h-px bg-white/[0.06]" />
                    <div className="px-8 pt-10 pb-8 sm:px-10 space-y-6">
                        {/* Logo placeholder */}
                        <div className="flex justify-center">
                            <div className="w-28 h-28 rounded-3xl bg-white/[0.06]" />
                        </div>

                        {/* Title */}
                        <div className="space-y-3 text-center">
                            <div className="h-8 w-64 rounded-lg bg-white/[0.06] mx-auto" />
                            <div className="h-4 w-48 rounded bg-white/[0.04] mx-auto" />
                        </div>

                        {/* Button placeholder */}
                        <div className="h-14 rounded-2xl bg-white/[0.06]" />

                        {/* ID lookup placeholder */}
                        <div className="h-14 rounded-2xl bg-white/[0.04]" />
                    </div>
                </div>

                {/* Footer placeholder */}
                <div className="mt-6 space-y-2 text-center">
                    <div className="h-3 w-40 rounded bg-white/[0.04] mx-auto" />
                </div>
            </div>
        </div>
    );
}
