import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Card from '../components/Card';
import MiniCard from '../components/MiniCard';
import '../css/Home.css';
import CollegeModal from '../components/CollegeModal';
import { apiUrl } from '../api';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  const navigate = useNavigate();
  const [homepageColleges, setHomepageColleges] = useState([]);
  const [homepagePGs, setHomepagePGs] = useState([]);

  const [searchColleges, setSearchColleges] = useState([]);
  const [searchPGs, setSearchPGs] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [filterMode, setFilterMode] = useState('both');
  const [filters, setFilters] = useState({
    college: true,
    pg: true,
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allColleges, setAllColleges] = useState([]);

  const siteName = import.meta.env.VITE_CAC_SITE_NAME;

  // Fetch homepage data once on mount
  useEffect(() => {
    fetch(`${apiUrl}/colleges?select=*`)
      .then(res => res.json())
      .then(data => {
        setAllColleges(data);
        setHomepageColleges(data.slice(0, 7)); // Optional: first 9 for homepage
      })
      .catch(e => {
        console.error("Colleges fetch error:", e);
        setAllColleges([]);
        setHomepageColleges([]);
      });

    fetch(`${apiUrl}/trending-pgs`)
      .then(res => res.json())
      .then(data => setHomepagePGs(data))
      .catch(e => {
        console.error("PGs fetch error:", e);
        setHomepagePGs([]);
      });
  }, []);

  useEffect(() => {
    if (filterMode === 'college') {
      setFilters({ college: true, pg: false });
    } else if (filterMode === 'pg') {
      setFilters({ college: false, pg: true });
    } else {
      setFilters({ college: true, pg: true });
    }
  }, [filterMode]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setSearchQuery(q);
  }, [location.search]);

  // Sanitize search input to prevent injection-like issues
  function sanitizeInput(input) {
    return input
      .trim()
      .replace(/[;,.'"\\]/g, "") // remove quotes, semicolon, backslash
      .replace(/\s+/g, " ");   // normalize spaces
  }

  // Effect: perform search with debounce + sanitization
  useEffect(() => {
    // Trimmed check: if empty, clear results & stop search
    if (!searchQuery.trim()) {
      setSearchColleges([]);
      setSearchPGs([]);
      setLoadingSearch(false);
      navigate("/", { replace: true });
      return; // Exit early, no fetch or timers
    }

    const controller = new AbortController();

    const delayDebounce = setTimeout(() => {
      const sanitizedQuery = sanitizeInput(searchQuery);

      setLoadingSearch(true);
      navigate(`/?q=${encodeURIComponent(sanitizedQuery)}`, { replace: true });

      fetch(`${apiUrl}/search?q=${encodeURIComponent(sanitizedQuery)}`, {
        signal: controller.signal,
      })
        .then(res => res.json())
        .then(data => {
          setSearchColleges(data.colleges || []);
          setSearchPGs(data.pgs || []);
          setLoadingSearch(false);
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error("Search error:", err);
            setLoadingSearch(false);
          }
        });
    }, 450); // debounce delay

    return () => {
      controller.abort();
      clearTimeout(delayDebounce);
    };
  }, [searchQuery]);


  return (
    <div className="page-wrapper">

      <Helmet>
        <title>Home | {siteName}</title>
        <meta name="description" content="Find honest PG & hostel reviews by students. Explore trending PGs near institutions with real ratings and feedback." />
      </Helmet>

      <Header />

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <h2>
            Find Honest Hostel & PG Reviews <span>🔥</span>
          </h2>
          <p>
            No Bakwaas, Only Sach. Reviews from students, for students. Khaas baatein, asli experience.
          </p>

          <div>
            <button onClick={() => setIsModalOpen(true)} className="alma-button">
              All Institutes List
            </button>
          </div>

          {/* 🔍 Live Search Results */}
          <div className="search-wrapper">
            <div className="segmented-toggle">
              <span className={`slider ${filterMode}`}></span>

              <button
                className={`segment ${filterMode === 'college' ? 'active' : ''}`}
                onClick={() => setFilterMode('college')}
              >
                🎓Inst.
              </button>
              <button
                className={`segment ${filterMode === 'both' ? 'active' : ''}`}
                onClick={() => setFilterMode('both')}
              >
                +Both+
              </button>
              <button
                className={`segment ${filterMode === 'pg' ? 'active' : ''}`}
                onClick={() => setFilterMode('pg')}
              >
                🏠PGs
              </button>
            </div>
            <input
              type="search"
              placeholder="Search by college, city, or PG name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar"
            />

            {searchQuery.trim() !== '' && (
              <div className="autocomplete-dropdown">
                {loadingSearch ? (
                  <div className="autocomplete-item">Loading...</div>
                ) : (
                  <>
                    {/* 🎓 College results */}
                    {filters.college && searchColleges.length > 0 && (
                      <>
                        <div className="autocomplete-group-label">🎓 Colleges</div>
                        {searchColleges.map((college, idx) => (
                          <div
                            key={college.id || idx}
                            className="autocomplete-item"
                            onClick={() => navigate(`/college/${college.name}`)}
                          >
                            <span className="autocomplete-title">{college.name}</span>
                            <span className="autocomplete-subtext">{college.city}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* 🏠 PG results */}
                    {filters.pg && searchPGs.length > 0 && (
                      <>
                        <div className="autocomplete-group-label">🏠 PGs</div>
                        {searchPGs.map((pg, idx) => (
                          <div
                            key={pg.id || idx}
                            className="autocomplete-item"
                            onClick={() => navigate(`/college/${pg.college_name}/pg/${pg.name}`)}
                          >
                            <span className="autocomplete-title">{pg.name}</span>
                            <span className="autocomplete-subtext">{pg.college_short_name}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* ❌ No results logic */}
                    {(
                      (filters.college && searchColleges.length === 0 && !filters.pg) ||
                      (filters.pg && searchPGs.length === 0 && !filters.college) ||
                      (filters.college && filters.pg && searchColleges.length === 0 && searchPGs.length === 0)
                    ) && (
                        <div className='ai-nr'>No results found.</div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Popular Colleges */}
        <h3 className="section-heading">🎓 Popular Colleges</h3>
        <section className='trendycol'>
          <div className="popular-colleges">
            {homepageColleges.map((college, idx) => (
              <MiniCard
                key={college.id || idx}
                name={college.name}
                city={college.city}
                image={`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(college.name.replace(/\s/g, '') + Math.random().toString(36).substring(2, 6))}`}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Trending PGs */}
      <section className="trendy">
        <h3 className="section-heading">🏠 Trending PGs This Week</h3>
        <div className="trending-pgs">
          {homepagePGs.map((pg, idx) => (
            <div key={pg.id || idx}>
              <Card
                key={pg.id || idx}
                name={pg.name}
                location={pg.location || pg.college_city}
                rating={pg.avg_rating}
                reviews={pg.review_count}
                image={pg.image}
                college={pg.college_name}
              />
            </div>
          ))}
        </div>
      </section>

      <main className="main-content">
        {/* Budget Picks */}
        <h3 className="section-heading">💸 Budget Friendly Picks</h3>
        <section className='trendycol'>
          <div className="budget-picks">
            <Card
              name="Green Nest PG"
              location="Karol Bagh, Delhi"
              rating={3.9}
              reviews={12}
              image="https://images.unsplash.com/photo-1586105251261-72a756497a12?auto=format&fit=crop&w=600&q=80"
            />
            <Card
              name="Sunrise PG"
              location="Navi Mumbai"
              rating={4.0}
              reviews={9}
              image="https://images.unsplash.com/photo-1598928506311-c55ded4572ba?auto=format&fit=crop&w=600&q=80"
            />
            <Card
              name="Eco Stay Girls PG"
              location="South Campus, DU"
              rating={4.3}
              reviews={14}
              image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
            />
          </div>
        </section>

        <div className="section-container">

          <div className="blockx block-row">
            <div className="block-text">
              <h2>Reviews You Can Trust</h2>
              <p>See what real students say about facilities, food, safety, and more before you book.</p>
            </div>
            <img src="https://www.svgrepo.com/show/436510/people-29.svg" alt="PG Finder" />
          </div>

          <br />

          <div className="blockx block-row-reverse">
            <img src="https://www.svgrepo.com/show/475067/building-dome.svg" alt="PG Finder" />
            <div className="block-text">
              <h2>Find the Perfect PG</h2>
              <p>Explore student-rated hostels and PGs near your college with verified reviews and real photos.</p>
            </div>
          </div>

        </div>


        {/* Info Section */}
        <section className="info-section">
          <h3>Why {siteName}?</h3>
          <p>🎯 Find your college and explore real reviews of PGs & Hostels nearby.</p>
          <p>💬 Read genuine feedback from students—no paid marketing, just honest opinions.</p>
          <p>✍️ Stayed somewhere? Leave a review to help others make smarter choices.</p>
        </section>
      </main>


      {
        isModalOpen && (
          <CollegeModal colleges={allColleges} onClose={() => setIsModalOpen(false)} />
        )
      }

      <Footer />

    </div >
  );
};

export default Home;
