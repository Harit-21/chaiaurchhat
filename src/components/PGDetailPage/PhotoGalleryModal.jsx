// components/PGDetailPage/PhotoGalleryModal.jsx
import React, { useState, useEffect } from 'react';
import '../../css/PGDetail/PhotoGalleryModal.css';
// You can use the same CSS from the wallpapers project

const FILTER_TAGS = ['Bed', 'Desk', 'Bathroom', 'Kitchen', 'Food', 'Balcony', 'Room View', 'Common Area'];

const PhotoGalleryModal = ({ images, onClose }) => {
  const [activeFilter, setActiveFilter] = useState('');
  const [filteredImages, setFilteredImages] = useState(images || []);

  useEffect(() => {
    applyFilters();
  }, [activeFilter, images]);

  const applyFilters = () => {
    if (!activeFilter) {
      setFilteredImages(images);
      return;
    }

    const query = activeFilter.toLowerCase();
    const result = images.filter((img) => {
      const tags = (img.tags || []).join(' ').toLowerCase();
      return tags.includes(query);
    });

    setFilteredImages(result);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('photo-gallery-overlay')) {
      onClose();
    }
  };

  return (
    <div className="photo-gallery-overlay" onClick={handleOverlayClick}>
      <div className="photo-gallery-modal">
        <div className="gallery-header">
          <div className="filter-buttons">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                className={`filter-btn ${activeFilter === tag ? 'active' : ''}`}
                onClick={() => setActiveFilter(activeFilter === tag ? '' : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="gallery-content">
          {filteredImages.length > 0 ? (
            <div className="gallery-grid">
              {filteredImages.map((img, idx) => (
                <div key={idx} className="gallery-item">
                  <img src={img.url} alt={img.caption || `Photo ${idx}`} />
                  {img.caption && (
                    <div className="image-caption">{img.caption}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-results">No matching photos found.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default PhotoGalleryModal;
