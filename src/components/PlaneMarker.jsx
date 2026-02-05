import { divIcon } from 'leaflet';
import { Marker } from 'react-leaflet';
import React, { useMemo } from 'react';

// Static SVG string for the plane icon (Lucide 'Plane' equivalent)
const planeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M13 2l9 10-9 10"/><path d="M7 12a5 5 0 0 1-5-5 5 5 0 0 1 5-5h10"/></svg>`;
// Actually, Lucide Plane path is different. Let's use a simple path or the actual Lucide path if possible.
// Finding Lucide Plane path: <path d="M2 12h20"/><path d="M13 2l9 10-9 10"/><path d="M13 2a2 2 0 0 1 0 20"/> wait.
// Let's use a simplified distinct plane shape for performance.
const planeSvgString = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
// This is a Material Design flight icon style, cleaner for rotation.

const PlaneMarker = React.memo(({ plane, onClick, isSelected, isDarkMode = true }) => {

    // Memoize the icon creation so it doesn't run on every render unless props change
    const customIcon = useMemo(() => {
        let color;
        if (isSelected) {
            color = '#38bdf8'; // sky-400 (Selected is always bright blue)
        } else {
            // Dark Mode: slate-300 (light grey)
            // Light Mode: amber-600 (dark yellow/orange for visibility against white/light map)
            // User requested "yellow" for light mode to fix visibility
            color = isDarkMode ? '#cbd5e1' : '#d97706';
        }

        const rotation = plane.track;

        const html = `
            <div style="
                transform: rotate(${rotation}deg);
                color: ${color};
                filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));
                transition: transform 0.5s ease-in-out, color 0.3s ease;
                width: 24px;
                height: 24px;
            ">
                ${planeSvgString}
            </div>
        `;

        return divIcon({
            html: html,
            className: 'plane-marker-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
    }, [plane.track, isSelected, isDarkMode]);

    return (
        <Marker
            position={[plane.latitude, plane.longitude]}
            icon={customIcon}
            eventHandlers={{
                click: () => onClick(plane),
            }}
        />
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if position, track, selection status OR dark mode changes
    return (
        prevProps.plane.latitude === nextProps.plane.latitude &&
        prevProps.plane.longitude === nextProps.plane.longitude &&
        prevProps.plane.track === nextProps.plane.track &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isDarkMode === nextProps.isDarkMode // Important: Re-render on theme change
    );
});

export default PlaneMarker;
