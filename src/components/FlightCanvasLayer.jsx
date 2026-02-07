import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const FlightCanvasLayer = ({ flights, onFlightClick, selectedFlightId, isDarkMode }) => {
    const map = useMap();
    const canvasRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Constants for drawing
    const PLANE_SIZE = 16;
    const PLANE_COLOR_DARK = '#fbbf24'; // amber-400 (Yellow for dark mode)
    const PLANE_COLOR_LIGHT = '#d97706'; // amber-600
    const SELECTED_COLOR = '#38bdf8'; // sky-400

    // Setup Canvas Overlay
    useEffect(() => {
        const canvas = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
        canvas.style.position = 'absolute';
        canvas.style.left = 0;
        canvas.style.top = 0;
        canvas.style.pointerEvents = 'none'; // We handle clicks via map map event for efficiency? Or add handler to canvas?
        // Actually, for interaction with 20k points, calculating distance on map click is better than canvas events.
        canvas.style.zIndex = 400; // Marker pane level

        canvasRef.current = canvas;

        const container = map.getContainer();
        container.appendChild(canvas);

        const updateCanvas = () => {
            const size = map.getSize();
            // Handle retina displays
            const dpr = window.devicePixelRatio || 1;
            canvas.width = size.x * dpr;
            canvas.height = size.y * dpr;
            canvas.style.width = `${size.x}px`;
            canvas.style.height = `${size.y}px`;

            setCanvasSize({ width: size.x, height: size.y });

            // Adjust context scale
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            // Re-draw immediately after resize/zoom
            draw();
        };

        map.on('move', updateCanvas); // 'move' handles both drag and zoom animation frames in leaflet usually
        map.on('moveend', updateCanvas);
        map.on('zoomend', updateCanvas);
        map.on('resize', updateCanvas);

        updateCanvas();

        return () => {
            map.off('move', updateCanvas);
            map.off('moveend', updateCanvas);
            map.off('zoomend', updateCanvas);
            map.off('resize', updateCanvas);
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        };
    }, [map]);

    // Drawing Logic
    const draw = () => {
        if (!canvasRef.current || !flights) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        const colorNormal = isDarkMode ? PLANE_COLOR_DARK : PLANE_COLOR_LIGHT;

        flights.forEach(flight => {
            if (!Number.isFinite(flight.latitude) || !Number.isFinite(flight.longitude)) return;

            // Project to pixel coordinates relative to the map container (viewport)
            let point;
            try {
                point = map.latLngToContainerPoint([flight.latitude, flight.longitude]);
            } catch (e) {
                return;
            }

            // Optimization: Skip valid check if off-screen? 
            if (point.x < -20 || point.y < -20 || point.x > canvasSize.width + 20 || point.y > canvasSize.height + 20) {
                return;
            }

            const isSelected = flight.icao24 === selectedFlightId;
            const color = isSelected ? SELECTED_COLOR : colorNormal;

            // Draw Plane Icon (Material Design flight icon style)
            ctx.fillStyle = color;
            ctx.save();
            ctx.translate(point.x, point.y);
            ctx.rotate((flight.track || 0) * Math.PI / 180);

            // Airplane shape based on Material Design flight icon
            // Scale it down to fit the canvas (original is 24x24, we use smaller scale)
            const scale = 0.52; // Increased size by ~4% (requested ~3%)
            ctx.scale(scale, scale);

            ctx.beginPath();
            // Main fuselage and wings (simplified from MD flight icon path)
            // Center vertical body
            ctx.moveTo(-1, -12);
            ctx.lineTo(1, -12);
            ctx.lineTo(1, -4);
            // Right wing
            ctx.lineTo(8, 0);
            ctx.lineTo(8, 2);
            ctx.lineTo(1, -1);
            ctx.lineTo(1, 6);
            // Right tail
            ctx.lineTo(3, 8);
            ctx.lineTo(3, 10);
            ctx.lineTo(1, 9);
            ctx.lineTo(1, 12);
            // Bottom
            ctx.lineTo(-1, 12);
            ctx.lineTo(-1, 9);
            // Left tail
            ctx.lineTo(-3, 10);
            ctx.lineTo(-3, 8);
            ctx.lineTo(-1, 6);
            ctx.lineTo(-1, -1);
            // Left wing
            ctx.lineTo(-8, 2);
            ctx.lineTo(-8, 0);
            ctx.lineTo(-1, -4);
            ctx.closePath();

            ctx.fill();

            // If selected, add a ring
            if (isSelected) {
                ctx.strokeStyle = SELECTED_COLOR;
                ctx.lineWidth = 3 / scale; // Adjust for scaling
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        });
    };

    // Redraw when data or selection changes
    useEffect(() => {
        requestAnimationFrame(draw);
    }, [flights, selectedFlightId, isDarkMode, canvasSize]);

    // Handle Clicks
    useEffect(() => {
        const handleClick = (e) => {
            if (!flights) return;
            // e.containerPoint is relative to map container
            const clickPoint = e.containerPoint;

            // Find closest flight within threshold
            let closestDist = Infinity;
            let closestFlight = null;
            const threshold = 15; // pixels

            // We only check visible flights ideally, but checking all 20k is fast enough in standard JS (O(N)) for interaction
            // unless we do it on mousemove. On click it's fine.
            for (let flight of flights) {
                if (!Number.isFinite(flight.latitude) || !Number.isFinite(flight.longitude)) continue;

                let p;
                try {
                    p = map.latLngToContainerPoint([flight.latitude, flight.longitude]);
                } catch (e) {
                    continue;
                }

                const dx = p.x - clickPoint.x;
                const dy = p.y - clickPoint.y;
                const dist = dx * dx + dy * dy; // squared dist

                if (dist < threshold * threshold && dist < closestDist) {
                    closestDist = dist;
                    closestFlight = flight;
                }
            }

            if (closestFlight) {
                onFlightClick(closestFlight);
                L.DomEvent.stopPropagation(e.originalEvent); // Prevent map click (e.g. closing popup) if we clicked a plane
            }
        };

        map.on('click', handleClick);
        return () => map.off('click', handleClick);
    }, [map, flights, onFlightClick]);

    return null;
};

export default FlightCanvasLayer;
