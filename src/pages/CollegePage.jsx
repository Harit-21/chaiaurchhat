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
import DataCache from '../cache/DataCache';
import SkeletonCollegePgCard from '../components/cardloader/SkeletonCollegePgCard';

const CollegePage = () => {
    const { collegeName } = useParams();

    const [pgList, setPgList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
    const [minRating, setMinRating] = useState(parseFloat(searchParams.get("rating") || 0));
    const [sortOption, setSortOption] = useState(searchParams.get("sort") || "");
    const [genderType, setGenderType] = useState(searchParams.get("gender") || "");
    const [hasFood, setHasFood] = useState(searchParams.get("food") || "");
    const [wishlist, setWishlist] = useState([]);

    const [initialLoad, setInitialLoad] = useState(true);

    const [college, setCollege] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
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

    useEffect(() => {
        const collegeCacheKey = `college-${collegeName}`;
        const cachedCollege = DataCache.get(collegeCacheKey, {
            backgroundRefresh: true,
            fetcher: () =>
                fetch(`${apiUrl}/college/${encodeURIComponent(collegeName)}`)
                    .then(res => res.json())
                    .then(data => {
                        setCollege(data);
                        return data;
                    })
                    .catch(err => {
                        console.error("Error fetching college:", err);
                        return null;
                    })
        });

        if (cachedCollege) {
            setCollege(cachedCollege);
        } else {
            // fallback in case cache and background fail
            fetch(`${apiUrl}/college/${encodeURIComponent(collegeName)}`)
                .then(res => res.json())
                .then(data => {
                    setCollege(data);
                    DataCache.set(collegeCacheKey, data);
                })
                .catch(err => {
                    console.error("Failed to fetch college:", err);
                });
        }
    }, [collegeName]);



    // === API call to your Flask backend ===
    useEffect(() => {
        if (!college?.id) return;

        const pgListKey = `pgs-for-${collegeName}`;
        const cachedPgList = DataCache.get(pgListKey, {
            backgroundRefresh: true,
            fetcher: () =>
                fetch(`${apiUrl}/pgs?college_id=${encodeURIComponent(college.id)}`)
                    .then(res => res.json())
                    .then(data => {
                        const pgArray = Array.isArray(data) ? data : [];
                        setPgList(pgArray);
                        return pgArray;
                    })
        });

        if (cachedPgList) {
            setPgList(cachedPgList);
            setLoading(false);
            setTimeout(() => setInitialLoad(false), 100);
        } else {
            // fallback in case fetcher fails completely
            setLoading(true);
            fetch(`${apiUrl}/pgs?college_id=${encodeURIComponent(college.id)}`)
                .then(res => res.json())
                .then(data => {
                    const pgArray = Array.isArray(data) ? data : [];
                    setPgList(pgArray);
                    DataCache.set(pgListKey, pgArray);
                })
                .catch(error => {
                    console.error("❌ Error fetching PGs:", error);
                    setPgList([]);
                })
                .finally(() => {
                    setLoading(false);
                    setTimeout(() => setInitialLoad(false), 100);
                });
        }
    }, [college]);


    // === Filtering & Sorting ===
    const filteredPGs = pgList
        .filter(pg =>
            pg.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
            // || pg.gender_type?.toLowerCase().includes(debouncedSearch.toLowerCase())
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


    useEffect(() => {
        const params = {};

        if (debouncedSearch) params.q = debouncedSearch;
        if (minRating) params.rating = minRating;
        if (sortOption) params.sort = sortOption;
        if (genderType) params.gender = genderType;
        if (hasFood) params.food = hasFood;

        setSearchParams(params, { replace: true });
    }, [debouncedSearch, minRating, sortOption, genderType, hasFood]);

    // Fetch wishlist on load
    useEffect(() => {
        if (!user) return;

        fetch(`${apiUrl}/wishlist?email=${user.email}`)
            .then(res => res.json())
            .then(data => {
                const wishlistPGIds = data.map(item => item.pg_id);
                setWishlist(wishlistPGIds);
            })
            .catch(err => {
                console.error("Failed to fetch wishlist", err);
                setWishlist([]); // fallback to empty array
            });
    }, [user]);


    const totalReviews = filteredPGs.reduce((sum, pg) => sum + (pg.review_count || 0), 0);
    const totalPGs = filteredPGs.length;
    const backgroundImage = college?.image?.trim() || "https://images.unsplash.com/20/cambridge.JPG";

    if (initialLoad) return <FullPageLoader />;


    return (
        <div className="college-page-wrapper">
            <Helmet>
                <title>{college.short_name} | {siteName}</title>
                <meta name="description" content="Find honest PG & hostel reviews by students. Explore trending PGs near institutions with real ratings and feedback." />
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
                        disabled={loading}
                    />

                    <div className="pg-list">
                        {(loading || wishlist === null)
                            ? Array.from({ length: 4 }).map((_, idx) => (
                                <SkeletonCollegePgCard key={idx} />
                            ))
                            : filteredPGs.length > 0
                                ? filteredPGs.map((pg, idx) => (
                                    <CollegePgCard
                                        key={pg.id || idx}
                                        id={pg.id}
                                        name={pg.name}
                                        gender_type={pg.gender_type || null}
                                        rating={pg.avg_rating || 0}
                                        reviews={pg.review_count || 0}
                                        image={pg.image}
                                        user={user}
                                        isWishlisted={wishlist.includes(pg.id)}
                                        onLoginRequired={() => setShowLoginModal(true)}
                                    />
                                ))
                                : <p>No PGs. Try adjusting your criteria or <span id='addpg' onClick={handleAddHostelClick}>Add One</span>.</p>
                        }
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
                    onClose={() => setShowAddModal(false)}
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
