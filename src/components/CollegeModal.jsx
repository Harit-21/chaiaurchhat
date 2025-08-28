import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/CollegeModal.css';

const CollegeModal = ({ colleges, onClose }) => {
  const navigate = useNavigate();
  const modalRef = useRef();
  const bodyRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20); // ⬅ Initial visible colleges
  const BATCH_SIZE = 20;

  // Sort alphabetically
  const sortedColleges = [...colleges].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const visibleColleges = sortedColleges.slice(0, visibleCount);

  useEffect(() => {
    setIsVisible(true);

    // Keyboard jump to letter
    const handleKey = (e) => {
      const char = e.key.toLowerCase();
      if (char.length === 1 && char.match(/[a-z]/i)) {
        const target = sortedColleges.find(college =>
          college.name.toLowerCase().startsWith(char)
        );
        if (target) {
          const el = document.getElementById(`college-${target.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    // Scroll to load more
    const handleScroll = () => {
      if (
        bodyRef.current &&
        bodyRef.current.scrollTop + bodyRef.current.clientHeight >=
        bodyRef.current.scrollHeight - 50
      ) {
        setVisibleCount((prev) =>
          Math.min(prev + BATCH_SIZE, sortedColleges.length)
        );
      }
    };

    document.addEventListener('keydown', handleKey);
    bodyRef.current?.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('keydown', handleKey);
      bodyRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, [sortedColleges]);

  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsVisible(false);
      setTimeout(() => onClose(), 0);
    }
  };

  return (
    <div className={`elite-modal-overlay ${isVisible ? 'show' : 'hide'}`} onClick={handleOverlayClick}>
      <div className="elite-modal-content" ref={modalRef}>
        <div className="elite-modal-header">
          <h2>Select Your Institute <span className='collegecount'>({colleges.length})</span></h2>
          <button className="elite-close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="elite-modal-body" ref={bodyRef}>
          {visibleColleges.map((college) => (
            <div
              key={college.id}
              id={`college-${college.id}`}
              className="elite-list-item"
              onClick={() => {
                navigate(`/college/${encodeURIComponent(college.name)}`);
                onClose();
              }}
            >
              <img
                className="elite-list-avatar"
                src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(
                  college.name.replace(/\s/g, '') + Math.random().toString(36).substring(2, 6)
                )}`}
                alt={`${college.name} avatar`}
              />
              <div className="elite-list-text">
                <span className="college-name">{college.name}</span>
                <span className="college-city">{college.city}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollegeModal;
