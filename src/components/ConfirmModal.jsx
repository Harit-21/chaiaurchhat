// ConfirmModal.jsx
import React from 'react';
import '../css/ConfirmModal.css';

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-box">
                <p className="confirm-modal-message">{message}</p>
                <div className="confirm-modal-actions">
                    <button className="confirm-btn confirm" onClick={onConfirm}>SURE</button>
                    <button className="confirm-btn cancel" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
