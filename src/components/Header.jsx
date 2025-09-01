import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../css/Signin.css';
import '../css/DarkToggle.css';
import { useAuth } from "../pages/AuthContext";
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';
import LoginModal from './LoginModal';
import { useDarkMode } from './DarkModeContext';
import cacLogoW from '../assets/cacw.png';
import cacLogoB from '../assets/cacb.png';

const Header = ({ onReviewClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const location = useLocation();
    const onPGDetailPage = /^\/college\/[^/]+\/pg\/[^/]+$/.test(location.pathname);
    const isUniversityEmail = (email) => {
        return /@(.*\.edu|.*\.ac\.in)$/i.test(email);
    };

    const siteName = import.meta.env.VITE_CAC_SITE_NAME;
    const { darkMode, setDarkMode } = useDarkMode();
    const toggleDarkMode = () => setDarkMode(prev => !prev);

    const handleEmailLogin = (email) => {
        console.log("Send one-time link to:", email);
        // Add backend logic or Firebase here
    };

    const dropdownRef = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="header">

            {/* <h1 onClick={() => navigate('/', { replace: true })}> */}
            <h1>
                <Link to="/">
                    <span className='caclogohead'>
                        <img src={darkMode ? cacLogoW : cacLogoB} alt="Logo" /> {siteName}
                    </span>
                </Link>
            </h1>
            <div className="nav-buttons">
                <div className="flex items-center gap-4">


                    {!user ? (
                        <button className="login-btn" onClick={() => setShowLoginModal(true)}>
                            {/* User Icon */}
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="9" r="3" strokeWidth="2.4"></circle>
                                <path d="M17.97 20C17.81 17.11 16.92 15 12 15C7.08 15 6.19 17.11 6.03 20" strokeWidth="2.4" strokeLinecap="round"></path>
                                <path d="M7 3.34C8.47 2.49 10.18 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 10.18 2.49 8.47 3.34 7" strokeWidth="2.4" strokeLinecap="round"></path>
                            </svg>
                        </button>
                    ) : (
                        <>
                            <div className="user-menu-wrapper">
                                <div
                                    className="user-avatar-wrapper"
                                    onClick={() => setMenuOpen(prev => !prev)}
                                    mailh={user.email}
                                >
                                    <div className="avatar-wrapper">
                                        <img
                                            src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(user.email)}`}
                                            alt="User Avatar"
                                            className="user-avatar"
                                        />
                                        {isUniversityEmail(user.email) && (
                                            <span className="avatar-badge" title="Verified Student">🎓</span>
                                        )}
                                    </div>
                                </div>

                                {menuOpen && (
                                    <div className="user-dropdown">
                                        <div className="user-email">
                                            {user.email}
                                            {isUniversityEmail(user.email) && (
                                                <span className="verified-badge" title="Verified Student">🎓</span>
                                            )}
                                        </div>
                                        <div className='reviewnout'>
                                            <Link to="/my-reviews">
                                                <button className="dropdown-item">
                                                    📄 My Reviews
                                                </button>
                                            </Link>
                                            <hr className='vertical-line' />
                                            <button className="dropdown-item" onClick={logout}>

                                                <span className="logout-btn" onClick={logout}>
                                                    <svg fill="#000000" height="28px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512.003 512.003" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <g> <path d="M96.003,106.668c29.419,0,53.333-23.936,53.333-53.333S125.422,0.002,96.003,0.002 c-29.419,0-53.333,23.936-53.333,53.333S66.585,106.668,96.003,106.668z M96.003,21.335c17.643,0,32,14.357,32,32 c0,17.643-14.357,32-32,32c-17.643,0-32-14.357-32-32C64.003,35.692,78.361,21.335,96.003,21.335z"></path> <path d="M177.646,179.82c-3.349-29.547-26.752-51.819-54.4-51.819H68.782c-27.648,0-51.051,22.272-54.4,51.819L0.238,303.724 c-1.173,10.368,2.027,20.672,8.768,28.224c5.803,6.507,13.525,10.304,21.909,10.773l11.776,159.403 c0.427,5.568,5.056,9.877,10.645,9.877h85.333c5.589,0,10.219-4.309,10.667-9.877l11.776-159.403 c8.363-0.469,16.107-4.245,21.909-10.773c6.741-7.573,9.941-17.856,8.768-28.224L177.646,179.82z M167.086,317.74 c-1.216,1.365-3.883,3.691-7.808,3.691h-8.107c-5.589,0-10.219,4.309-10.645,9.877l-11.776,159.36H63.257l-11.797-159.36 c-0.427-5.568-5.056-9.877-10.645-9.877h-8.107c-3.904,0-6.571-2.325-7.808-3.691c-2.709-3.051-3.968-7.275-3.477-11.605 l14.144-123.904c2.133-18.752,16.405-32.896,33.195-32.896h54.464c16.789,0,31.061,14.144,33.195,32.896l14.144,123.904 C171.076,310.466,169.795,314.69,167.086,317.74z"></path> <path d="M352.003,234.668c-5.888,0-10.667,4.779-10.667,10.667v42.667c0,5.888,4.779,10.667,10.667,10.667 c5.888,0,10.667-4.779,10.667-10.667v-42.667C362.67,239.447,357.891,234.668,352.003,234.668z"></path> <path d="M465.945,0.002H245.337c-17.643,0-32,14.357-32,32v384c0,17.643,14.357,32,32,32h53.333v17.941 c0,25.387,20.672,46.059,46.059,46.059c6.293,0,12.395-1.259,18.155-3.712l121.195-51.947 c16.96-7.275,27.925-23.893,27.925-42.347V46.06C512.003,20.674,491.331,0.002,465.945,0.002z M298.67,98.007v328.661h-53.333 c-5.867,0-10.667-4.779-10.667-10.667v-384c0-5.888,4.8-10.667,10.667-10.667h161.344L326.595,55.66 C309.635,62.935,298.67,79.554,298.67,98.007z M490.67,413.996c0,9.899-5.888,18.837-14.997,22.72l-121.195,51.947 c-3.072,1.323-6.379,2.005-9.749,2.005c-13.632,0-24.725-11.093-24.725-24.725V98.007c0-9.899,5.888-18.837,14.997-22.72 L456.195,23.34c3.072-1.323,6.379-2.005,9.749-2.005c13.632,0,24.725,11.093,24.725,24.725V413.996z"></path> </g> </g> </g> </g></svg>
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </>
                    )}
                    {onPGDetailPage && (
                        <button
                            className="write-review-header"
                            onClick={() => {
                                if (user) {
                                    onReviewClick?.();  // opens ReviewModal in PGDetailPage
                                } else {
                                    setShowLoginModal(true); // opens login modal
                                }
                            }}
                        >
                            ✍️ Write a Review
                        </button>
                    )}
                    <div className="toggle-wrapper" onClick={toggleDarkMode} title="Toggle Dark Mode">
                        <div className={`toggle-track ${darkMode ? 'dark' : 'light'}`}>
                            <div className="toggle-thumb">{darkMode ? '🌙' : '🌞'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                className={`hamburger ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
            >
                {/* {menuOpen ? '😛' : '🙂'} */}
                {menuOpen ? '😉' : '😊'}
            </button>

            {menuOpen && (
                <div className="mobile-menu">
                    {!user ? (
                        <>
                            {onPGDetailPage && (
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowLoginModal(true);
                                        setMenuOpen(false);
                                    }}
                                >
                                    ✍️ Write a Review
                                </button>
                            )}
                            {/* <button className="login-btn" onClick={() => setShowLoginModal(true)}> */}
                            <button className="dropdown-item" onClick={() => setShowLoginModal(true)}>
                                {/* Login Icon */}
                                {/* <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="9" r="3" strokeWidth="2.4"></circle>
                                        <path d="M17.97 20C17.81 17.11 16.92 15 12 15C7.08 15 6.19 17.11 6.03 20" strokeWidth="2.4" strokeLinecap="round"></path>
                                        <path d="M7 3.34C8.47 2.49 10.18 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 10.18 2.49 8.47 3.34 7" strokeWidth="2.4" strokeLinecap="round"></path>
                                    </svg> */}
                                🙋🏻‍♂️ Login / Signup
                            </button>
                            <button
                                onClick={toggleDarkMode} className="dropdown-item"
                            >
                                {darkMode ? '🌞 Bright Mode' : '🌙 Dark Mode'}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="mobile-user-info">
                                <div className="avatar-wrapper">
                                    <img
                                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(user.email)}`}
                                        alt="User Avatar"
                                        className="user-avatar"
                                    />
                                    {isUniversityEmail(user.email) && (
                                        <span className="avatar-badgemob" hat="Verified Student">🎓</span>
                                    )}
                                </div>
                                <div className="mobile-user-email">
                                    {user.email}
                                    {isUniversityEmail(user.email) && (
                                        <span className="verified-badgemob" hat="Verified Student">🎓</span>
                                    )}
                                </div>
                            </div>

                            {onPGDetailPage && (
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        onReviewClick?.();
                                        setMenuOpen(false);
                                    }}
                                >
                                    ✍️ Write a Review
                                </button>
                            )}

                            <Link to="/my-reviews">
                                <button className="dropdown-item">
                                    📄 My Reviews
                                </button>
                            </Link>

                            <button className="dropdown-item" onClick={() => {
                                logout();
                                setMenuOpen(false);
                            }}>
                                🚪 Logout
                            </button>
                            <button
                                onClick={toggleDarkMode} className="dropdown-item"
                            >
                                {darkMode ? '🌞 Bright Mode' : '🌙 Dark Mode'}
                            </button>
                        </>
                    )}

                </div>
            )}


            {/* Login Modal */}
            {showLoginModal && <LoginModal siteName={siteName} onClose={() => setShowLoginModal(false)} />}


        </header>
    );
};

export default Header;