import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CollegePgCard from '../components/CollegePgCard';
import PgControls from '../components/PgControls';
import '../css/CollegePage.css';
import AddHostelModal from '../components/AddHostelModal';
import LoginModal from '../components/LoginModal';
import { useAuth } from './AuthContext';
import { useSearchParams } from 'react-router-dom';
import { apiUrl } from '../api';
import { Helmet } from 'react-helmet-async';
import FullPageLoader from '../components/FullPageLoader';
import SkeletonCollegePgCard from '../components/cardloader/SkeletonCollegePgCard';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const CollegePage = () => {
    const { collegeName } = useParams();

    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
    const [minRating, setMinRating] = useState(parseFloat(searchParams.get("rating") || 0));
    const [sortOption, setSortOption] = useState(searchParams.get("sort") || "");
    const [genderType, setGenderType] = useState(searchParams.get("gender") || "");
    const [hasFood, setHasFood] = useState(searchParams.get("food") || "");

    const [showAddModal, setShowAddModal] = useState(false);
    const [resetKey, setResetKey] = useState(Date.now());

    const [showLoginModal, setShowLoginModal] = useState(false);
    const { user } = useAuth();
    const siteName = import.meta.env.VITE_CAC_SITE_NAME;


    function useDebounce(value, delay = 300) {
        const [debounced, setDebounced] = useState(value);

        useEffect(() => {
            const timeout = setTimeout(() => {
                setDebounced(value);
            }, delay);

            return () => clearTimeout(timeout);
        }, [value, delay]);

        return debounced;
    }

    const debouncedSearch = useDebounce(searchTerm, 300);

    const handleAddHostelClick = () => {
        if (user) {
            setShowAddModal(true);
        } else {
            setShowLoginModal(true);
        }
    };

    const {
        data: college,
        isLoading: loadingCollege,
        error: collegeError,
    } = useQuery({
        queryKey: ['college', collegeName],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/college/${encodeURIComponent(collegeName)}`);
            if (!res.ok) throw new Error('Failed to fetch college');
            return res.json();
        }
    });



    // === API call to your Flask backend ===
    const {
        data: pgList = [],
        isLoading: loadingPGs,
        error: pgError,
    } = useQuery({
        queryKey: ['pgs', college?.id],
        enabled: !!college?.id,
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/pgs?college_id=${encodeURIComponent(college.id)}`);
            if (!res.ok) throw new Error('Failed to fetch PGs');
            return res.json();
        }
    });



    // === Filtering & Sorting ===

    const filteredPGs = useMemo(() => {
        return pgList
            .filter(pg =>
                pg.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
            )
            .filter(pg => (pg.avg_rating || 0) >= minRating)
            .filter(pg => genderType === "" || pg.gender_type === genderType)
            .filter(pg => hasFood === "" || pg.has_food === (hasFood === "true"))
            .sort((a, b) => {
                switch (sortOption) {
                    case 'mostReviews':
                        return (b.review_count || 0) - (a.review_count || 0);
                    case 'highestRating':
                        return (b.avg_rating || 0) - (a.avg_rating || 0);
                    default:
                        return 0;
                }
            });
    }, [pgList, debouncedSearch, minRating, genderType, hasFood, sortOption]);

    useEffect(() => {
        const newParams = {};
        if (debouncedSearch) newParams.q = debouncedSearch;
        if (minRating) newParams.rating = minRating;
        if (sortOption) newParams.sort = sortOption;
        if (genderType) newParams.gender = genderType;
        if (hasFood) newParams.food = hasFood;

        const currentParams = Object.fromEntries(searchParams.entries());

        if (JSON.stringify(currentParams) !== JSON.stringify(newParams)) {
            setSearchParams(newParams, { replace: true });
        }
    }, [debouncedSearch, minRating, sortOption, genderType, hasFood]);


    // Fetch wishlist on load
    const {
        data: wishlist = [],
        isLoading: loadingWishlist,
    } = useQuery({
        queryKey: ['wishlist', user?.email],
        enabled: !!user?.email,
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/wishlist?email=${encodeURIComponent(user.email)}`);
            if (!res.ok) throw new Error('Failed to fetch wishlist');
            return res.json();
        }
    });
    const wishlistIds = wishlist.map(item => item.pg_id);

    // useQuery({
    //     queryKey: ['college', collegeName],
    //     queryFn: async () => {
    //         const res = await fetch(`${apiUrl}/college/${encodeURIComponent(collegeName)}`);
    //         if (!res.ok) throw new Error('Failed to fetch college');
    //         return res.json();
    //     },
    //     staleTime: 5 * 60 * 1000, // 5 minutes
    // })

    const totalReviews = filteredPGs.reduce((sum, pg) => sum + (pg.review_count || 0), 0);
    const totalPGs = filteredPGs.length;
    const backgroundImage = college?.image?.trim() || "https://images.unsplash.com/20/cambridge.JPG";

    if (loadingCollege) return <FullPageLoader />;

    if (collegeError || pgError) {
        return (
            <div className="error-state">
                <Header />
                <p>Error loading page: {collegeError?.message || pgError?.message}</p>
                <Footer />
            </div>
        );
    }

    return (
        <div className="college-page-wrapper">
            <Helmet>
                <title>{college.short_name} | {siteName}</title>
                <meta
                    name="description"
                    content={`Explore ${totalPGs} PGs near ${college?.short_name || collegeName} with ${totalReviews} student reviews.`}
                />
            </Helmet>
            <Header />

            {/* === Hero Section === */}
            <div
                className="college-hero"
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className="college-overlay">
                    <h1>{collegeName}</h1>
                    <h3><span className="location-icon"><svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M12.2848 18.9935C12.1567 19.0875 12.0373 19.1728 11.9282 19.2493C11.8118 19.1721 11.6827 19.0833 11.5427 18.9832C10.8826 18.5109 10.0265 17.8176 9.18338 16.9529C7.45402 15.1792 6 12.9151 6 10.5C6 7.18629 8.68629 4.5 12 4.5C15.3137 4.5 18 7.18629 18 10.5C18 12.8892 16.4819 15.1468 14.6893 16.9393C13.8196 17.8091 12.9444 18.5099 12.2848 18.9935ZM19.5 10.5C19.5 16.5 12 21 12 21C11.625 21 4.5 16.5 4.5 10.5C4.5 6.35786 7.85786 3 12 3C16.1421 3 19.5 6.35786 19.5 10.5ZM13.5 10.5C13.5 11.3284 12.8284 12 12 12C11.1716 12 10.5 11.3284 10.5 10.5C10.5 9.67157 11.1716 9 12 9C12.8284 9 13.5 9.67157 13.5 10.5ZM15 10.5C15 12.1569 13.6569 13.5 12 13.5C10.3431 13.5 9 12.1569 9 10.5C9 8.84315 10.3431 7.5 12 7.5C13.6569 7.5 15 8.84315 15 10.5Z" fill="#ffffff"></path> </g></svg></span>{college?.city || "Location not available"}
                    </h3>
                </div>
            </div>

            {/* === Main Content === */}
            <main className="college-main">
                <section className="college-left">
                    <h2> <span className="highlightin">{totalReviews}</span> Students Reviewed <span className="highlightin">{totalPGs}</span> PGs near {college?.short_name || collegeName}</h2>

                    <p id='descrip'>Click on a dorm below to write a review</p>

                    {/* Search & Filter */}
                    <PgControls
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        minRating={minRating}
                        setMinRating={setMinRating}
                        sortOption={sortOption}
                        setSortOption={setSortOption}
                        genderType={genderType}
                        setGenderType={setGenderType}
                        hasFood={hasFood}
                        setHasFood={setHasFood}
                        disabled={loadingPGs}
                    />

                    <div className="pg-list">
                        {(loadingPGs || loadingWishlist) ? (
                            Array.from({ length: 3 }).map((_, idx) => (
                                <SkeletonCollegePgCard key={idx} />
                            ))
                        ) : filteredPGs.length > 0 ? (
                            filteredPGs.map((pg, idx) => (
                                <CollegePgCard
                                    key={pg.id || idx}
                                    id={pg.id}
                                    name={pg.name}
                                    gender_type={pg.gender_type || null}
                                    rating={pg.avg_rating || 0}
                                    reviews={pg.review_count || 0}
                                    image={pg.image}
                                    user={user}
                                    isWishlisted={wishlistIds.includes(pg.id)}
                                    onLoginRequired={() => setShowLoginModal(true)}
                                />
                            ))
                        ) : (
                            <p>No PGs match your search or filters. Try adjusting your criteria or <span id='addpg' onClick={handleAddHostelClick}>Add One</span>.</p>
                        )}
                    </div>
                </section>

                <aside className="college-right">
                    <div className="forums">
                        <h2>💬 Discussions & Forums</h2>
                        <ul className="forum-list">
                            <li><a href="#">"Best PGs for girls in North Campus?"</a></li>
                            <li><a href="#">"Mess food reviews - what's edible?"</a></li>
                            <li><a href="#">"Looking for budget PG with AC?"</a></li>
                            <li><a href="#">"Roommate horror stories 😬"</a></li>
                        </ul>
                    </div>

                    <div className="add-hostel-card">
                        <h3>Want to review a hostel not listed?</h3>
                        <p>We got you, roomie.</p>
                        <button onClick={handleAddHostelClick}>Add Hostel</button>
                    </div>
                </aside>
            </main>

            {showAddModal && college?.id && (
                <AddHostelModal
                    key={resetKey} // forces full remount
                    onClose={(submitted = false) => {
                        setShowAddModal(false);

                        if (submitted) {
                            setTimeout(() => {
                                setResetKey(Date.now());
                                setShowAddModal(true);
                            }, 110);
                        }
                    }}
                    defaultCollegeId={college.id}
                />
            )}

            {showLoginModal && (
                <LoginModal
                    siteName={siteName}
                    onClose={() => setShowLoginModal(false)}
                />
            )}


            <Footer />
        </div>
    );
};

export default CollegePage;
