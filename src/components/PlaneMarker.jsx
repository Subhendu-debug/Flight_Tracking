import { divIcon } from 'leaflet';
import { Marker } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Plane } from 'lucide-react';

const PlaneMarker = ({ plane, onClick, isSelected }) => {
    // Create a custom icon using Lucide React icon
    // We rotate the icon based on the plane's track
    const iconMarkup = renderToStaticMarkup(
        <div
            style={{
                transform: `rotate(${plane.track - 45}deg)`, // -45 because the icon usually points 45deg or up. Plane icon usually points NE (45) or N (0).
                // Lucide Plane icon points NE (top-right) by default? Let's check. 
                // Usually Plane icon in Lucide points 45 degrees (up-right).
                // If track is 0 (North), we want it pointing up. So we need to rotate it -45 deg.
                // Wait, let's assume default is 45deg. 
                // If track 90 (East), we want 45 deg more. 
                // Rotation logic: standard mapping.
                color: isSelected ? '#38bdf8' : '#cbd5e1', // sky-400 vs slate-300
                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))',
                transition: 'transform 0.5s ease-in-out'
            }}
        >
            <Plane size={24} fill="currentColor" strokeWidth={1} />
        </div>
    );

    const customIcon = divIcon({
        html: iconMarkup,
        className: 'plane-marker-icon', // We'll add this to global css or just ignore if no extra style needed
        iconSize: [24, 24],
        iconAnchor: [12, 12], // Center
    });

    return (
        <Marker
            position={[plane.latitude, plane.longitude]}
            icon={customIcon}
            eventHandlers={{
                click: () => onClick(plane),
            }}
        />
    );
};

export default PlaneMarker;
