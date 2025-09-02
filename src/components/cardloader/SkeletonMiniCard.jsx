import React from 'react';
import '../css/SkeletonMiniCard.css';

const SkeletonMiniCard = () => {
  return (
    <div className="skeleton-minicard shimmer">
      <div className="skeleton-avatar" />
      <div className="skeleton-line short" />
      <div className="skeleton-line long" />
    </div>
  );
};

export default SkeletonMiniCard;