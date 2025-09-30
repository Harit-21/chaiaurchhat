// RoutingControl.jsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const RoutingControl = ({ start, end, onRouteFound }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return;

    const control = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      lineOptions: {
        styles: [{ color: 'blue', weight: 4 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
    });

    control.addTo(map);

    // 🔥 Extract distance & duration on route found
    control.on('routesfound', (e) => {
      const route = e.routes[0];
      if (route && onRouteFound) {
        const distanceInKm = (route.summary.totalDistance / 1000).toFixed(1);
        const durationInMin = Math.round(route.summary.totalTime / 60);

        // Format duration nicely: 10h 44min instead of 644min
        const hours = Math.floor(durationInMin / 60);
        const minutes = durationInMin % 60;
        const formattedDuration = `${hours > 0 ? `${hours}h ` : ''}${minutes}min`;

        onRouteFound({
          distanceInKm,
          durationInMin,
          formattedDuration,
        });
      }
    });

    return () => {
      map.removeControl(control);
    };
  }, [map, start, end, onRouteFound]);

  return null;
};

export default RoutingControl;
