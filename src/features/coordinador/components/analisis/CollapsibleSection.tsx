'use client';
import React, { useState, useEffect, useRef } from 'react';

export function CollapsibleSection({ title, icon, children, defaultOpen = false, preview }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; preview?: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (open && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
            const timer = setTimeout(() => setHeight(undefined), 500);
            return () => clearTimeout(timer);
        } else {
            setHeight(0);
        }
    }, [open]);

    return (
        <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'bg-white/[0.04] border border-white/[0.12] shadow-lg shadow-black/10' : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'}`}>
            {/* Active accent line */}
            <div className={`absolute top-0 left-0 w-full h-[2px] transition-all duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.6), rgba(99,102,241,0.4), transparent)' }} />
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors group cursor-pointer"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${open ? 'bg-purple-500/15 scale-110' : 'bg-white/[0.04]'}`}>
                        {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className={`text-sm font-bold transition-colors duration-200 ${open ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{title}</h3>
                        {preview && (
                            <p className={`text-[11px] mt-0.5 truncate leading-relaxed transition-all duration-200 ${open ? 'text-purple-300/50' : 'text-white/25 group-hover:text-white/35'}`}>{preview}</p>
                        )}
                    </div>
                </div>
                <div className={`flex-shrink-0 ml-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${open ? 'bg-purple-500/15 rotate-180' : 'bg-white/[0.04] group-hover:bg-white/[0.08]'}`}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`transition-colors duration-200 ${open ? 'text-purple-400' : 'text-white/30'}`}>
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </button>
            <div
                ref={contentRef}
                className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                    maxHeight: open ? (height !== undefined ? `${height}px` : '9999px') : '0px',
                    opacity: open ? 1 : 0,
                }}
            >
                <div className="border-t border-white/[0.06]">{children}</div>
            </div>
        </div>
    );
}
