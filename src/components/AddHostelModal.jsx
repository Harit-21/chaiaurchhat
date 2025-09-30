import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import ConfirmModal from './ConfirmModal';
import 'react-toastify/dist/ReactToastify.css';
import '../css/AddHostelModal.css';
import { apiUrl } from '../api';
import FloatingLabelDropdown from './CollegePage/FloatingLabelDropdown';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import DraggableMarker from './CollegePage/DraggableMarker';


const AddHostelModal = ({ onClose, defaultCollegeId = null }) => {
    const [colleges, setColleges] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const dropdownRef = useRef();

    const loadDraft = () => {
        const saved = localStorage.getItem('addHostelDraft');
        const fiveMinutes = 5 * 60 * 1000;
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Date.now() - parsed.timestamp < fiveMinutes) {
                    return {
                        formData: parsed.formData || {},
                        step: parsed.step || 0,
                        searchTerm: parsed.searchTerm || ''
                    };
                } else {
                    localStorage.removeItem('addHostelDraft');
                }
            } catch (e) {
                console.error("Invalid draft data:", e);
            }
        }

        return {
            formData: {
                name: '',
                college_id: '',
                inside_campus: '',
                gender_type: '',
                has_food: 'Yes',
                image: ''
            },
            step: 0,
            searchTerm: ''
        };
    };

    const draft = loadDraft();
    const [formData, setFormData] = useState(draft.formData);
    const [step, setStep] = useState(draft.step);
    const [searchTerm, setSearchTerm] = useState(draft.searchTerm);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);


    // Fetch colleges
    useEffect(() => {
        fetch(`${apiUrl}/colleges`)
            .then(res => res.json())
            .then(data => {
                setColleges(data);
                if (!draft.formData.college_id && defaultCollegeId) {
                    const found = data.find(c => c.id === defaultCollegeId);
                    if (found) {
                        setFormData(prev => ({ ...prev, college_id: found.id }));
                        setSearchTerm(found.name);
                    }
                }
            })
            .catch(err => console.error("Error fetching colleges:", err));
    }, [defaultCollegeId]);

    // Filter colleges for dropdown search
    const filteredColleges = useMemo(() => colleges.filter(c =>
        c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        c.short_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        c.city?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())),
        [colleges, debouncedSearchTerm]
    );


    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 310); // 300ms debounce delay

        return () => {
            clearTimeout(handler); // clean up if searchTerm changes before 300ms
        };
    }, [searchTerm]);


    // Reset image loaded/error states when image URL changes
    useEffect(() => {
        if (formData.image) {
            setImageLoaded(false);
            setImageError(false);
        }
    }, [formData.image]);

    useEffect(() => {
        const savedData = {
            formData,
            step,
            searchTerm,
            timestamp: Date.now()
        };
        localStorage.setItem('addHostelDraft', JSON.stringify(savedData));
    }, [formData, step, searchTerm]);


    // Highlight text in dropdown
    const highlightText = (text, highlight) => {
        if (!highlight) return text;
        const regex = new RegExp(`(${highlight})`, 'gi');
        return text.split(regex).map((part, i) =>
            regex.test(part) ? <span key={i} className="highlight">{part}</span> : part
        );
    };

    // Handle form input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Select a college from dropdown
    const handleCollegeSelect = (college) => {
        setFormData(prev => ({ ...prev, college_id: college.id, inside_campus: '', latitude: college.latitude, longitude: college.longitude, })); // reset inside_campus
        setSearchTerm(college.name);
        setDropdownOpen(false);
    };

    const SearchControl = ({ onSearchResult }) => {
        const map = useMap();

        useEffect(() => {
            const provider = new OpenStreetMapProvider({
                params: {
                    countrycodes: 'in', // Limit results to India
                    viewbox: [68.0, 35.0, 97.0, 6.0], // Rough bounding box for India
                    bounded: 1
                }
            });

            const searchControl = new GeoSearchControl({
                provider,
                showMarker: false, // We'll handle our own marker
                showPopup: false,
                retainZoomLevel: false,
                animateZoom: true,
                autoClose: true,
                searchLabel: 'Search PG/Hostel/Place...',
            });

            map.addControl(searchControl);

            // Listen for search results
            map.on('geosearch/showlocation', (result) => {
                const { x: lng, y: lat } = result.location;
                if (onSearchResult) {
                    onSearchResult({ lat, lng });
                }
            });

            return () => {
                map.removeControl(searchControl);
            };
        }, [map, onSearchResult]);

        return null;
    };

    const MapRecenter = ({ lat, lng }) => {
        const map = useMap();
        useEffect(() => {
            if (!isNaN(lat) && !isNaN(lng)) {
                map.setView([lat, lng]);
            }
        }, [lat, lng, map]);

        return null;
    };


    // Reset the whole form
    const resetForm = () => {
        setFormData({
            name: '',
            college_id: '',
            inside_campus: '',
            gender_type: '',
            has_food: 'Yes',
            image: ''
        });
        setSearchTerm('');
        localStorage.removeItem('addHostelDraft');
        setStep(0);
    };

    // Validation before moving to next step
    const validateStep = (currentStep) => {
        switch (currentStep) {
            case 0:
                if (!formData.name.trim()) {
                    toast.error("Please enter a hostel name.");
                    return false;
                }
                return true;
            case 1: {
                const selected = colleges.find(c => c.id === formData.college_id);
                if (!selected) {
                    toast.error("Please select a valid college from the list.");
                    return false;
                }

                // Also check if searchTerm matches selected college name (optional extra validation)
                if (searchTerm.trim().toLowerCase() !== selected.name.toLowerCase()) {
                    toast.error("Please pick the college from the dropdown.");
                    return false;
                }

                return true;
            }
            case 2:
                if (!formData.inside_campus) {
                    toast.error("Please specify if the hostel is inside or outside campus.");
                    return false;
                }
                return true;
            case 3:
                if (!formData.gender_type) {
                    toast.error("Please select gender type.");
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    // Move to next step
    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, steps.length - 1));
        }
    };

    // Move to previous step
    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 0));
    };

    // Prevent form submit on Enter key except on last step
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (step < steps.length - 1) {
                nextStep();
            } else {
                handleSubmit(e);
            }
        }
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        // Validate all required fields before submission
        if (!formData.college_id) {
            toast.error("Please select a college.");
            setStep(1);
            return;
        }
        if (!formData.inside_campus) {
            toast.error("Please specify if the hostel is inside or outside campus.");
            setStep(2);
            return;
        }
        if (!formData.name.trim()) {
            toast.error("Please enter a hostel name.");
            setStep(0);
            return;
        }
        if (!formData.gender_type) {
            toast.error("Please select gender type.");
            setStep(3);
            return;
        }

        // 🔒 Confirm submission
        setShowConfirm(true);
    };

    const confirmAndSubmit = async () => {
        setSubmitting(true);
        setShowConfirm(false); // hide modal

        try {
            const existing = await fetch(`${apiUrl}/pgs?college_id=${formData.college_id}`);
            const pgList = await existing.json();
            const dup = pgList.find(pg => pg.name.trim().toLowerCase() === formData.name.trim().toLowerCase());

            if (dup) {
                const shortName = colleges.find(c => c.id === formData.college_id).short_name;
                toast.error(`A hostel with this name already exists near ${shortName}.`);
                setSubmitting(false);
                return;
            }

            const submissionData = { ...formData };
            if (imageError) {
                submissionData.image = '';
            }

            const res = await fetch(`${apiUrl}/pgs/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.error || 'Unknown error occurred.');
            }

            toast.success("Hostel added successfully!");
            localStorage.removeItem('addHostelDraft');
            resetForm();
            onClose();
        } catch (err) {
            toast.error("Failed to add hostel: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };


    // Steps titles
    const steps = [
        'Hostel Name',
        'College',
        'Inside/Outside Campus',
        'Gender',
        'Food',
        'Image',
        'Map Location',
        'Review'
    ];

    // Render UI for each step
    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="ahm-floating-label step-page">
                        <input
                            name="name"
                            placeholder=" "
                            value={formData.name}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            required
                            autoFocus
                        />
                        <label><span className='animback'>Hostel Name</span></label>
                    </div>
                );

            case 1:
                return (
                    <div className="ahm-form-group step-page">
                        <label htmlFor="collegeSearch">Located near</label>
                        <div className="ahm-custom-dropdown" ref={dropdownRef}>
                            <input
                                id="collegeSearch"
                                type="text"
                                placeholder="Search college..."
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setFormData(prev => ({ ...prev, college_id: '' }));
                                    setDropdownOpen(true);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setDropdownOpen(true)}
                                required
                            //readOnly={!!formData.college_id} // 👈 prevent manual typing after selection
                            />
                            {formData.college_id && (
                                <button
                                    type="button"
                                    className="ahm-clear-selection"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, college_id: '' }));
                                        setSearchTerm('');
                                        setDropdownOpen(true);
                                    }}
                                >
                                    ×
                                </button>
                            )}
                            {dropdownOpen && (
                                <div className="ahm-dropdown-options">
                                    {filteredColleges.length > 0 ? (
                                        filteredColleges.map(college => (
                                            <div
                                                key={college.id}
                                                className={`ahm-dropdown-option ${college.id === formData.college_id ? 'selected' : ''}`}
                                                onClick={() => handleCollegeSelect(college)}
                                            >
                                                {highlightText(college.name, searchTerm)}{' '}
                                                <small style={{ opacity: 0.6 }}>({college.city})</small>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="ahm-dropdown-option disabled">No colleges found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );


            case 2:
                return (
                    <FloatingLabelDropdown
                        label="Is it inside or outside campus?"
                        options={['Inside Campus', 'Outside Campus']}
                        value={formData.inside_campus}
                        onChange={(val) => setFormData(prev => ({ ...prev, inside_campus: val }))}
                        name="inside_campus"
                    />
                );

            case 3:
                return (
                    <FloatingLabelDropdown
                        label="Gender Type"
                        options={['Boys Only', 'Girls Only', 'Co-ed']}
                        value={formData.gender_type}
                        onChange={(val) => setFormData(prev => ({ ...prev, gender_type: val }))}
                        name="gender_type"
                    />
                );

            case 4:
                return (
                    <FloatingLabelDropdown
                        label="Food Provided?"
                        options={['Yes', 'No']}
                        value={formData.has_food}
                        onChange={(val) => setFormData(prev => ({ ...prev, has_food: val }))}
                        name="has_food"
                    />
                );

            case 5:
                return (
                    <div className="ahm-floating-label step-page">
                        <input
                            name="image"
                            placeholder=" "
                            value={formData.image}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <label>Main Photo (URL)</label>
                        {formData.image && !imageError && (
                            <img
                                src={formData.image}
                                alt="Preview"
                                className={`ahm-image-preview ${imageLoaded ? 'visible' : 'hidden'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => {
                                    setImageError(true);
                                    setImageLoaded(false);
                                }}
                            />
                        )}
                        {imageError && <div className="ahm-image-error">Invalid image URL</div>}
                    </div>
                );

            case 6:
                const college = colleges.find(c => c.id === formData.college_id);
                const defaultPosition = [
                    parseFloat(formData.latitude || college?.latitude || 28.6139),
                    parseFloat(formData.longitude || college?.longitude || 77.2090)
                ];

                const handleManualLatLngChange = (type, value) => {
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                        setFormData(prev => ({
                            ...prev,
                            [type]: num
                        }));
                    }
                };

                return (
                    <div className="map-step-container">
                        <label>Select PG Location on Map</label>
                        <MapContainer
                            center={defaultPosition}
                            zoom={16}
                            style={{ height: "300px", width: "100%" }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="© OpenStreetMap contributors"
                            />
                            <SearchControl
                                onSearchResult={({ lat, lng }) =>
                                    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
                                }
                            />
                            <DraggableMarker
                                position={defaultPosition}
                                onPositionChange={({ lat, lng }) =>
                                    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
                                }
                            />
                            <MapRecenter lat={formData.latitude} lng={formData.longitude} />
                        </MapContainer>

                        {/* Fallback message */}
                        <div className="map-help-text">
                            <span role="img" aria-label="info">💡</span> Can’t find your PG in search? Just drag the marker to its exact location on the map.
                        </div>

                        {/* Manual coordinate input fallback */}
                        <div className="manual-coordinates">
                            <label htmlFor="latitude">Latitude</label>
                            <input
                                id="latitude"
                                type="number"
                                step="0.000001"
                                value={formData.latitude || ''}
                                onChange={e => handleManualLatLngChange('latitude', e.target.value)}
                            />
                            <label htmlFor="longitude">Longitude</label>
                            <input
                                id="longitude"
                                type="number"
                                step="0.000001"
                                value={formData.longitude || ''}
                                onChange={e => handleManualLatLngChange('longitude', e.target.value)}
                            />
                            <small className="map-help-text">💡 You can also manually enter coordinates if the marker or search isn't precise.</small>
                        </div>
                    </div>
                );


            case 7:
                return (
                    <div className="ahm-review-step step-page">
                        <h3>Review Your Details</h3>
                        <ul>
                            <li onClick={() => setStep(0)}><b>Hostel Name:</b> {formData.name}</li>
                            <li onClick={() => setStep(1)}><b>College:</b> {colleges.find(c => c.id === formData.college_id)?.name || 'N/A'}</li>
                            <li onClick={() => setStep(2)}><b>Inside/Outside Campus:</b> {formData.inside_campus}</li>
                            <li onClick={() => setStep(3)}><b>Gender Type:</b> {formData.gender_type}</li>
                            <li onClick={() => setStep(4)}><b>Food Provided:</b> {formData.has_food}</li>
                            <li onClick={() => setStep(6)}>
                                <b>Coordinates:</b> {formData.latitude && formData.longitude ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}` : 'Not set'}
                            </li>
                            <li onClick={() => setStep(5)}>
                                {formData.image && !imageError ? (
                                    <img src={formData.image} alt="Preview" className="ahm-image-preview visible" />
                                ) : (
                                    <i style={{ opacity: 0.6 }}>No Image</i>
                                )}
                            </li>
                        </ul>
                        <p style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem', color: '#777' }}>
                            Click any field above to edit.
                        </p>
                    </div>
                );


            default:
                return null;
        }
    };

    return (
        <div className="ahm-modal-overlay">
            <div className="ahm-add-hostel-card-container">
                <button className="ahm-close-btn" onClick={() => onClose(false)}>×</button>
                <h2>🏠 Add a New Hostel</h2>
                <p className="ahm-subtext">Help the community by listing a new PG or hostel</p>

                <form onSubmit={handleSubmit} className="ahm-hostel-form">
                    {renderStep()}

                    <div className="ahm-form-navigation">
                        {step < steps.length && (
                            <button
                                type="button"
                                onClick={() => setShowResetConfirm(true)}
                                className="ahm-reset-btn"
                            >
                                Reset
                            </button>
                        )}
                        {step > 0 && (
                            <button type="button" onClick={prevStep} className="ahm-nav-btn ahm-back-btn">
                                ← Back
                            </button>
                        )}
                        {step < steps.length - 1 && (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="ahm-nav-btn next-btn"
                            >
                                Next →
                            </button>
                        )}
                        {step === steps.length - 1 && (
                            <button
                                type="submit"
                                className="ahm-submit-btn"
                                disabled={submitting}
                            >
                                {submitting ? "Submitting..." : "📤 Submit Hostel"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
            {showConfirm && (
                <ConfirmModal
                    message="Are you sure you want to submit this hostel listing?"
                    onConfirm={confirmAndSubmit}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
            {showResetConfirm && (
                <ConfirmModal
                    message="Are you sure you want to reset the entire form? This will delete all entered data."
                    onConfirm={() => {
                        resetForm();
                        setShowResetConfirm(false);
                        onClose(true);
                    }}
                    onCancel={() => setShowResetConfirm(false)}
                />
            )}
        </div>
    );
};

export default AddHostelModal;
