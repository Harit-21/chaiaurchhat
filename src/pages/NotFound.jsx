import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 text-gray-700">
      <h1 className="text-6xl font-extrabold mb-4">404</h1>
      <p className="text-2xl mb-6">Oops! Neither Chhat Here Nor Chai☕.</p>
      <Link to="/" className="px-6 py-3 bg-black text-white rounded hover:bg-red-600">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
