import React from 'react';
import { Link } from 'react-router-dom';
import '../css/MiniCard.css';

const MiniCard = ({ name, city, image }) => {
  return (
    <Link
      to={`/college/${encodeURIComponent(name)}`}
      className="minicard"
    >
      <img src={image} alt={name} />
      <div className="minicard-info">
        <h4>{name}</h4>
        <p>{city}</p>
      </div>
    </Link>
  );
};

export default MiniCard;