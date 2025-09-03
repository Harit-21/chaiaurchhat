import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/Card.css';

const Card = ({ name, location, rating, reviews, image, college }) => {
  const [loaded, setLoaded] = useState(false);

  // Optional: base64 1x1 transparent image or a low-res blur
  const placeholderImage = 'src/assets/cacfb.png';

  return (
    <Link
      to={`/college/${encodeURIComponent(college)}/pg/${encodeURIComponent(name)}`}
    >
      <div className="card">
        {/* <img src={image} alt={name} loading="lazy" /> */}
        <div className="card-image-wrapper">
          <img
            src={placeholderImage}
            className="placeholder"
            alt="placeholder"
          />
          <img
            src={image}
            alt={name}
            className={`real-image ${loaded ? 'loaded' : ''}`}
            onLoad={() => setLoaded(true)}
            loading="lazy"
          />
        </div>
        <div className="card-body">
          <div className="card-text" title={name}>
            <h4>{name}</h4>
            <p>{location}</p>
          </div>
          <div className="card-rating">
            <span>⭐ {rating}</span>
            <span>· {reviews} Reviews</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Card;
