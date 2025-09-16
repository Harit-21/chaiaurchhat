import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/PGDetailPage.css';
import ReviewSummaryPanel from '../components/ReviewSummaryPanel';
import StudentReviews from '../components/StudentReviews';
import RealityCheck from '../components/RealityCheck';
import ReviewModal from '../components/ReviewModal';
import React, { useState, useEffect, useMemo } from 'react';
import LoginModal from '../components/LoginModal';
import '../css/Signin.css';
import { useAuth } from '../pages/AuthContext';
import { apiUrl } from '../api';
import FullPageLoader from '../components/FullPageLoader';
import SkeletonCard from '../components/cardloader/SkeletonCard';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { fetchAllPGs, fetchPGDetail, fetchRecommendations } from '../api/PgPageQueries';
import PhotoGalleryModal from '../components/PGDetailPage/PhotoGalleryModal';

const PGDetailPage = () => {
    const { pgName, collegeName } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [pgMetadata, setPgMetadata] = useState({ gender_type: '', has_food: true });
    const { user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);


    const siteName = import.meta.env.VITE_CAC_SITE_NAME;

    // Fetch PG details
    const {
        data: pg,
        isLoading: isPGDetailLoading,
        error: pgError,
    } = useQuery({
        queryKey: ['pgDetail', pgName, collegeName],
        queryFn: () => fetchPGDetail({ pgName, collegeName }),
    });

    // Update metadata when pg data arrives
    useEffect(() => {
        if (!pg) return;
        setPgMetadata({
            gender_type: pg.gender_type || '',
            has_food: pg.has_food === undefined ? true : pg.has_food,
        });
    }, [pg]);

    // Fetch recommendations, enabled only if pg.name exists
    const {
        data: similarPGs = [],
        isLoading: similarPGsLoading,
    } = useQuery({
        queryKey: ['recommendations', pg?.name],
        queryFn: () => fetchRecommendations(pg.name),
        enabled: !!pg?.name,
    });

    // Categories for ratings
    const ratingCategories = ["Room", "Food", "Cleanliness", "Safety", "Location", "Warden"];

    // Memoize review statistics calculations
    const reviewStats = useMemo(() => {
        const stats = {
            total: {},
            count: {},
            roomTypes: new Set(),
            genderTypes: new Set(),
            tags: {},
            foodProvided: false,
        };

        pg?.reviewList?.forEach(review => {
            ratingCategories.forEach(category => {
                const key = `rating_${category.toLowerCase()}`;
                const val = review[key];
                if (typeof val === "number" && val > 0) {
                    stats.total[category] = (stats.total[category] || 0) + val;
                    stats.count[category] = (stats.count[category] || 0) + 1;
                }
            });

            if (review.room_type) stats.roomTypes.add(review.room_type);
            if (pg?.gender_type) stats.genderTypes.add(pg.gender_type);

            (review.tags || []).forEach(tag => {
                stats.tags[tag] = (stats.tags[tag] || 0) + 1;
            });
        });

        stats.foodProvided = pg?.has_food === true;

        return stats;
    }, [pg, ratingCategories]);


    // Memoize avg breakdown of ratings
    const avgBreakdown = useMemo(() => {
        const avg = {};
        ratingCategories.forEach(cat => {
            const total = reviewStats.total[cat] || 0;
            const count = reviewStats.count[cat] || 0;
            avg[cat] = count ? parseFloat((total / count).toFixed(1)) : "-";
        });
        return avg;
    }, [reviewStats, ratingCategories]);

    // Rent opinion stats and happiness level stats
    const { rentOpinionStats, happinessLevelStats, livedHereStats } = useMemo(() => {
        const rentStats = {};
        const happyStats = {};
        const livedStats = {};

        pg?.reviewList?.forEach(review => {
            if (review.rent_opinion) {
                rentStats[review.rent_opinion] = (rentStats[review.rent_opinion] || 0) + 1;
            }
            if (review.happiness_level) {
                happyStats[review.happiness_level] = (happyStats[review.happiness_level] || 0) + 1;
            }
            (review.class_years || []).forEach(year => {
                livedStats[year] = (livedStats[year] || 0) + 1;
            });
        });

        return {
            rentOpinionStats: rentStats,
            happinessLevelStats: happyStats,
            livedHereStats: livedStats,
        };
    }, [pg]);

    // Prepare display values
    const topTags = useMemo(() => {
        return Object.entries(reviewStats.tags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7)
            .map(([tag]) => tag);
    }, [reviewStats.tags]);

    const roomTypeDisplay = Array.from(reviewStats.roomTypes).join(", ") || "Not specified";
    const genderDisplay = pg?.gender_type || "Not specified";
    const reviewImages = pg && Array.isArray(pg.reviewList)
        ? pg.reviewList.flatMap(review =>
            (review.images || []).map(img => ({
                ...img,
                reviewId: review.id,
                reviewerName: review.name,
            }))
        )
        : [];


    const pgImages = Array.isArray(pg?.images)
        ? pg.images.map(img => ({
            ...img,
            reviewerName: null
        }))
        : [];


    const allGalleryImages = [...pgImages, ...reviewImages].map(img => ({
        ...img,
        tags: img.tags || img.imageTags || [],
    }));



    // Now conditionally render based on loading or error
    if (isPGDetailLoading) return <FullPageLoader />;
    if (pgError || !pg) return <div>PG not found.</div>;

    return (
        <div className="pg-detail-wrapper">
            <Helmet>
                <title>{pg.name} - {pg.location} | {siteName}</title>
                <meta name="description" content="Find honest PG & hostel reviews by students. Explore trending PGs near institutions with real ratings and feedback." />
            </Helmet>
            <Header onReviewClick={() => {
                if (user) {
                    setShowModal(true);
                } else {
                    setShowLoginModal(true);
                }
            }} />

            <div className="pg-header" style={{ backgroundImage: `url(${pg.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'})` }}>
                <div className="overlay">
                    <h1>{pg.name}</h1>
                    <div className="botright">
                        <p>
                            <Link to={`/college/${encodeURIComponent(collegeName)}`}>
                                <span className="pglocation-icon">
                                    <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12.2848 18.9935C12.1567 19.0875 12.0373 19.1728 11.9282 19.2493C11.8118 19.1721 11.6827 19.0833 11.5427 18.9832C10.8826 18.5109 10.0265 17.8176 9.18338 16.9529C7.45402 15.1792 6 12.9151 6 10.5C6 7.18629 8.68629 4.5 12 4.5C15.3137 4.5 18 7.18629 18 10.5C18 12.8892 16.4819 15.1468 14.6893 16.9393C13.8196 17.8091 12.9444 18.5099 12.2848 18.9935ZM19.5 10.5C19.5 16.5 12 21 12 21C11.625 21 4.5 16.5 4.5 10.5C4.5 6.35786 7.85786 3 12 3C16.1421 3 19.5 6.35786 19.5 10.5ZM13.5 10.5C13.5 11.3284 12.8284 12 12 12C11.1716 12 10.5 11.3284 10.5 10.5C10.5 9.67157 11.1716 9 12 9C12.8284 9 13.5 9.67157 13.5 10.5ZM15 10.5C15 12.1569 13.6569 13.5 12 13.5C10.3431 13.5 9 12.1569 9 10.5C9 8.84315 10.3431 7.5 12 7.5C13.6569 7.5 15 8.84315 15 10.5Z" fill="#ffffff"></path>
                                    </svg>
                                </span>
                                {pg.location}
                            </Link>
                        </p>
                        <p>⭐ {pg.avg_rating} ({pg.review_count} reviews)</p>
                        <button className="see-photos" onClick={() => setShowGallery(true)}>
                            See All Photos
                        </button>

                    </div>
                </div>
            </div>

            <main className="pg-main-layout">
                <section className="pg-left">
                    <button className="open-review-button" onClick={() => {
                        if (user) {
                            setShowModal(true);
                        } else {
                            setShowLoginModal(true);
                        }
                    }}>
                        ✍🏻 Write a Review
                    </button>
                    {!showModal && !showLoginModal && (
                        <button
                            className={`floating-review-button ${(showModal || showLoginModal) ? 'hidden' : ''}`}
                            onClick={() => {
                                if (user) {
                                    setShowModal(true);
                                } else {
                                    setShowLoginModal(true);
                                }
                            }}
                        >
                            ✍🏻 Write a Review
                        </button>
                        // <button
                        //     className="floating-review-button"
                        //     onClick={() => {
                        //         if (user) {
                        //             setShowModal(true);
                        //         } else {
                        //             setShowLoginModal(true);
                        //         }
                        //     }}
                        // >
                        //     <span className="pencil-icon">✍️</span>
                        //     <span className="float-review-text">Write a Review</span>
                        // </button>
                    )}
                    {showLoginModal && (
                        <LoginModal siteName={siteName} onClose={() => setShowLoginModal(false)} />
                    )}
                    {showModal && (
                        <ReviewModal
                            onClose={() => setShowModal(false)}
                            pgName={pg.name}
                            pgMetadata={pgMetadata}
                            user={user}
                        />
                    )}
                    <StudentReviews
                        reviews={pg.reviewList}
                        user={user}
                        setShowLoginModal={setShowLoginModal} />

                    <section className="pg-similar">
                        <h2>🎴If you liked this one,<br></br> you'll like those too.</h2>
                        <div className="similar-list">
                            {similarPGsLoading ? (
                                Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
                            ) : similarPGs.length === 0 ? (
                                <p>Uh-oh, your choice is unique, yaara. Right now, no suggestions for you.</p>
                            ) : (
                                similarPGs.map((pg, idx) => (
                                    <Link
                                        // key={idx}
                                        key={pg.id || pg.name}
                                        to={`/college/${encodeURIComponent(collegeName)}/pg/${encodeURIComponent(pg.name)}`}
                                        className="similar-card"
                                        style={{ textDecoration: "none", color: "inherit" }}
                                    >
                                        <img src={pg.image} alt={pg.name} />
                                        <h3>{pg.name}</h3>
                                        <p>{pg.location}</p>
                                        <p>⭐ {pg.avg_rating}</p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>

                </section>

                <aside className="pg-right">
                    <div className="sticky-sidebar">
                        <ReviewSummaryPanel
                            breakdown={{
                                "🛏️ Room": avgBreakdown["Room"],
                                "🍽️ Food": reviewStats.foodProvided ? avgBreakdown["Food"] : "No Food",
                                "🧼 Cleanliness": avgBreakdown["Cleanliness"],
                                "🛡️ Safety": avgBreakdown["Safety"],
                                "📍 Location": avgBreakdown["Location"],
                                "👨 Warden": avgBreakdown["Warden"],
                            }}
                            livedHereStats={livedHereStats}
                            tags={topTags}
                            reviewList={pg.reviewList || []}
                            rentOpinionStats={rentOpinionStats}
                            happinessLevelStats={happinessLevelStats}
                        />
                        <section className="pg-details-section">
                            <h3>PG Details</h3>
                            <p><strong>Room Types:</strong> {roomTypeDisplay}</p>
                            <p><strong>Gender Type:</strong> {genderDisplay}</p>
                            <p><strong>Located:</strong> <span className={`campus-pill ${pg.inside_campus === 'Inside Campus' ? 'inside' : 'outside'}`}>
                                {pg.inside_campus || "Unknown"}
                            </span></p>
                        </section>
                        <RealityCheck />

                    </div>
                </aside>
            </main>

            <Footer />
            {showGallery && (
                <PhotoGalleryModal
                    images={allGalleryImages}
                    onClose={() => setShowGallery(false)}
                />
            )}


        </div>
    );
};

export default PGDetailPage;
