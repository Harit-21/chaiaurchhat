import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Card.css';

const Card = ({ name, location, rating, reviews, image, college }) => {

  return (
    <Link
      to={`/college/${encodeURIComponent(college)}/pg/${encodeURIComponent(name)}`}
    >
      <div className="card">
        <img src={image} alt={name} loading="lazy" />
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
