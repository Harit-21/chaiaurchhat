import React from 'react';
import '../css/SkeletonCollegePgCard.css';

const SkeletonCollegePgCard = () => {
    return (
        <section className='skeleton-cpc'>
            <div className="skeleton-card shimmer">
                <div className="skeleton-thumbnail shimmer" />
                <div className="skeleton-details">
                    <div className="skeleton-line shimmer short" />
                    <div className="skeleton-line shimmer long" />
                    <div className="skeleton-meta">
                        <div className="skeleton-circle shimmer" />
                        <div className="skeleton-line shimmer xshort" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SkeletonCollegePgCard;