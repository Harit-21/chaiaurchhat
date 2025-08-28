import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import '../css/MyReviews.css';
import FancyReviewForm from '../components/FancyReviewForm';
import ReviewModal from '../components/ReviewModal';
import { apiUrl } from '../api.js';


const MyReviews = () => {
    const { user } = useAuth();
    const [myReviews, setMyReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState("date");
    const [editingReview, setEditingReview] = useState(null);
    const [editFormStep, setEditFormStep] = useState(1);
    const [wishlist, setWishlist] = useState([]);

    const sortedReviews = [...myReviews].sort((a, b) => {
        if (sortKey === "date") return new Date(b.date) - new Date(a.date);
        if (sortKey === "rating") return b.rating - a.rating;
        return 0;
    });

    const handleUpdate = (id, updatedFields) => {
        setMyReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
        );
    };

    const handleDelete = (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this review?");
        if (!confirmed) return;

        fetch(`${apiUrl}/reviews/${id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (!res.ok) throw new Error("Delete failed");
                setMyReviews(prev => prev.filter(r => r.id !== id));
            })
            .catch(err => {
                console.error("Failed to delete review:", err);
                alert("Something went wrong.");
            });
    };

    const fetchWishlist = () => {
        if (!user) return;
        fetch(`${apiUrl}/wishlist?email=${encodeURIComponent(user.email)}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setWishlist(data);
                }
            })
            .catch(err => console.error("Failed to fetch wishlist", err));
    };

    useEffect(() => {
        if (!user) return;

        fetch(`${apiUrl}/user-reviews?email=${encodeURIComponent(user.email)}`)
            .then(res => res.json())
            .then(data => {
                const reviewsArray = Array.isArray(data)
                    ? data
                    : Array.isArray(data.reviews)
                        ? data.reviews
                        : Array.isArray(data.data)
                            ? data.data
                            : [];

                // Ensure has_food is always included (fallback to true)
                const reviewsWithFood = reviewsArray.map(r => ({
                    ...r,
                    has_food: r.has_food === true
                }));

                setMyReviews(reviewsWithFood);
                setLoading(false);
            })

            .catch(err => {
                console.error("Failed to fetch user reviews:", err);
                setLoading(false);
            });
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [user]);


    // live update on every render (less efficient, more real-time):
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
    //         setWishlist(stored);
    //     }, 1000);
    //     return () => clearInterval(interval);
    // }, []);


    if (!user) {
        return (
            <div>
                <Header />
                <div className="myreviews-bg-header">
                    <div className="myreviews-overlay">
                        <p>My Reviews 🙂</p>
                    </div>
                </div>
                <main style={{ padding: "2rem", textAlign: "center" }}>
                    <h2>Please log in to view your reviews.</h2>
                </main>
                <Footer />
            </div>
        );
    }

    if (loading) {
        return (
            <div>
                <Header />
                <main style={{ padding: "2rem" }}>
                    <h2>Loading your reviews...</h2>
                </main>
                <Footer />
            </div>
        );
    }

    if (myReviews.length === 0) {
        return (
            <div>
                <Header />
                <div className="myreviews-bg-header">
                    <div className="myreviews-overlay">
                        <p>My Reviews 🙂</p>
                    </div>
                </div>
                <main style={{ padding: "2rem" }}>
                    <h2>You haven’t written any reviews yet.</h2>
                    <p>Once you write reviews, they’ll appear here for easy access and editing.</p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Header />
            <div className="myreviews-bg-header">
                <div className="myreviews-overlay">
                    <p>My Reviews 🙂</p>
                </div>
            </div>
            <main className="my-reviews-wrapper two-column-layout">
                {/* Left Column - Reviews */}
                <div className="reviews-section">
                    <h2>📄 My Reviews ({myReviews.length})</h2>
                    <p>All reviews you’ve submitted are listed here. Click on the PG name to view its page.</p>

                    <div className="sort-filter-bar">
                        <label htmlFor="sort">Sort by:</label>
                        <select id="sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                            <option value="date">Newest First</option>
                            <option value="rating">Highest Rated</option>
                        </select>
                    </div>


                    <div className="my-reviews-list">
                        {sortedReviews.map((review) => (
                            <div key={review.id} className="my-review-card">
                                <div className="my-review-header">
                                    <div className="pg-college-line">
                                        <p className="pg-name">{review.pg_name}</p>
                                        <p className="college-name">{review.college_short_name}</p>
                                    </div>
                                    <div className="rating-box">
                                        ⭐ {review.rating}
                                    </div>
                                </div>

                                <p className="comment">
                                    {review.comment.length > 250
                                        ? review.comment.slice(0, 250) + '...'
                                        : review.comment}
                                </p>

                                <div className="review-tags">
                                    {review.happiness_level && (
                                        <span>😊 Happiness: {review.happiness_level}</span>
                                    )}
                                    {review.rent_opinion && (
                                        <span>💸 Rent: {review.rent_opinion}</span>
                                    )}
                                </div>

                                <div className="review-actions">
                                    <div>
                                        <button
                                            className="helpful-btn"
                                            disabled
                                        >
                                            🫱🏻‍🫲🏼 Helpful: {review.helpful_count || 0}
                                        </button>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="edit-btn" onClick={() => setEditingReview(review)}>✏️ Edit</button>
                                        <button className="delete-btn" onClick={() => handleDelete(review.id)}>🗑️ Delete</button>
                                        <Link
                                            to={`/college/${encodeURIComponent(review.college_name)}/pg/${encodeURIComponent(review.pg_name)}`}
                                            className="view-pg-link"
                                        >
                                            🔗 View PG
                                        </Link>
                                    </div>
                                </div>

                                <p className="review-date">
                                    🗓️ {new Date(review.date).toLocaleDateString()} | Room: {review.room_type}
                                    {review.verified && <span className="verified-badge">✔️ Verified</span>}
                                </p>

                            </div>
                        ))}
                    </div>
                </div>

                {/* <section style={{ marginTop: "3rem" }}>
                    <h3>Your Reviews</h3>
                    <StudentReviews reviews={myReviews} isMyReviewsPage={true} />
                </section> */}
                {/* Right Column - Wishlist */}
                <div className="wishlist-section">
                    <h3>❤️ Wishlist</h3>
                    {wishlist.length === 0 ? (
                        <p>No PGs added yet.</p>
                    ) : (
                        <div className="wishlist-pg-list">
                            {wishlist.map((pg, index) => (
                                <Link
                                    to={`/college/${pg.location}/pg/${encodeURIComponent(pg.name)}`}
                                    className="wishlist-item"
                                    key={index}
                                >
                                    <div className="wishlist-card">
                                        <img src={pg.image} alt={pg.name} />
                                        <div>
                                            <h4>{pg.name}</h4>
                                            <p>{pg.collegeName}</p>
                                            <p>⭐ {pg.rating}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
            {editingReview && (
                <ReviewModal
                    pgName={editingReview.pg_name}
                    pgMetadata={{ has_food: editingReview.has_food }}
                    user={user}
                    existingReview={{
                        ...editingReview,
                        classYears: editingReview.class_years,
                        roomType: editingReview.room_type,
                        rentOpinion: editingReview.rent_opinion,
                        happinessLevel: editingReview.happiness_level,
                        tags: editingReview.tags || [],
                        images: editingReview.images || [],
                    }}
                    step={editFormStep}
                    setStep={setEditFormStep}
                    onClose={() => {
                        setEditingReview(null);
                        setEditFormStep(1);
                    }}
                />
            )}

        </div>

    );
};

export default MyReviews;

