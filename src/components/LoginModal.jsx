import React from 'react';
import { handleGoogleLogin, sendEmailLink } from '../useAuth';
import { useAuth } from '../pages/AuthContext';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const LoginModal = ({ siteName, onClose }) => {
    const { user } = useAuth();
    const [emailStatus, setEmailStatus] = useState(null); // 'loading', 'sent', 'error'
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        if (user) onClose();
    }, [user, onClose]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;

        setEmailStatus("loading");
        try {
            await sendEmailLink(email);
            setEmailStatus("sent");
        } catch (error) {
            if (error.message === "quota") {
                setEmailStatus("quota");
            } else {
                setEmailStatus("error");
            }
        }
    };

    const handleGoogle = async () => {
        setGoogleLoading(true);
        try {
            await handleGoogleLogin();
        } catch (err) {
            console.error(err);
        }
        setGoogleLoading(false);
    };

    const handleBackdropClick = () => {
        if (!googleLoading && emailStatus !== 'loading') {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div className="loginmodal-overlay" onClick={handleBackdropClick}>
            <div className="loginmodal loginnew-modal" onClick={e => e.stopPropagation()}>
                <button className="loginmodal-close" onClick={onClose}>×</button>

                <div className="loginmodal-header">
                    <h2>Welcome to {siteName}</h2>
                    <p className="loginmodal-subtext">Unlock the real dorm stories — verified by real students like you.</p>
                </div>

                <div className="verified-card">
                    <div className="verified-icon"><div id='graduationcap-icon'>🎓</div></div>
                    <div className='verified-info'>
                        <strong>Earn a Verified Student Badge</strong>
                        <p>~ (Login via College mail)</p>
                    </div>
                </div>

                <div className="section-signin">
                    <button className="google-button" onClick={handleGoogle} disabled={googleLoading}>
                        {googleLoading ? (
                            <span className="spinner"></span>
                        ) : (
                            <>
                                <svg
                                    fill="#000000"
                                    viewBox="0 0 21.00 21.00"
                                    id="google-circle"
                                    data-name="Flat Color"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="google-icon icon flat-color"
                                >
                                    <circle id="primary" cx="12" cy="12" r="10" style={{ fill: "#000000" }} />
                                    <path
                                        id="secondary"
                                        d="M12,18A6,6,0,1,1,16.24,7.75a1,1,0,0,1-1.4,1.42A4,4,0,0,0,12,8a4,4,0,0,0-4,4,4,4,0,0,0,4,4,4,4,0,0,0,3.87-3H12a1,1,0,0,1,0-2h5a1,1,0,0,1,1,1A6,6,0,0,1,12,18Z"
                                        style={{ fill: "#fff" }}
                                    />
                                </svg>
                                Google Sign in
                            </>
                        )}
                    </button>
                </div>

                <div className="divider"><span>OR</span></div>

                <div className="section-signin">
                    <h4>Use your email instead</h4>
                    <p className="section-sub">We'll send you a one-time sign-in link. No passwords, no hassle.</p>
                    <form className="email-form" onSubmit={handleEmailSubmit}>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your school email"
                            required
                            disabled={emailStatus === 'loading' || emailStatus === 'quota'}
                        />
                        <button
                            type="submit"
                            disabled={emailStatus === 'loading' || emailStatus === 'quota'}
                        >
                            {emailStatus === 'loading'
                                ? 'Sending...'
                                : emailStatus === 'quota'
                                    ? 'Quota Exceeded'
                                    : 'Send Link'}
                        </button>
                    </form>

                    {/* Feedback Messages */}
                    {emailStatus === 'sent' && (
                        <p className="success-msg">📨 Email sent! Check your inbox.</p>
                    )}
                    {emailStatus === 'error' && (
                        <p className="error-msg">❌ Something went wrong. Try again.</p>
                    )}
                    {emailStatus === 'quota' && (
                        <p className="error-msg">🚫 Sign-in limit reached. Try again tomorrow or use Google.</p>
                    )}


                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

export default LoginModal;
