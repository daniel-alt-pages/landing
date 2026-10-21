'use client';

type Props = {
    open: boolean;
    title: string;
    message: string;
    onClose: () => void;
};

function IconShield() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}

export default function ProfileAccessAlertModal({ open, title, message, onClose }: Props) {
    if (!open) return null;

    return (
        <div
            className="prf-confirm-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-access-alert-title"
            onClick={onClose}
        >
            <div className="prf-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="prf-confirm-icon">
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            margin: '0 auto',
                            borderRadius: 14,
                            background: 'rgba(239,68,68,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fca5a5',
                        }}
                    >
                        <IconShield />
                    </div>
                </div>
                <h3 id="profile-access-alert-title" className="prf-confirm-title">
                    {title}
                </h3>
                <p className="prf-confirm-text" style={{ textAlign: 'left' }}>
                    {message}
                </p>
                <p
                    className="prf-confirm-text"
                    style={{ textAlign: 'left', fontSize: 11, opacity: 0.65, marginTop: 8 }}
                >
                    Protegemos los datos personales de todos los estudiantes. No compartimos información de otras
                    cuentas.
                </p>
                <div className="prf-confirm-actions">
                    <button
                        type="button"
                        className="prf-confirm-btn prf-confirm-btn--confirm"
                        style={{ flex: 1 }}
                        onClick={onClose}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
