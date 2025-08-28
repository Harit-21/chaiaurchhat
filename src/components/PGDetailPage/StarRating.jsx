// components/StarRating.jsx
import React from 'react';
import '../../css/PGDetailPage.css'; // CSS for styles and animations

const StarRating = ({ rating }) => {
    if (typeof rating === 'string') {
        return <span>{rating}</span>; // For "No Food" or other non-numeric values
    }

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
    const totalStars = 5;

    const getStarType = (i) => {
        if (i < fullStars) return 'full';
        if (i === fullStars && hasHalfStar) return 'half';
        return 'empty';
    };

    return (
        <span
            className="star-rating-wrapper"
            title={`${rating.toFixed(1)} out of 5`}
        >
            {[...Array(totalStars)].map((_, i) => (
                <span
                    key={i}
                    className={`star-icon ${getStarType(i)}`}
                />
            ))}
            <span className="star-rating-text">({rating.toFixed(1)})</span>
        </span>
    );
};

export default StarRating;
