import React, { useState } from 'react';
import { apiUrl } from '../api';

const ReviewEditModal = ({ review, pgMetadata, onClose, onSave }) => {
    const hasFood = !!pgMetadata?.has_food;

    const [updatedComment, setUpdatedComment] = useState(review.comment || '');
    const [updatedRoomType, setUpdatedRoomType] = useState(review.room_type || '');

    const [ratings, setRatings] = useState({
        room: review.rating_room || 0,
        cleanliness: review.rating_cleanliness || 0,
        safety: review.rating_safety || 0,
        location: review.rating_location || 0,
        warden: review.rating_warden || 0,
        food: review.rating_food || 0,
    });

    const handleRatingChange = (field, value) => {
        setRatings(prev => ({
            ...prev,
            [field]: Math.max(1, Math.min(5, parseInt(value) || 0))
        }));
    };

    const handleSave = () => {
        const individualRatings = {
            rating_room: ratings.room,
            rating_cleanliness: ratings.cleanliness,
            rating_safety: ratings.safety,
            rating_location: ratings.location,
            rating_warden: ratings.warden,
            ...(hasFood && { rating_food: ratings.food })
        };

        // Compute average rating
        const values = Object.values(individualRatings).filter(val => typeof val === 'number');
        const avgRating = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : 0;

        const updatedData = {
            ...individualRatings,
            rating: avgRating,
            comment: updatedComment,
            room_type: updatedRoomType
        };

        fetch(`${apiUrl}/reviews/${review.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        })
            .then(res => {
                if (!res.ok) throw new Error("Update failed");
                return res.json();
            })
            .then(updated => {
                onSave(review.id, updatedData);
                onClose();
            })
            .catch(err => {
                console.error("Error updating review:", err);
                alert("Update failed.");
            });
    };

    return (
        <div className="modal-backdrop">
            <div className="edit-modal">
                <h3>Edit Your Review</h3>

                <label>Comment:</label>
                <textarea
                    value={updatedComment}
                    onChange={(e) => setUpdatedComment(e.target.value)}
                    rows={4}
                />

                <label>Room Type:</label>
                <input
                    type="text"
                    value={updatedRoomType}
                    onChange={(e) => setUpdatedRoomType(e.target.value)}
                />

                <h4>Update Ratings (1–5):</h4>
                <label>Room:</label>
                <input
                    type="number"
                    min="1"
                    max="5"
                    value={ratings.room}
                    onChange={(e) => handleRatingChange('room', e.target.value)}
                />

                <label>Cleanliness:</label>
                <input
                    type="number"
                    min="1"
                    max="5"
                    value={ratings.cleanliness}
                    onChange={(e) => handleRatingChange('cleanliness', e.target.value)}
                />

                <label>Safety:</label>
                <input
                    type="number"
                    min="1"
                    max="5"
                    value={ratings.safety}
                    onChange={(e) => handleRatingChange('safety', e.target.value)}
                />

                <label>Location:</label>
                <input
                    type="number"
                    min="1"
                    max="5"
                    value={ratings.location}
                    onChange={(e) => handleRatingChange('location', e.target.value)}
                />

                <label>Warden:</label>
                <input
                    type="number"
                    min="1"
                    max="5"
                    value={ratings.warden}
                    onChange={(e) => handleRatingChange('warden', e.target.value)}
                />

                {hasFood && (
                    <>
                        <label>Food:</label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={ratings.food}
                            onChange={(e) => handleRatingChange('food', e.target.value)}
                        />
                    </>
                )}

                <div className="edit-actions">
                    <button onClick={handleSave}>💾 Save</button>
                    <button onClick={onClose}>❌ Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ReviewEditModal;
