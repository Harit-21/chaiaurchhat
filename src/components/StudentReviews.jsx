import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiUrl } from '../api';
import '../css/PGDetail/StudentReviews.css';
import { mapRentOpinionToSymbol, mapHappinessLevelToEmoji } from './PGDetailPage/ReviewIndicators';

const StudentReviews = ({ reviews, isMyReviewsPage = false, user, setShowLoginModal }) => {
    const [reviewHelpfulCounts, setReviewHelpfulCounts] = useState({});
    const [expandedComments, setExpandedComments] = useState({});
    const commentRef = useRef(null);
    const [clickedHelpfulReviews, setClickedHelpfulReviews] = useState(new Set());
    const [loadingHelpful, setLoadingHelpful] = useState(new Set());
    const [isLongComment, setIsLongComment] = useState({});
    const MAX_LINES_BEFORE_COLLAPSE = 4;
    const MAX_CHARS_BEFORE_COLLAPSE = 300;
    const [filterVerified, setFilterVerified] = useState(false);
    const [filterWithPhotos, setFilterWithPhotos] = useState(false);
    const [sortBy, setSortBy] = useState("newest");

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short' };
        return date.toLocaleDateString(undefined, options);
    };

    // Modal related states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [modalImages, setModalImages] = useState([]);

    const tiltRef = useRef(null);

    const sortedReviews = useMemo(() => {
        if (!reviews) return [];
        let arr = [...reviews];

        // Apply filters
        if (filterVerified) arr = arr.filter(r => r.verified);
        if (filterWithPhotos) arr = arr.filter(r => r.images?.length > 0);

        // Sorting
        switch (sortBy) {
            case "newest":
                return arr;
            case "oldest":
                return arr.slice().reverse();
            case "highestRating":
                return arr.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case "lowestRating":
                return arr.slice().sort((a, b) => (a.rating || 0) - (b.rating || 0));
            case "mostHelpful":
                return arr.slice().sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
            default:
                return arr;
        }
    }, [reviews, sortBy, filterVerified, filterWithPhotos]);

    const getRatingColor = (rating) => {
        if (!rating) return '#fff';
        if (rating >= 4.5) return 'var(--reviewcard)';
        if (rating >= 3.5) return 'var(--primary)';
        return 'var(--reviewcard)';
    };


    useEffect(() => {
        const counts = {};
        reviews.forEach((review) => {
            counts[review.id] = review.helpful_count || 0;
        });
        setReviewHelpfulCounts(counts);

        const clicked = JSON.parse(localStorage.getItem('clickedHelpfulReviews') || '[]');
        setClickedHelpfulReviews(new Set(clicked));
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

    // Helpful click handler
    const handleHelpfulClick = async (reviewId) => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        if (loadingHelpful.has(reviewId)) return;
        setLoadingHelpful(prev => new Set(prev).add(reviewId));

        const hasVoted = clickedHelpfulReviews.has(reviewId);

        try {
            const res = await fetch(`${apiUrl}/review/helpful`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review_id: reviewId,
                    user_email: user.email,
                }),
            });

            if (!res.ok) throw new Error('Request failed');
            const data = await res.json();

            setReviewHelpfulCounts(prev => ({
                ...prev,
                [reviewId]: data.helpful_count,
            }));

            if (hasVoted) {
                toast.info('Removed your helpful vote 👎');
            } else {
                toast.success('Marked as helpful 👍');
            }

            setClickedHelpfulReviews(prev => {
                const updated = new Set(prev);
                if (hasVoted) updated.delete(reviewId);
                else updated.add(reviewId);
                localStorage.setItem('clickedHelpfulReviews', JSON.stringify(Array.from(updated)));
                return updated;
            });
        } catch (err) {
            console.error(err);
            toast.error('Something went wrong');
        } finally {
            setLoadingHelpful(prev => {
                const updated = new Set(prev);
                updated.delete(reviewId);
                return updated;
            });
        }
    };

    const toggleComment = (id) => {
        setExpandedComments(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const openModal = (images, index) => {
        setModalImages(images);
        setModalImageIndex(index);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        if (tiltRef.current) {
            tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
    };

    useEffect(() => {
        if (!isModalOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeModal();
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

    const handleMouseMove = (e) => {
        if (!tiltRef.current) return;
        const rect = tiltRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateX = ((y / rect.height) - 0.5) * -30;
        const rotateY = ((x / rect.width) - 0.5) * 30;

        tiltRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
        if (tiltRef.current) {
            tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
    };

    useEffect(() => {
        if (!isModalOpen) return;

        const handleOrientation = (event) => {
            const { beta, gamma } = event;
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
            <div className="review-filters-container">

                <div className="filter-buttons">
                    <button
                        className={filterVerified ? 'active' : ''}
                        onClick={() => setFilterVerified(prev => !prev)}
                    >
                        🎓 Verified
                    </button>

                    <button
                        className={filterWithPhotos ? 'active' : ''}
                        onClick={() => setFilterWithPhotos(prev => !prev)}
                    >
                        📸 With Photos
                    </button>
                </div>

                <div className="sort-buttons">
                    <button
                        className={sortBy === 'mostHelpful' ? 'active' : ''}
                        onClick={() => setSortBy('mostHelpful')}
                    >
                       👍🏻 Most Helpful
                    </button>
                    <button
                        className={sortBy === 'newest' ? 'active' : ''}
                        onClick={() => setSortBy('newest')}
                    >
                        Latest
                    </button>
                    <button
                        className={sortBy === 'oldest' ? 'active' : ''}
                        onClick={() => setSortBy('oldest')}
                    >
                        ⏳Oldest
                    </button>
                    <button
                        className={sortBy === 'highestRating' ? 'active' : ''}
                        onClick={() => setSortBy('highestRating')}
                    >
                        ⭐ Top Rated
                    </button>
                    <button
                        className={sortBy === 'lowestRating' ? 'active' : ''}
                        onClick={() => setSortBy('lowestRating')}
                    >
                        🔻Lowest Rated
                    </button>
                </div>

                <button className="reset-filters" onClick={() => {
                    setFilterVerified(false);
                    setFilterWithPhotos(false);
                    setSortBy('newest');
                }}>
                    Reset
                </button>
            </div>


            {/* <div className="active-filters-tags">
                {sortBy && (
                    <span className="filter-tag" onClick={() => setSortBy('newest')}>
                        {sortBy === 'newest' && "Newest First 🆕"}
                        {sortBy === 'oldest' && "Oldest First ⏳"}
                        {sortBy === 'highestRating' && "Highest Rating ⭐"}
                        {sortBy === 'lowestRating' && "Lowest Rating 🔻"}
                        <span className="remove-tag" onClick={(e) => { e.stopPropagation(); setSortBy('newest'); }}>×</span>
                    </span>
                )}
                {filterVerified && (
                    <span className="filter-tag" onClick={() => setFilterVerified(false)}>
                        Verified 🎓 <span className="remove-tag">×</span>
                    </span>
                )}
                {filterWithPhotos && (
                    <span className="filter-tag" onClick={() => setFilterWithPhotos(false)}>
                        With Photos 📸 <span className="remove-tag">×</span>
                    </span>
                )}
            </div> */}


            <h2>📜Student Reviews</h2>
            {sortedReviews.map((review) => {
                const isExpanded = expandedComments[review.id] || false;
                const comment = review.comment;
                const isActive = clickedHelpfulReviews.has(review.id);

                return (
                    <div className="review-card" key={review.id} style={{ border: `0px solid ${getRatingColor(review.rating)}` }}>
                        <div className="review-header">
                            <div className="review-info">
                                <span className='name'>{review.name}</span>
                                {review.verified && (
                                    <span className="verified" verifiedhat="Verified stay">
                                        <span className='verified-hat'>🎓</span> Verified
                                    </span>
                                )}
                            </div>
                            <div className="review-meta">
                                <span className="rating">⭐ {review.rating}</span>
                            </div>
                        </div>

                        <div className="review-text">
                            <div
                                id={`comment-${review.id}`}
                                style={{
                                    maxHeight: !isExpanded && isLongComment[review.id]
                                        ? `${MAX_LINES_BEFORE_COLLAPSE * 1.35}em`
                                        : '1000px',
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

                        <div className="review-extras">
                            {review.happiness_level && (
                                <div className="extra-line emo-indicators">
                                    <strong>Happiness:</strong>{' '}
                                    <span id="hp-indicate" hpindicate={review.happiness_level}>
                                        {mapHappinessLevelToEmoji(review.happiness_level)}
                                    </span>
                                </div>
                            )}
                            {review.rent_opinion && (
                                <div className="extra-line emo-indicators">
                                    <strong>Rent:</strong>{' '}
                                    <span id="rent-indicate" rentindicate={review.rent_opinion}>
                                        {mapRentOpinionToSymbol(review.rent_opinion)}
                                    </span>
                                </div>
                            )}
                        </div>

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

                        <div className="reactions">
                            {!isMyReviewsPage && (
                                <button
                                    onClick={() => handleHelpfulClick(review.id)}
                                    className={`helpful-button ${isActive ? 'active' : ''}`}
                                    disabled={loadingHelpful.has(review.id)}
                                >
                                    <span id="helpful">🫱🏻‍🫲🏼</span>{' '}
                                    {reviewHelpfulCounts[review.id] || 0}
                                </button>

                            )}
                            <span className="date-line">{formatDate(review.date)}</span>
                            <span className="room-type" rooms="Room type">{review.room_type}</span>
                        </div>
                    </div>
                );
            })}

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
