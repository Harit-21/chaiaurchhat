// DraggableMarker.js
import { useRef, useEffect, useState } from 'react';
import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DraggableMarker = ({ position, onPositionChange }) => {
    const markerRef = useRef(null);
    const [currentPosition, setCurrentPosition] = useState(position);

    useEffect(() => {
        setCurrentPosition(position);
    }, [position]);

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setCurrentPosition([lat, lng]);
            onPositionChange({ lat, lng });
        },
    });

    const handleDragEnd = () => {
        const marker = markerRef.current;
        if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setCurrentPosition([lat, lng]);
            onPositionChange({ lat, lng });
        }
    };

    return (
        <Marker
            draggable={true}
            eventHandlers={{ dragend: handleDragEnd }}
            position={currentPosition}
            ref={markerRef}
        />
    );
};

export default DraggableMarker;
