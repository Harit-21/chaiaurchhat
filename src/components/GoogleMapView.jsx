import React, { useState, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
};

const center = {
  lat: 28.6139, // Delhi center by default
  lng: 77.209,
};

const pgList = [
  {
    id: 1,
    name: "Sharma Boys PG",
    location: "Near DU North Campus",
    lat: 28.686273,
    lng: 77.219548,
  },
  {
    id: 2,
    name: "Anjali Girls Hostel",
    location: "Opp. Fergusson College, Pune",
    lat: 18.5185,
    lng: 73.8553,
  },
  {
    id: 3,
    name: "Raj PG",
    location: "Near IIT Bombay",
    lat: 19.1334,
    lng: 72.9133,
  },
];

const GoogleMapView = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAGOJSB2sIkWLwXISy4S5A8qG8wvJcYT40", // <----- Replace this with your API key
  });

  const [selectedPg, setSelectedPg] = useState(null);

  const onMarkerClick = useCallback((pg) => {
    setSelectedPg(pg);
  }, []);

  const onMapClick = () => {
    setSelectedPg(null);
  };

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">📍 PGs on the Map</h2>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={5}
        onClick={onMapClick}
      >
        {pgList.map((pg) => (
          <Marker
            key={pg.id}
            position={{ lat: pg.lat, lng: pg.lng }}
            onClick={() => onMarkerClick(pg)}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            }}
          />
        ))}

        {selectedPg && (
          <InfoWindow
            position={{ lat: selectedPg.lat, lng: selectedPg.lng }}
            onCloseClick={() => setSelectedPg(null)}
          >
            <div>
              <h3 className="font-semibold">{selectedPg.name}</h3>
              <p>{selectedPg.location}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  );
};

export default GoogleMapView;
