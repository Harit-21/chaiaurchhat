import React from 'react';
import '../css/FullPageLoader.css';

const FullPageLoader = () => {
  return (
    <div className="fullpage-loader">
      <div className="loader-logo-container">
        <svg
          className="loader-logo-svg"
          width="140"
          height="140"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cupGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#444" />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
            <linearGradient id="roofGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#555" />
              <stop offset="100%" stopColor="#111" />
            </linearGradient>
            <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
            </filter>
          </defs>

          {/* Shadow */}
          <ellipse cx="100" cy="180" rx="45" ry="8" fill="#999" filter="url(#blur)" />

          {/* Cup */}
          <g className="logo-cup">
            <path d="M60 130c0 20 10 30 40 30s40-10 40-30V110H60v20z" fill="url(#cupGradient)" />
            <path d="M50 115c-10 0-10 20 10 20v-5c-10 0-10-10-5-10h5v-5h-10z" fill="#111" />
          </g>

          {/* Steam */}
          <g className="logo-steam">
            <path d="M90 100c0 5-5 5-5 10s5 5 5 10" stroke="#aaa" strokeWidth="2" fill="none" className="steam-path" />
            <path d="M100 100c0 5-5 5-5 10s5 5 5 10" stroke="#aaa" strokeWidth="2" fill="none" className="steam-path delay1" />
            <path d="M110 100c0 5-5 5-5 10s5 5 5 10" stroke="#aaa" strokeWidth="2" fill="none" className="steam-path delay2" />
          </g>

          {/* Roof & Chimney */}
          <g className="logo-roof">
            <path d="M30 90 L100 40 L170 90 L160 100 L100 60 L40 100 Z" fill="url(#roofGradient)" />
            <rect x="150" y="60" width="10" height="30" fill="#222" />
            <path d="M155 50c0 5-10 5-10 10s10 5 10 10" stroke="#333" strokeWidth="2" fill="none" />
          </g>
        </svg>
      </div>
      <p className="loader-text">Finding PGs under your cozy chhat...</p>
    </div>
  );
};

export default FullPageLoader;
