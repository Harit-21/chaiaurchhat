import React, { useState, useEffect, useRef } from 'react';
import '../css/PGDetail/FancyReviewForm.css';
import { useAuth } from '../pages/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ratingLabels = {
    1: 'Poor',
    2: 'Okay',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
};

const emojiRating = {
    1: '😐',
    2: '😌',
    3: '😃',
    4: '😍',
    5: '🤩',
};

const FancyReviewForm = ({ pgName, onClose, step, setStep, pgMetadata, existingReview, onSave }) => {
    const { user } = useAuth();
    const hasFood = pgMetadata?.has_food;

    // Internal controlled step management
    const [internalStep, setInternalStep] = useState(step || 1);
    useEffect(() => {
        if (step !== undefined && step !== internalStep) {
            setInternalStep(step);
        }
    }, [step]);

    const setStepWrapper = (s) => {
        setInternalStep(s);
        if (setStep) setStep(s);
    };
    const [ratings, setRatings] = useState({
        room: 0,
        food: 0,
        cleanliness: 0,
        safety: 0,
        location: 0,
        warden: 0,
    });


    const categoryOrder = hasFood
        ? ['room', 'food', 'cleanliness', 'safety', 'location', 'warden']
        : ['room', 'cleanliness', 'safety', 'location', 'warden'];

    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const category = categoryOrder[currentCategoryIndex];


    const handleRating = (value) => {
        setRatings(prev => ({ ...prev, [category]: value }));

        // Animate next section glow
        const nextIndex = currentCategoryIndex + 1;
        if (nextIndex < categoryOrder.length) {
            setTimeout(() => {
                setCurrentCategoryIndex(nextIndex);
            }, 400);
        } else {
            setTimeout(() => {
                setStepWrapper(2);
            }, 500);
        }
    };

    const [comment, setComment] = useState('');
    const [sentiment, setSentiment] = useState('Neutral');

    useEffect(() => {
        // Simple mock sentiment analysis (for demo purposes)
        const lower = comment.toLowerCase();
        if (lower.includes('bad') || lower.includes('dirty') || lower.includes('worst')) {
            setSentiment('Negative');
        } else if (lower.includes('great') || lower.includes('clean') || lower.includes('amazing')) {
            setSentiment('Positive');
        } else {
            setSentiment('Neutral');
        }
    }, [comment]);

    useEffect(() => {
        if (existingReview) {
            setRatings({
                room: existingReview.rating_room,
                food: existingReview.rating_food,
                cleanliness: existingReview.rating_cleanliness,
                safety: existingReview.rating_safety,
                location: existingReview.rating_location,
                warden: existingReview.rating_warden,
            });
            setComment(existingReview.comment || '');
            setClassYears(existingReview.class_years || []);
            setRoomType(existingReview.room_type || '');
            setRentOpinion(existingReview.rent_opinion || '');
            setHappinessLevel(existingReview.happiness_level || '');
            setTags(existingReview.tags || []);
            setImages(existingReview.images || []);
        }
    }, []); // <- only on mount


    const [images, setImages] = useState([]);
    const fileInputRef = useRef();
    const MAX_IMAGES = 7;

    // Optional: for visual error messages (replace alert if needed)
    const [uploadError, setUploadError] = useState('');

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const existingKeys = images.map(img => img.file.name + img.file.size);
        const newUploads = [];
        let error = ''; // Temp error tracker

        for (let file of files) {
            const fileKey = file.name + file.size;

            if (existingKeys.includes(fileKey)) {
                error = `You've already added "${file.name}"`;
                continue;
            }

            if (images.length + newUploads.length >= MAX_IMAGES) {
                error = 'You can upload a maximum of 7 images.';
                break;
            }

            newUploads.push({
                file,
                url: URL.createObjectURL(file),
                caption: '',
                tagPrompt: 'What does this photo show?',
            });
        }

        if (newUploads.length > 0) {
            setImages(prev => [...prev, ...newUploads]);
            setUploadError(''); // Clear previous error
        } else if (error) {
            setUploadError(error);
        }

        // Reset file input so same file can be chosen again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    const [roomType, setRoomType] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        const reviewData = {
            pgName,
            name: user?.displayName || "Anonymous",
            userEmail: user?.email || null,
            ratings,
            comment,
            sentiment,
            classYears,
            roomType,
            hasFood,
            rentOpinion,
            happinessLevel,
            tags,
            images: images.map(img => ({
                caption: img.caption,
                // This is currently a local blob URL. You’ll need to upload to Supabase storage
                url: img.url
            })),
            rating_room: ratings.room,
            rating_food: hasFood ? ratings.food : null,
            rating_cleanliness: ratings.cleanliness,
            rating_safety: ratings.safety,
            rating_location: ratings.location,
            rating_warden: ratings.warden,
        };

        const endpoint = existingReview?.id
            ? 'http://localhost:5000/review/update'
            : 'http://localhost:5000/review/submit';

        const payload = {
            ...reviewData,
            review_id: existingReview?.id || null,
        };

        fetch(endpoint, {
            method: existingReview?.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    toast.success('Review submitted successfully!');
                    setSubmitted(true);

                    onSave?.({
                        ...existingReview,
                        ...payload,
                        id: response.updatedId || existingReview?.id,
                    });
                } else {
                    console.error('Review submission failed:', response.error);
                    toast.error('Review submission failed.');
                }
            })
            .catch(err => {
                console.error('Request failed:', err);
                toast.error('Something went wrong. Please try again.');
            });
    };

    const [classYears, setClassYears] = useState([]);
    const [rentOpinion, setRentOpinion] = useState('');
    const [happinessLevel, setHappinessLevel] = useState('');
    const [tags, setTags] = useState([]);

    const tagOptions = [
        'Clean', 'Affordable', 'Wifi', 'Safe',
        'Peaceful', 'Friendly Staff', 'Spacious', 'Good Food'
    ];

    return (
        <div className="fancy-review-form">

            {internalStep === 1 && (
                <div className="meta-step">
                    <h2>Tell us about your stay</h2>

                    {/* Class Year */}
                    <div className="meta-section">
                        <h3>Your Class Year(s) <span className='multipleselect'>Multiple can be selected</span> </h3>
                        <div className="option-group">
                            {['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'].map(year => (
                                <button
                                    key={year}
                                    className={`option-btn ${classYears.includes(year) ? 'selected' : ''}`}
                                    onClick={() => {
                                        setClassYears(prev =>
                                            prev.includes(year)
                                                ? prev.filter(y => y !== year)
                                                : [...prev, year]
                                        );
                                    }}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Room Type */}
                    <div className="meta-section">
                        <h3>Room Type</h3>
                        <div className="option-group">
                            {['Single', 'Double', 'Triple', 'Quad', 'Suite'].map(rt => (
                                <button
                                    key={rt}
                                    className={`option-btn ${roomType === rt ? 'selected' : ''}`}
                                    onClick={() => setRoomType(rt)}
                                >
                                    {rt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gender Type */}
                    {/* <div className="meta-section">
                        <h3>Type of PG</h3>
                        <div className="option-group">
                            {['Boys', 'Girls', 'Co-ed'].map(g => (
                                <button
                                    key={g}
                                    className={`option-btn ${genderType === g ? 'selected' : ''}`}
                                    onClick={() => setGenderType(g)}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div> */}

                    {/* Food Provided */}
                    {/* <div className="meta-section">
                        <h3>Is Food Provided?</h3>
                        <div className="option-group">
                            {['Yes', 'No'].map(fp => (
                                <button
                                    key={fp}
                                    className={`option-btn ${foodProvided === fp ? 'selected' : ''}`}
                                    onClick={() => setFoodProvided(fp)}
                                >
                                    {fp}
                                </button>
                            ))}
                        </div>
                    </div> */}

                    {/* Rent Opinion */}
                    <div className="meta-section">
                        <h3>What do you think about the rent?</h3>
                        <div className="option-group">
                            {['Low', 'Reasonable', 'High'].map(opinion => (
                                <button
                                    key={opinion}
                                    className={`option-btn ${rentOpinion === opinion ? 'selected' : ''}`}
                                    onClick={() => setRentOpinion(opinion)}
                                >
                                    {opinion}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Overall Happiness */}
                    <div className="meta-section">
                        <h3>Alright — Are you really happy there?</h3>
                        <div className="option-group">
                            {['Yes', 'No', 'Just Fine'].map(level => (
                                <button
                                    key={level}
                                    className={`option-btn ${happinessLevel === level ? 'selected' : ''}`}
                                    onClick={() => setHappinessLevel(level)}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>



                    <button id='form-next'
                        disabled={!classYears.length || !roomType || !rentOpinion || !happinessLevel}
                        onClick={() => setStepWrapper(2)}
                    >
                        Next
                    </button>
                </div>
            )}

            {internalStep === 2 && (
                <div className="rating-step">
                    <h2>Rate your experience</h2>

                    {['room', 'cleanliness', 'safety', 'location', ...(hasFood ? ['food'] : []), 'warden'].map((category) => (
                        <div key={category} className="category-rating">
                            <h3>Rate the {category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                            <div className="stars-and-emojis">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <div
                                        key={star}
                                        className={`star-wrapper ${ratings[category] >= star ? 'selected' : ''}`}
                                        title={ratingLabels[star]}
                                        onClick={() => setRatings(prev => ({ ...prev, [category]: star }))}
                                    >
                                        <span className="emoji">{emojiRating[star]}</span>
                                        <span className="star">★</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button id='form-next'
                        onClick={() => setStepWrapper(3)}
                        disabled={
                            !ratings.room ||
                            !ratings.cleanliness ||
                            !ratings.safety ||
                            !ratings.location ||
                            !ratings.warden ||
                            (hasFood && !ratings.food)
                        }
                    >
                        Next
                    </button>
                </div>
            )}

            {internalStep === 3 && (
                <div className="comment-step">
                    <h2>Write About Your Experience</h2>

                    <div className="prompts">
                        <p>💬 What surprised you most about your room?</p>
                        <p>💡 Would you stay here again? Why or why not?</p>
                    </div>

                    <textarea
                        className="reviewcomment-textarea"
                        placeholder="Kripaya do shabd kahe... ya zyada kahenge to ati prasann"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={5}
                    />

                    <div className="comment-tools">
                        <span className={`word-count ${comment.length < 11 ? 'warn' : 'ok'}`}>
                            {comment.length}/11
                        </span>
                        <span className={`sentiment ${sentiment.toLowerCase()}`}>
                            Sentiment: {sentiment}
                        </span>
                    </div>

                    {/* ✅ New Tag Selection Section */}
                    <div className="tag-selection">
                        <h4>Add tags to your review</h4>
                        <div className="tag-list">
                            {tagOptions.map(tag => (
                                <span
                                    key={tag}
                                    className={`tag ${tags.includes(tag) ? 'selected' : ''}`}
                                    onClick={() =>
                                        setTags(prev =>
                                            prev.includes(tag)
                                                ? prev.filter(t => t !== tag)
                                                : [...prev, tag]
                                        )
                                    }
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button id='form-next'
                        disabled={comment.length < 11}
                        onClick={() => setStepWrapper(4)}
                    >
                        Next
                    </button>
                </div>
            )}


            {internalStep === 4 && (
                <div className="photo-step">
                    <h2>Upload Photos</h2>
                    <p className="photo-tip">Drag and drop, or select images of your room, common areas, or view!</p>

                    <label className="photo-drop">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                        <span>📷 Got Cool Pictures!</span>
                    </label>

                    {uploadError && <div className="error-message">{uploadError}</div>}

                    <div className="photo-preview">
                        {images.map((img, idx) => (
                            <div className="photo-card" key={idx}>
                                <img src={img.url} alt={`Upload ${idx}`} />
                                <input
                                    type="text"
                                    placeholder="Add a caption..."
                                    value={img.caption}
                                    onChange={(e) => {
                                        const updated = [...images];
                                        updated[idx].caption = e.target.value;
                                        setImages(updated);
                                    }}
                                />
                                <span className="tag-prompt">{img.tagPrompt}</span>
                                <button
                                    className="remove-image"
                                    onClick={() =>
                                        setImages(prev => prev.filter((_, i) => i !== idx))
                                    }
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <button id='form-next' onClick={() => setStepWrapper(5)}>Next</button>
                </div>
            )}

            {internalStep === 5 && !submitted && (
                <div className="confirmation-step">
                    <h2>📝 Review Summary</h2>

                    <div className="summary-card">

                        {/* Meta Info */}
                        <div className="summary-item fade-in">
                            <strong>Class Year(s):</strong>&nbsp; {classYears.join(', ')}<br />
                            <strong>Room Type:</strong>&nbsp; {roomType}<br />
                            <strong>Food Provided:</strong>&nbsp; {hasFood ? 'Yes' : 'No'}<br />
                            <strong>Rent:</strong>&nbsp; {rentOpinion}<br />
                            <strong>You Happy:</strong>&nbsp; {happinessLevel}<br />
                            <button onClick={() => setStepWrapper(1)}>✏️ Edit</button>
                        </div>

                        {/* Ratings */}
                        <div className="summary-item fade-in">
                            <strong>Ratings:</strong>
                            <ul>
                                {Object.entries(ratings).map(([key, val]) => {
                                    if (key === 'food' && !hasFood) return null;
                                    return (
                                        <li key={key}>
                                            {key.charAt(0).toUpperCase() + key.slice(1)}:&nbsp; {val}<span id='summaryreview-star'>⭐</span>
                                        </li>
                                    );
                                })}
                            </ul>
                            <button onClick={() => setStepWrapper(2)}>✏️ Edit</button>
                        </div>

                        {/* Comment */}
                        <div className="summary-item fade-in">
                            <strong>Your Comment:</strong>
                            <p>{comment}</p>
                            <p><em>Sentiment: {sentiment}</em></p>
                            <button onClick={() => setStepWrapper(3)}>✏️ Edit</button>
                        </div>

                        <div className="summary-item fade-in">
                            <strong>Tags: </strong>
                            {tags.length > 0 ? tags.map(tag => <span key={tag}>#{tag} </span>) : 'None'}
                            <button onClick={() => setStepWrapper(3)}>✏️ Edit</button>
                        </div>


                        {/* Photos */}
                        <div className="summary-item fade-in">
                            <strong>Photos Uploaded:</strong>
                            <p>{images.length} photo(s) {images.length >= 3 && <span className="badge">📸 Photo Pro</span>}</p>
                            <button onClick={() => setStepWrapper(4)}>✏️ Edit</button>
                        </div>
                    </div>

                    {existingReview?.id && (
                        <p style={{ color: 'orange', marginTop: '10px' }}>
                            ⚠️ Editing your review will reset helpful votes to 0.
                        </p>
                    )}
                    <button className="submit-button" onClick={handleSubmit}>
                        ✅ Submit Review
                    </button>
                </div>
            )}

            {submitted && (
                <div className="thanks-step">
                    <h2>🎉 Thank you{user?.displayName ? `, ${user.displayName}` : ''}!</h2>
                    <p>Your review has been submitted successfully. You're helping more students make smarter choices! 💯</p>
                    <button onClick={onClose}>Close</button>
                </div>
            )}



        </div>
    );
};

export default FancyReviewForm;
