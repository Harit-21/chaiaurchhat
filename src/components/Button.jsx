import React from 'react';

const Button = ({ children, onClick, type = "button", className = "" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-primary hover:bg-red-600 transition text-white font-semibold px-6 py-2 rounded-lg shadow-md ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
