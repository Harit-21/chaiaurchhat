import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiUrl } from '../api';

const StudentReviews = ({ reviews, isMyReviewsPage = false }) => {
    const [disabledButtons, setDisabledButtons] = useState(new Set());
    const [reviewHelpfulCounts, setReviewHelpfulCounts] = useState({});
    const [expandedComments, setExpandedComments] = useState({});

    useEffect(() => {
        const counts = {};
        reviews.forEach((review) => {
            counts[review.id] = review.helpful_count || 0;
        });
        setReviewHelpfulCounts(counts);

        const clicked = JSON.parse(localStorage.getItem('helpfulClicked') || '[]');
        setDisabledButtons(new Set(clicked));
    }, [reviews]);

    const handleHelpfulClick = (reviewId) => {
        const clickedSet = new Set(disabledButtons);
        const wasHelpful = clickedSet.has(reviewId);

        fetch(`${apiUrl}/review/helpful`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ review_id: reviewId, undo: wasHelpful }),
        })
            .then(res => res.json())
            .then(() => {
                toast.success(wasHelpful ? "Feedback removed!" : "Thanks for the feedback!");

                setReviewHelpfulCounts((prev) => ({
                    ...prev,
                    [reviewId]: (prev[reviewId] || 0) + (wasHelpful ? -1 : 1),
                }));

                const updated = new Set(disabledButtons);
                if (wasHelpful) {
                    updated.delete(reviewId);
                } else {
                    updated.add(reviewId);
                }

                setDisabledButtons(updated);
                localStorage.setItem('helpfulClicked', JSON.stringify([...updated]));
            })
            .catch((err) => {
                toast.error("Something went wrong");
                console.error("Error toggling helpful:", err);
            });
    };


    const toggleComment = (id) => {
        setExpandedComments(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <section className="pg-reviews">
            <h2>💬Student Reviews</h2>
            {reviews.map((review) => {
                const isExpanded = expandedComments[review.id] || false;
                const isDisabled = disabledButtons.has(review.id);
                const comment = review.comment;

                return (
                    <div className="review-card" key={review.id}>
                        {/* Header */}
                        <div className="review-header">
                            <div className="review-info">
                                <strong>{review.name}</strong>
                                {review.verified && (
                                    <span className="verified" verifiedhat="Verified stay">
                                        🎓 Verified
                                    </span>
                                )}
                            </div>
                            <div className="review-meta">
                                <span className="rating">⭐ {review.rating}</span>
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="review-text">
                            {isExpanded || comment.length <= 300
                                ? comment
                                : comment.slice(0, 300) + '... '}
                            {comment.length > 300 && (
                                <span
                                    className="read-more-toggle"
                                    onClick={() => toggleComment(review.id)}
                                >
                                    {isExpanded ? ' Show less' : 'Read more'}
                                </span>
                            )}
                        </div>

                        {/* Images */}
                        {review.images?.length > 0 && (
                            <div className="review-images">
                                {review.images.map((img, i) => (
                                    <img key={i} src={img} alt="review" />
                                ))}
                            </div>
                        )}

                        {/* Extra feedback (Happiness & Rent Opinion) */}
                        <div className="review-extras">
                            {review.happiness_level && (
                                <div className="extra-line">
                                    😊 <strong>Happiness:</strong> {review.happiness_level}
                                </div>
                            )}
                            {review.rent_opinion && (
                                <div className="extra-line">
                                    💸 <strong>Rent:</strong> {review.rent_opinion}
                                </div>
                            )}
                        </div>

                        {/* Reactions */}
                        <div className="reactions">
                            {!isMyReviewsPage && (
                                <button
                                    onClick={() => handleHelpfulClick(review.id)}
                                    className={`helpful-button ${isDisabled ? 'active' : ''}`}
                                >
                                    <span id='helpful'>🫱🏻‍🫲🏼</span> {reviewHelpfulCounts[review.id] || 0}
                                </button>
                                /* <button className="comment-button">💬 Comment</button> */
                            )}
                            <span className='date-line'>{review.date}</span>
                            <span className="room-type" rooms="Room type">{review.room_type}</span>
                        </div>
                    </div>
                );
            })}
        </section>
    );
};

export default StudentReviews;
