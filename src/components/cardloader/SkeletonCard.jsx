import React from 'react';
import '../css/SkeletonCard.css';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img shimmer" />
      <div className="skeleton-content">
        <div className="skeleton-line short shimmer" />
        <div className="skeleton-line long shimmer" />
        <div className="skeleton-rating shimmer" />
      </div>
    </div>
  );
};

export default SkeletonCard;
