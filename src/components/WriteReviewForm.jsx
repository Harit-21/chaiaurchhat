import React, { useState } from 'react';

const WriteReviewForm = () => {
    const [images, setImages] = useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const imageUrls = files.map(file => URL.createObjectURL(file));
        setImages(imageUrls);
    };

    return (
        <section className="pg-write-review">
            <h3>✍️ Write a Review</h3>
            <form>
                <input type="text" placeholder="Your Name (optional)" />
                <select>
                    <option>Rating</option>
                    {[5, 4, 3, 2, 1].map(r => (
                        <option key={r} value={r}>{r} stars</option>
                    ))}
                </select>
                <select>
                    <option>Room Type</option>
                    <option>Single</option>
                    <option>Double</option>
                    <option>Triple</option>
                    <option>Shared</option>
                </select>
                <textarea placeholder="Write your experience..."></textarea>
                <label>Tags:</label>
                <div className="tag-checkboxes">
                    {['Clean', 'Food', 'Noise', 'WiFi', 'Mess'].map(tag => (
                        <label key={tag}><input type="checkbox" /> {tag}</label>
                    ))}
                </div>
                <input type="file" multiple onChange={handleFileChange} />
                <div className="preview-images">
                    {images.map((img, idx) => <img src={img} key={idx} alt="preview" />)}
                </div>
                <button type="submit">Submit Review</button>
            </form>
        </section>
    );
};

export default WriteReviewForm;
