import React, { useState } from 'react';
import '../css/PGDetail/Reviewform.css';

const MultiStepReviewForm = ({ pgName, onClose }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        room: 0,
        food: 0,
        cleanliness: 0,
        safety: 0,
        comment: '',
        images: [],
        classYears: [],
        roomType: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleRating = (category, value) => {
        setFormData(prev => ({ ...prev, [category]: value }));
        // auto-advance to next category
        const next = { room: 'food', food: 'cleanliness', cleanliness: 'safety' };
        if (next[category]) setTimeout(() => setStep(s => s + 1), 300);
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const imageUrls = files.map(file => URL.createObjectURL(file));
        setFormData(prev => ({ ...prev, images: imageUrls }));
    };

    const handleCheckbox = (year) => {
        setFormData(prev => {
            const updated = prev.classYears.includes(year)
                ? prev.classYears.filter(y => y !== year)
                : [...prev.classYears, year];
            return { ...prev, classYears: updated };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => onClose?.(), 2000);
    };

    const isRatingsComplete = formData.room && formData.food && formData.cleanliness && formData.safety;
    const isCommentValid = formData.comment.length >= 75;
    const isMetaComplete = formData.classYears.length > 0 && formData.roomType;

    return (
        <div className="multi-review-form">
            {step === 1 && (
                <div>
                    <h3>Rate the Room</h3>
                    <RatingStars value={formData.room} onChange={val => handleRating('room', val)} />
                    {formData.room > 0 && (
                        <>
                            <h3>Rate the Food</h3>
                            <RatingStars value={formData.food} onChange={val => handleRating('food', val)} />
                        </>
                    )}
                    {formData.food > 0 && (
                        <>
                            <h3>Rate the Cleanliness</h3>
                            <RatingStars value={formData.cleanliness} onChange={val => handleRating('cleanliness', val)} />
                        </>
                    )}
                    {formData.cleanliness > 0 && (
                        <>
                            <h3>Rate the Safety</h3>
                            <RatingStars value={formData.safety} onChange={val => handleRating('safety', val)} />
                        </>
                    )}
                    {isRatingsComplete && <button onClick={() => setStep(2)}>Next</button>}
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3>Write a Comment</h3>
                    <textarea
                        placeholder="Share your full experience (at least 75 characters)..."
                        value={formData.comment}
                        onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    />
                    <h4>Upload Photos</h4>
                    <input type="file" multiple onChange={handleImageUpload} />
                    <div className="preview-images">
                        {formData.images.map((img, idx) => (
                            <img key={idx} src={img} alt="upload" />
                        ))}
                    </div>
                    {isCommentValid && <button onClick={() => setStep(3)}>Next</button>}
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3>Class Year</h3>
                    {['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'].map(year => (
                        <label key={year}>
                            <input
                                type="checkbox"
                                checked={formData.classYears.includes(year)}
                                onChange={() => handleCheckbox(year)}
                            />
                            {year}
                        </label>
                    ))}
                    <h3>Room Type</h3>
                    <select
                        value={formData.roomType}
                        onChange={e => setFormData(prev => ({ ...prev, roomType: e.target.value }))}
                    >
                        <option value="">Select</option>
                        <option>Single</option>
                        <option>Double</option>
                        <option>Triple</option>
                        <option>Quad</option>
                        <option>Suite</option>
                    </select>
                    {isMetaComplete && <button onClick={() => setStep(4)}>Next</button>}
                </div>
            )}

            {step === 4 && (
                <div>
                    <h3>Confirm & Submit</h3>
                    <ul>
                        <li>Room: {formData.room} ★</li>
                        <li>Food: {formData.food} ★</li>
                        <li>Cleanliness: {formData.cleanliness} ★</li>
                        <li>Safety: {formData.safety} ★</li>
                        <li>Room Type: {formData.roomType}</li>
                        <li>Years: {formData.classYears.join(', ')}</li>
                    </ul>
                    <p><strong>Comment:</strong> {formData.comment.slice(0, 150)}...</p>
                    <button onClick={handleSubmit}>Submit Review</button>
                    {submitted && <p style={{ marginTop: '1rem' }}>Thanks! 🎉 Review submitted.</p>}
                </div>
            )}
        </div>
    );
};

const RatingStars = ({ value, onChange }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`star ${hover >= star || value >= star ? 'filled' : ''}`}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(star)}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default MultiStepReviewForm;
