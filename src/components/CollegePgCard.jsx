import React, { useState, useEffect } from 'react';
import '../css/CollegePgCard.css';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const CollegePgCard = ({ id, name, gender_type, rating, reviews, image, user, onLoginRequired }) => {
  const { collegeName } = useParams();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:5000/wishlist?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const exists = data.some(pg => pg.pg_id === id);
          setWishlisted(exists);
        }
      })
      .catch(err => console.error("Failed to fetch wishlist:", err));
  }, [user, id]);


  const toggleWishlist = async (e) => {
    e.preventDefault();

    if (!user) {
      onLoginRequired?.();
      return;
    }

    setLoading(true);

    try {
      if (wishlisted) {
        // Remove from wishlist
        const res = await fetch('http://localhost:5000/wishlist/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, pg_id: id }),
        });

        if (!res.ok) throw new Error("Failed to remove");

        setWishlisted(false);
        toast.info(`Removed from Wishlist 💔`, { autoClose: 2000 });
      } else {
        // Add to wishlist
        const res = await fetch('http://localhost:5000/wishlist/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, pg_id: id }),
        });

        if (!res.ok) throw new Error("Failed to add");

        setWishlisted(true);
        toast.success(`Added to Wishlist ❤️`, { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error("Wishlist action failed 😞", { autoClose: 2500 });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Link to={`/college/${collegeName}/pg/${encodeURIComponent(name)}`} className="pg-card-link">
      <div className="college-pg-card">
        <img src={image} alt={name} className="pg-image" />

        <div className="pg-details">
          <div className="pg-top-row">
            <h4>{name}</h4>
            <div className="pg-rating">
              <span className="star">⭐</span>
              <strong>{rating}</strong>
              <span>({reviews})</span>
            </div>
          </div>

          <div className="pg-bottom-row">
            <p className="pg-gender">{gender_type || "Not specified"}</p>
          </div>

          <button
            className={`wishlist-btn ${wishlisted ? 'active' : ''} ${loading ? 'loading' : ''}`}
            onClick={toggleWishlist}
            title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            disabled={loading}
          >
            {loading ? '⏳' : (wishlisted ? '❤️' : '🤍')}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default CollegePgCard;
