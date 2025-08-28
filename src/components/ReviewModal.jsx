// components/ReviewModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import FancyReviewForm from './FancyReviewForm';
import '../css/PGDetail/ReviewModal.css';

const ReviewModal = ({ onClose, pgName, pgMetadata, user, existingReview = null, step: controlledStep = 1, setStep: setControlledStep = null }) => {
    const [step, setStep] = useState(controlledStep);
    const modalContentRef = useRef(null);

    // Sync local step with controlledStep if passed
    useEffect(() => {
        if (setControlledStep) {
            setStep(controlledStep);
        }
    }, [controlledStep, setControlledStep]);

    // Update step either controlled or internal
    const currentStep = setControlledStep ? controlledStep : step;
    const setCurrentStep = setControlledStep || setStep;

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    useEffect(() => {
        if (modalContentRef.current) {
            modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentStep]);

    return (
        <div className="review-overlay">
            <div className="review-overlay-content" ref={modalContentRef}>
                <div className="modal-header-sticky">
                    <div className="modal-header">
                        {currentStep > 1 && currentStep < 5 && (
                            <button className="modal-back-button" onClick={() => setCurrentStep(prev => prev - 1)}>
                                ← Back
                            </button>
                        )}
                        <div className="form-dots">
                            {[1, 2, 3, 4, 5].map(i => (
                                <span
                                    key={i}
                                    className={`dot ${currentStep === i ? 'active' : ''} ${currentStep < i ? 'upcoming' : 'done'}`}
                                />
                            ))}
                        </div>
                        <button className="close-button" onClick={onClose}>×</button>
                    </div>
                </div>
                <FancyReviewForm
                    pgName={pgName}
                    onClose={onClose}
                    step={currentStep}
                    setStep={setCurrentStep}
                    pgMetadata={pgMetadata}
                    user={user}
                    existingReview={existingReview}  // forward this to support editing
                />
            </div>
        </div>
    );
};

export default ReviewModal;
