import React, { useState, useEffect, useRef } from 'react';
import '../css/PGDetail/FancyReviewForm.css';
import { useAuth } from '../pages/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiUrl } from '../api';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Constants
const ratingLabels = { 1: 'Poor', 2: 'Okay', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
const emojiRating = { 1: '😐', 2: '😌', 3: '😃', 4: '😍', 5: '🤩' };
const imageTagOptions = ['Bed', 'Desk', 'Bathroom', 'Kitchen', 'Food', 'Balcony', 'Room', 'Hostel', 'Mess'];
const tagOptions = ['Clean', 'Affordable', 'Wifi', 'Safe', 'Peaceful', 'Friendly Staff', 'Spacious', 'Good Food'];
const MIN_COMMENT_LENGTH = 11;
const MAX_COMMENT_LENGTH = 1100;
const MAX_IMAGES = 5;

// Custom hook for sentiment analysis
const useSentiment = (text) => {
  const [sentiment, setSentiment] = useState('Neutral');
  useEffect(() => {
    const lower = text.toLowerCase();
    if (lower.includes('bad') || lower.includes('dirty') || lower.includes('worst')) setSentiment('Negative');
    else if (lower.includes('great') || lower.includes('clean') || lower.includes('amazing')) setSentiment('Positive');
    else setSentiment('Neutral');
  }, [text]);
  return sentiment;
};

// Reusable StarRating Component
const StarRating = ({ category, rating, setRating }) => (
  <div className="category-rating">
    <h3>Rate the {category.charAt(0).toUpperCase() + category.slice(1)}</h3>
    <div className="stars-and-emojis">
      {[1, 2, 3, 4, 5].map(star => (
        <div
          key={star}
          className={`star-wrapper ${rating >= star ? 'selected' : ''}`}
          title={ratingLabels[star]}
          onClick={() => setRating(star)}
        >
          <span className="emoji">{emojiRating[star]}</span>
          <span className="star">★</span>
        </div>
      ))}
    </div>
  </div>
);

// Reusable OptionGroup Component for meta selections
const OptionGroup = ({ title, options, selected, onChange, multiple = false, description }) => (
  <div className="meta-section">
    <h3>{title} {description && <span className="multipleselect">{description}</span>}</h3>
    <div className="option-group">
      {options.map(option => (
        <button
          key={option}
          className={`option-btn ${multiple ? (selected.includes(option) ? 'selected' : '') : selected === option ? 'selected' : ''}`}
          onClick={() => {
            if (multiple) {
              onChange(prev => prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]);
            } else {
              onChange(option);
            }
          }}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

// ImageCard Component for displaying each uploaded image with tags, caption, remove button
const ImageCard = ({ img, deleting, onCaptionChange, onTagToggle, onRemove }) => (
  <div className={`photo-card ${deleting ? 'deleting' : ''}`}>
    <img src={img.url} alt="Uploaded preview" className={deleting ? 'deleting' : ''} />
    <input
      type="text"
      placeholder="Add a caption..."
      value={img.caption}
      onChange={e => onCaptionChange(img.fileId, e.target.value)}
      disabled={deleting}
    />
    <span className="tag-prompt">{img.tagPrompt}</span>
    <div className="image-tags">
      {imageTagOptions.map(tag => (
        <span
          key={tag}
          className={`image-tag ${img.imageTags?.includes(tag) ? 'selected' : ''}`}
          onClick={() => onTagToggle(img.fileId, tag)}
        >
          #{tag}
        </span>
      ))}
    </div>
    <button className="remove-image" onClick={() => !deleting && onRemove(img.fileId)} disabled={deleting}>
      {deleting ? '⏳' : '✕'}
    </button>
  </div>
);

const FancyReviewForm = ({ pgName, onClose, step, setStep, pgMetadata, existingReview, onSave }) => {
  const { user } = useAuth();
  const hasFood = pgMetadata?.has_food;
  const queryClient = useQueryClient();

  // Step management
  const [internalStep, setInternalStep] = useState(step || 1);
  useEffect(() => { if (step !== undefined && step !== internalStep) setInternalStep(step); }, [step]);
  const setStepWrapper = (s) => { setInternalStep(s); if (setStep) setStep(s); };

  // Ratings state
  const [ratings, setRatings] = useState({
    room: 0, food: 0, cleanliness: 0, safety: 0, location: 0, warden: 0,
  });

  // Meta information states
  const [classYears, setClassYears] = useState([]);
  const [roomType, setRoomType] = useState('');
  const [rentOpinion, setRentOpinion] = useState('');
  const [happinessLevel, setHappinessLevel] = useState('');
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const sentiment = useSentiment(comment);

  // Images management
  const [images, setImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState(() => {
    const stored = localStorage.getItem('pendingImageDeletions');
    return stored ? JSON.parse(stored) : [];
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef();
  const [deletingFileIds, setDeletingFileIds] = useState(new Set());

  // Initialization from existingReview
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (existingReview && !isInitialized) {
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
      setImages(
        (existingReview.images || []).map((img, i) => {
          const imageUrl = typeof img === 'string' ? img : img.url;
          return {
            file: { name: imageUrl.split('/').pop(), size: 999999 },
            url: imageUrl,
            fileId: typeof img === 'object' && img.fileId ? img.fileId : `existing-${i}`,
            caption: typeof img === 'object' && img.caption ? img.caption : '',
            tagPrompt: 'What does this photo show?',
            imageTags: typeof img === 'object' && img.imageTags ? img.imageTags : [],
            existing: true,
          };
        })
      );
      setIsInitialized(true);
    }
  }, [existingReview, isInitialized]);

  // Handle image uploads
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageUploading(true);
    const existingSignatures = new Set(images.map(img => {
      const name = img.originalName || img.file?.name || '';
      const size = img.originalSize || img.file?.size || 0;
      return `${name}-${size}`;
    }));
    const uploaded = [];
    let error = '';

    try {
      const res = await axios.get('http://localhost:5000/imagekit-auth');
      const auth = res.data;

      for (let file of files) {
        if (existingSignatures.has(`${file.name}-${file.size}`)) {
          error = `You've already added "${file.name}".`;
          continue;
        }
        if (images.length + uploaded.length >= MAX_IMAGES) {
          error = 'You can upload a maximum of 5 images.';
          break;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('folder', '/reviews');
        formData.append('publicKey', auth.publicKey);
        formData.append('signature', auth.signature);
        formData.append('expire', auth.expire);
        formData.append('token', auth.token);

        try {
          const response = await axios.post('https://upload.imagekit.io/api/v1/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10000,
          });
          const { url, fileId } = response.data;
          uploaded.push({ file, url, fileId, caption: '', tagPrompt: 'What does this photo show?', imageTags: [] });
        } catch (uploadError) {
          console.error('ImageKit Upload Failed:', uploadError);
          error = 'Failed to upload image.';
        }
      }

      if (uploaded.length > 0) {
        setImages(prev => [...prev, ...uploaded]);
        setUploadError('');
      } else if (error) setUploadError(error);
    } catch (err) {
      console.error("Failed to get ImageKit auth", err);
      toast.error("Auth fetch failed");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove image handler
  const handleRemoveImage = async (fileIdToRemove) => {
    const imageToRemove = images.find(img => img.fileId === fileIdToRemove);
    if (!imageToRemove) return;

    if (!imageToRemove.existing) {
      setDeletingFileIds(prev => new Set(prev).add(fileIdToRemove));
      try {
        await axios.post('http://localhost:5000/imagekit-delete', { fileId: imageToRemove.fileId, url: imageToRemove.url });
        toast.success("Image removed.");
      } catch (err) {
        console.error("Failed to delete image from ImageKit:", err);
        toast.warn("Image removed locally but failed to delete from ImageKit.");
      } finally {
        setDeletingFileIds(prev => {
          const updated = new Set(prev);
          updated.delete(fileIdToRemove);
          return updated;
        });
      }
    } else {
      setImagesToDelete(prev => {
        const updated = [...prev, fileIdToRemove];
        localStorage.setItem('pendingImageDeletions', JSON.stringify(updated));
        return updated;
      });
    }
    setImages(prev => prev.filter(img => img.fileId !== fileIdToRemove));
  };

  // Update caption handler for images
  const handleCaptionChange = (fileId, caption) => {
    setImages(prev => prev.map(img => (img.fileId === fileId ? { ...img, caption } : img)));
  };

  // Toggle image tag handler
  const handleTagToggle = (fileId, tag) => {
    setImages(prev => prev.map(img => {
      if (img.fileId !== fileId) return img;
      const selected = img.imageTags || [];
      return {
        ...img,
        imageTags: selected.includes(tag)
          ? selected.filter(t => t !== tag)
          : [...selected, tag]
      };
    }));
  };

  // Mutation to submit review
  const submitReviewMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = existingReview?.id ? `${apiUrl}/review/update` : `${apiUrl}/review/submit`;
      const res = await fetch(endpoint, {
        method: existingReview?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Submission failed');
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Review submitted successfully!');
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['reviews', pgMetadata?.id] });
      onSave?.({
        ...existingReview,
        ...variables,
        id: data.updatedId || existingReview?.id,
      });
    },
    onError: (error) => {
      console.error('Review submission failed:', error);
      toast.error('Review submission failed.');
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Submit form handler
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (imagesToDelete.length > 0) {
        await axios.post('http://localhost:5000/imagekit-batch-delete', { fileIds: imagesToDelete });
        localStorage.removeItem('pendingImageDeletions');
        setImagesToDelete([]);
      }
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
          url: img.url,
          fileId: img.fileId,
          originalName: img.file?.name || '',
          originalSize: img.file?.size || 0,
          imageTags: img.imageTags || [],
        })),
        rating_room: ratings.room,
        rating_food: hasFood ? ratings.food : null,
        rating_cleanliness: ratings.cleanliness,
        rating_safety: ratings.safety,
        rating_location: ratings.location,
        rating_warden: ratings.warden,
        review_id: existingReview?.id || null,
      };
      submitReviewMutation.mutate(reviewData);
    } catch (err) {
      console.error("Error during form submission:", err);
      toast.error("Something went wrong during submission.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    localStorage.removeItem('pendingImageDeletions');
    setImagesToDelete([]);
    onClose();
  };

  // Step render functions for clarity
  const renderMetaStep = () => (
    <div className="meta-step">
      <h2>Tell us about your stay</h2>
      <OptionGroup title="Your Class Year(s)" options={['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad']} selected={classYears} onChange={setClassYears} multiple description="Multiple can be selected" />
      <OptionGroup title="Room Type" options={['Single', 'Double', 'Triple', 'Quad', 'Suite']} selected={roomType} onChange={setRoomType} />
      <OptionGroup title="What do you think about the rent?" options={['Low', 'Reasonable', 'High']} selected={rentOpinion} onChange={setRentOpinion} />
      <OptionGroup title="Alright — Are you really happy there?" options={['Yes', 'No', 'Just Fine']} selected={happinessLevel} onChange={setHappinessLevel} />
      <button id='form-next' disabled={!classYears.length || !roomType || !rentOpinion || !happinessLevel} onClick={() => setStepWrapper(2)}>Next</button>
    </div>
  );

  const renderRatingStep = () => {
    const categories = ['room', 'cleanliness', 'safety', 'location', ...(hasFood ? ['food'] : []), 'warden'];
    return (
      <div className="rating-step">
        <h2>Rate your experience</h2>
        {categories.map(cat => (
          <StarRating key={cat} category={cat} rating={ratings[cat]} setRating={(val) => setRatings(prev => ({ ...prev, [cat]: val }))} />
        ))}
        <button id='form-next'
          disabled={
            !ratings.room ||
            !ratings.cleanliness ||
            !ratings.safety ||
            !ratings.location ||
            !ratings.warden ||
            (hasFood && !ratings.food)
          }
          onClick={() => setStepWrapper(3)}
        >
          Next
        </button>
      </div>
    );
  };

  const renderCommentStep = () => (
    <div className="comment-step">
      <h2>Write About Your Experience</h2>
      <div className="prompts">
        <p>💬 What surprised you most about your room?</p>
        <p>💡 Would you stay here again? Why or why not?</p>
      </div>
      <textarea
        className="reviewcomment-textarea"
        placeholder="Kripaya do shabd kahe..."
        value={comment}
        onChange={e => e.target.value.length <= MAX_COMMENT_LENGTH && setComment(e.target.value)}
        rows={5}
      />
      <div className="comment-tools">
        <span className={`word-count ${comment.length < MIN_COMMENT_LENGTH ? 'warn' : 'ok'}`}>
          {comment.length}/{MAX_COMMENT_LENGTH}
        </span>
        <span className={`sentiment ${sentiment.toLowerCase()}`}>
          Sentiment: {sentiment}
        </span>
      </div>
      <div className="tag-selection">
        <h4>Add tags to your review</h4>
        <div className="tag-list">
          {tagOptions.map(tag => (
            <span
              key={tag}
              className={`tag ${tags.includes(tag) ? 'selected' : ''}`}
              onClick={() => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
            >#{tag}</span>
          ))}
        </div>
      </div>
      <button id='form-next' disabled={comment.length < MIN_COMMENT_LENGTH} onClick={() => setStepWrapper(4)}>Next</button>
    </div>
  );

  const renderPhotoStep = () => (
    <div className="photo-step">
      <h2>Upload Photos</h2>
      <p className="photo-tip">Showcase images of your room, common areas, or view! (〜￣▽￣)〜</p>
      <label className={`photo-drop ${(imageUploading || images.length >= MAX_IMAGES) ? 'disabled' : ''}`}>
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          disabled={imageUploading || images.length >= MAX_IMAGES}
          style={{ display: 'none' }}
        />
        <span>
          {imageUploading ? <>Uploading... <span className="loader" /></> 
            : images.length >= MAX_IMAGES ? '📸 Max 5 images reached' 
            : '📷 Got Cool Pictures!'}
        </span>
      </label>
      {uploadError && <div className="error-message">{uploadError}</div>}
      <div className="photo-preview">
        {images.map(img => (
          <ImageCard key={img.fileId} img={img} deleting={deletingFileIds.has(img.fileId)} onCaptionChange={handleCaptionChange} onTagToggle={handleTagToggle} onRemove={handleRemoveImage} />
        ))}
      </div>
      <button id='form-next' disabled={imageUploading} onClick={() => setStepWrapper(5)}>Next</button>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="confirmation-step">
      <h2>📝 Review Summary</h2>
      <div className="summary-card">
        <div className="summary-item fade-in">
          <strong>Class Year(s):</strong> {classYears.join(', ')}<br />
          <strong>Room Type:</strong> {roomType}<br />
          <strong>Food Provided:</strong> {hasFood ? 'Yes' : 'No'}<br />
          <strong>Rent:</strong> {rentOpinion}<br />
          <strong>You Happy:</strong> {happinessLevel}<br />
          <button onClick={() => setStepWrapper(1)}>✏️ Edit</button>
        </div>
        <div className="summary-item fade-in">
          <strong>Ratings:</strong>
          <ul>
            {Object.entries(ratings).map(([key, val]) => {
              if (key === 'food' && !hasFood) return null;
              return <li key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}: {val} <span id='summaryreview-star'>⭐</span></li>;
            })}
          </ul>
          <button onClick={() => setStepWrapper(2)}>✏️ Edit</button>
        </div>
        <div className="summary-item fade-in">
          <strong>Your Comment:</strong>
          <p>{comment}</p>
          <p><em>Sentiment: {sentiment}</em></p>
          <button onClick={() => setStepWrapper(3)}>✏️ Edit</button>
        </div>
        <div className="summary-item fade-in">
          <strong>Tags:</strong> {tags.length > 0 ? tags.map(t => <span key={t}>#{t} </span>) : 'None'}
          <button onClick={() => setStepWrapper(3)}>✏️ Edit</button>
        </div>
        <div className="summary-item fade-in">
          <strong>Photos Uploaded:</strong>
          <p>{images.length} photo(s) {images.length >= 3 && <span className="badge">📸 Photo Pro</span>}</p>
          <button onClick={() => setStepWrapper(4)}>✏️ Edit</button>
        </div>
      </div>
      {existingReview?.id && (
        <p style={{ color: 'orange', marginTop: '10px' }}>⚠️ Editing your review will reset helpful votes to 0.</p>
      )}
      <button className="submit-button" onClick={handleSubmit} disabled={loading}>
        {loading ? <>⏳ Submitting... <span className="loader" /></> : '✅ Submit Review'}
      </button>
    </div>
  );

  const renderThankYouStep = () => (
    <div className="thanks-step">
      <h2>🎉 Thank you{user?.displayName ? `, ${user.displayName}` : ''}!</h2>
      <p>Your review has been submitted successfully. You're helping more students make smarter choices! 💯</p>
      <button onClick={handleClose}>Close</button>
    </div>
  );

  return (
    <div className="fancy-review-form">
      {internalStep === 1 && renderMetaStep()}
      {internalStep === 2 && renderRatingStep()}
      {internalStep === 3 && renderCommentStep()}
      {internalStep === 4 && renderPhotoStep()}
      {internalStep === 5 && !submitted && renderConfirmationStep()}
      {submitted && renderThankYouStep()}
    </div>
  );
};

export default FancyReviewForm;
