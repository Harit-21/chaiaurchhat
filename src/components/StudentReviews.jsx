import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiUrl } from '../api';
import '../css/PGDetail/StudentReviews.css';

const StudentReviews = ({ reviews, isMyReviewsPage = false }) => {
    const [disabledButtons, setDisabledButtons] = useState(new Set());
    const [reviewHelpfulCounts, setReviewHelpfulCounts] = useState({});
    const [expandedComments, setExpandedComments] = useState({});
    const commentRef = useRef(null);
    const [isLongComment, setIsLongComment] = useState({});
    const MAX_LINES_BEFORE_COLLAPSE = 4;
    const MAX_CHARS_BEFORE_COLLAPSE = 300;

    // Modal related states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [modalImages, setModalImages] = useState([]);

    const tiltRef = useRef(null);

    useEffect(() => {
        const counts = {};
        reviews.forEach((review) => {
            counts[review.id] = review.helpful_count || 0;
        });
        setReviewHelpfulCounts(counts);

        const clicked = JSON.parse(localStorage.getItem('helpfulClicked') || '[]');
        setDisabledButtons(new Set(clicked));
    }, [reviews]);

    useLayoutEffect(() => {
        const updated = {};
        reviews.forEach((review) => {
            const el = document.getElementById(`comment-${review.id}`);
            if (el) {
                const rawLineHeight = getComputedStyle(el).lineHeight;
                const lineHeight = parseFloat(rawLineHeight) || 20;
                const lines = el.clientHeight / lineHeight;

                const isLongByLines = lines > MAX_LINES_BEFORE_COLLAPSE;
                const isLongByChars = review.comment.length > MAX_CHARS_BEFORE_COLLAPSE;

                updated[review.id] = isLongByLines || isLongByChars;
            }
        });
        setIsLongComment(updated);
    }, [reviews]);

    // Helpful click handler (unchanged)
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

    // Open modal and set images + index
    const openModal = (images, index) => {
        setModalImages(images);
        setModalImageIndex(index);
        setIsModalOpen(true);
    };

    // Close modal and reset tilt
    const closeModal = () => {
        setIsModalOpen(false);
        if (tiltRef.current) {
            tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
    };

    // Keyboard navigation in modal
    useEffect(() => {
        if (!isModalOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
            if (e.key === 'ArrowRight') {
                setModalImageIndex((prev) => (prev + 1) % modalImages.length);
            }
            if (e.key === 'ArrowLeft') {
                setModalImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, modalImages.length]);

    // Tilt effect on mouse move
    const handleMouseMove = (e) => {
        if (!tiltRef.current) return;
        const rect = tiltRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left; // X relative to image container
        const y = e.clientY - rect.top;

        const rotateX = ((y / rect.height) - 0.5) * -30; // range -15 to 15 degrees approx
        const rotateY = ((x / rect.width) - 0.5) * 30;

        tiltRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    // Reset tilt when mouse leaves
    const handleMouseLeave = () => {
        if (tiltRef.current) {
            tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
    };

    // Device orientation tilt support (for mobile)
    useEffect(() => {
        if (!isModalOpen) return;

        const handleOrientation = (event) => {
            const { beta, gamma } = event; // beta: front-back tilt, gamma: left-right
            if (tiltRef.current) {
                const rotateX = Math.min(Math.max(beta - 45, -15), 15) / 3;
                const rotateY = Math.min(Math.max(gamma, -15), 15) / 3;
                tiltRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        };

        if (
            typeof DeviceOrientationEvent !== 'undefined' &&
            DeviceOrientationEvent.requestPermission
        ) {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            if (tiltRef.current) {
                tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
            }
        };
    }, [isModalOpen]);

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
                            <div
                                id={`comment-${review.id}`}
                                style={{
                                    maxHeight: !isExpanded && isLongComment[review.id]
                                        ? `${MAX_LINES_BEFORE_COLLAPSE * 1.35}em`
                                        : 'none',
                                    overflow: 'hidden',
                                }}
                            >
                                {(() => {
                                    if (isExpanded || !isLongComment[review.id]) {
                                        return comment.split('\n').map((line, index) => (
                                            <React.Fragment key={index} >
                                                {line}
                                                <br />
                                            </React.Fragment>
                                        ));
                                    } else if (comment.length > MAX_CHARS_BEFORE_COLLAPSE) {
                                        // Truncate comment by char limit, preserving line breaks is tricky, so just slice string
                                        const truncated = comment.slice(0, MAX_CHARS_BEFORE_COLLAPSE) + '...';
                                        return truncated;
                                    } else {
                                        return comment.split('\n').map((line, index) => (
                                            <React.Fragment key={index} >
                                                {line}
                                                <br />
                                            </React.Fragment>
                                        ));
                                    }
                                })()}

                            </div>
                            {isLongComment[review.id] && (
                                <span
                                    className="read-more-toggle"
                                    onClick={() => toggleComment(review.id)}
                                >
                                    {isExpanded ? ' Show less' : 'Read more'}
                                </span>
                            )}
                        </div>

                        {/* Extra feedback */}
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

                        {/* Images */}
                        {review.images?.length > 0 && (
                            <div className="review-images">
                                {review.images.map((imgObj, i) => (
                                    <img
                                        key={i}
                                        src={imgObj.url}
                                        alt={imgObj.caption || `Review ${i + 1}`}
                                        onClick={() => openModal(review.images, i)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Reactions */}
                        <div className="reactions">
                            {!isMyReviewsPage && (
                                <button
                                    onClick={() => handleHelpfulClick(review.id)}
                                    className={`helpful-button ${isDisabled ? 'active' : ''}`}
                                >
                                    <span id="helpful">🫱🏻‍🫲🏼</span> {reviewHelpfulCounts[review.id] || 0}
                                </button>
                            )}
                            <span className="date-line">{review.date}</span>
                            <span className="room-type" rooms="Room type">{review.room_type}</span>
                        </div>
                    </div>
                );
            })}

            {/* Modal */}
            {isModalOpen && (
                <div className="hostel-image-overlay" onClick={closeModal}>
                    <div
                        className="hostel-image-modal"
                        ref={tiltRef}
                        onClick={e => e.stopPropagation()}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button className="hostelimg-close-button" onClick={closeModal} aria-label="Close image modal">
                            X
                        </button>
                        <div className="image-n-desc">
                            <img
                                src={modalImages[modalImageIndex]?.url}
                                alt={modalImages[modalImageIndex]?.caption || 'Review image'}
                                draggable={false}
                            />
                            <div className="image-caption">
                                {modalImages[modalImageIndex]?.caption
                                    ? modalImages[modalImageIndex].caption
                                    : `Pic ${modalImageIndex + 1} of ${modalImages.length}`}
                            </div>
                        </div>
                        {modalImages.length > 1 && (
                            <div className="leftright-buttons">
                                <button
                                    onClick={() =>
                                        setModalImageIndex((prev) =>
                                            prev === 0 ? modalImages.length - 1 : prev - 1
                                        )
                                    }
                                    aria-label="Previous Image"
                                >
                                    ⮜
                                </button>
                                <button
                                    onClick={() =>
                                        setModalImageIndex((prev) =>
                                            prev === modalImages.length - 1 ? 0 : prev + 1
                                        )
                                    }
                                    aria-label="Next Image"
                                >
                                    ⮞
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default StudentReviews;
