import React from 'react';
import { Link } from 'react-router-dom';
import { useDarkMode } from './DarkModeContext';
import cacLogoW from '../assets/cacw.png';
// import cacLogoB from '../assets/cacb.png';
import cacLogoB from '../assets/cacfb.png';

const siteName = import.meta.env.VITE_CAC_SITE_NAME;

const Footer = () => {
    const { darkMode } = useDarkMode();
    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <span className='caclogofoot'>
                        <h2><Link to="/" className="footer-brand-link">
                            {siteName} <img src={darkMode ? cacLogoW : cacLogoB} alt="Logo" />
                        </Link></h2>
                    </span>
                    <p>Your trusted guide to honest PG & Hostel reviews from real students.</p>
                </div>

                <div className="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#">Home</a></li>
                        <li><a href="#">Top Colleges</a></li>
                        <li><a href="#">Popular PGs</a></li>
                        <li><a href="#">Post a Review</a></li>
                    </ul>
                </div>

                <div className="footer-contact">
                    <h4>Connect with Us</h4>
                    <div className="social-icons">
                        <a href="#" aria-label="Instagram" title='Instagram'>📸</a>
                        <a href="#" aria-label="Twitter" title='Twitter'>🐦</a>
                        <a href="#" aria-label="LinkedIn" title='LinkedIn'>💼</a>
                        <a href="mailto:themadbrogrammers@gmail.com" aria-label="Email" title='Email'>✉️</a>
                    </div>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input type="email" placeholder="Your email" required />
                        <button type="submit">Subscribe</button>
                    </form>
                    <p>Contact Us:</p>
                    <p> <a href="mailto:themadbrogrammers@gmail.com">themadbrogrammers@gmail.com</a></p>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
                <p>Made with ❤️ by students, for students.</p>
            </div>
        </footer>
    );
};

export default Footer;
