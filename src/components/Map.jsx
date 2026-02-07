import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchFlightData, fetchFlightTrack } from '../services/api';
import { getAirportCoords } from '../data/airports';
import L from 'leaflet';
import PlaneMarker from './PlaneMarker';
import FlightCanvasLayer from './FlightCanvasLayer';
import FlightInfo from './FlightInfo';
import { Loader2, Search, Sun, Moon } from 'lucide-react';

const FlyToSelection = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 8, { duration: 2 });
        }
    }, [position, map]);
    return null;
};

// Optimization: Only update bounds state when map stops moving
const MapController = ({ onBoundsChange }) => {
    const map = useMapEvents({
        moveend: () => {
            onBoundsChange(map.getBounds());
        },
        zoomend: () => {
            onBoundsChange(map.getBounds());
        }
    });

    // Initial bounds
    useEffect(() => {
        // Debounce initial load slightly to ensure map is ready
        const t = setTimeout(() => {
            onBoundsChange(map.getBounds());
        }, 100);
        return () => clearTimeout(t);
    }, [map]);

    return null;
};

const Map = () => {
    const [flights, setFlights] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [flightPath, setFlightPath] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [bounds, setBounds] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const getData = useCallback(async (currentBounds) => {
        setLoading(true);
        // Format bounds for API: { lamin, lmin, lamax, lmax }
        // Leaflet bounds: _southWest, _northEast
        let boundsObj = null;
        if (currentBounds) {
            boundsObj = {
                lamin: currentBounds.getSouth(),
                lmin: currentBounds.getWest(),
                lamax: currentBounds.getNorth(),
                lmax: currentBounds.getEast()
            };
        }

        const data = await fetchFlightData(boundsObj);

        // Replace flights with new data (lazy loading - only keep what's needed)
        setFlights(data);

        setLoading(false);
        setLastUpdated(new Date());
    }, []);

    // Trigger fetch when bounds change
    useEffect(() => {
        if (bounds) {
            getData(bounds);
        }
    }, [bounds, getData]);

    // Polling also needs to respect current bounds
    useEffect(() => {
        const interval = setInterval(() => {
            if (bounds) {
                getData(bounds);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [bounds, getData]);

    // MapController triggers initial bounds update, which triggers first getData()

    useEffect(() => {
        const getTrack = async () => {
            if (selectedFlight) {
                const path = await fetchFlightTrack(selectedFlight.icao24);
                if (path && path.length > 0) {
                    setFlightPath(path.map(p => [p.lat, p.lng]));
                } else {
                    // Fallback: If no track available, just start with current position
                    setFlightPath([[selectedFlight.latitude, selectedFlight.longitude]]);
                }
            } else {
                setFlightPath([]);
            }
        };
        getTrack();
    }, [selectedFlight]);

    // Live update of path
    useEffect(() => {
        if (selectedFlight && flights.length > 0) {
            const updatedFlight = flights.find(f => f.icao24 === selectedFlight.icao24);
            if (updatedFlight) {
                setFlightPath(prev => {
                    const lastPoint = prev[prev.length - 1];
                    // Only add if position changed significantly to avoid jitter
                    if (!lastPoint || (lastPoint[0] !== updatedFlight.latitude || lastPoint[1] !== updatedFlight.longitude)) {
                        return [...prev, [updatedFlight.latitude, updatedFlight.longitude]];
                    }
                    return prev;
                });
                // Keep selected flight object updated
                setSelectedFlight(updatedFlight);
            }
        }
    }, [flights, selectedFlight]); // Be careful with dependency selectedFlight here to avoid loop if we update it.
    // Actually, we should probably separate "selectedFlightId" from the object to avoid issues, 
    // but for now let's just use the finding logic.

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery) return;

        const found = flights.find(f =>
            (f.callsign && f.callsign.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (f.icao24 && f.icao24.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        if (found) {
            setSelectedFlight(found);
            setSearchQuery(""); // Clear after finding? Or keep it? Let's keep it clean.
        } else {
            alert("Flight not found!");
        }
    };

    // Optimization: Viewport Pruning
    const visibleFlights = useMemo(() => {
        // Since we are now lazily loading ONLY the visible flights from the API/Mock service,
        // `flights` state already contains only the visible ones (plus maybe a small buffer if the API is generous).
        // So we can just return all flights in state.
        // However, strictly filtering again doesn't hurt and ensures clean edges if API returns loose bounds.
        if (!bounds) return [];
        const paddedBounds = bounds.pad(0.1); // Keep slight padding for smooth panning
        return flights.filter(f => paddedBounds.contains([f.latitude, f.longitude]));
    }, [flights, bounds]);

    return (
        <div className={`relative h-screen w-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <MapContainer
                center={[48.8566, 2.3522]} // Start over Paris/Europe
                zoom={5}
                scrollWheelZoom={true}
                className="h-full w-full outline-none"
                zoomControl={false}
                zoomSnap={0.5} // Smooth fractional zoom
                zoomDelta={0.5} // Small steps
                wheelPxPerZoomLevel={120} // Gentle scroll
            >
                <MapController onBoundsChange={setBounds} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url={isDarkMode
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                />

                {/* Route from Origin to Plane to Destination */}
                {selectedFlight && (
                    <>
                        {/* Traveled Path (Simulated or Real) */}
                        {flightPath.length > 1 && (
                            <Polyline
                                positions={flightPath}
                                pathOptions={{ color: '#0ea5e9', weight: 4, opacity: 0.8 }} // Sky Blue
                            />
                        )}

                        {/* Planned Route (Origin -> Destination Great Circle projection approx) */}
                        {(() => {
                            const originCoords = getAirportCoords(selectedFlight.origin_airport);
                            const destCoords = getAirportCoords(selectedFlight.destination_airport);

                            if (originCoords && destCoords) {
                                return (
                                    <>
                                        {/* Full Route Line */}
                                        <Polyline
                                            positions={[originCoords, destCoords]}
                                            pathOptions={{ color: '#6366f1', weight: 2, dashArray: '6, 6', opacity: 0.5 }} // Indigo Dashed
                                        />
                                        {/* Origin Marker */}
                                        <Marker position={originCoords} icon={
                                            L.divIcon({
                                                className: 'bg-transparent',
                                                html: `<div class="w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-lg"></div>`
                                            })
                                        }>
                                            <Popup className="text-slate-900 font-bold">Origin: {selectedFlight.origin_airport}</Popup>
                                        </Marker>
                                        {/* Destination Marker */}
                                        <Marker position={destCoords} icon={
                                            L.divIcon({
                                                className: 'bg-transparent',
                                                html: `<div class="w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`
                                            })
                                        }>
                                            <Popup className="text-slate-900 font-bold">Dest: {selectedFlight.destination_airport}</Popup>
                                        </Marker>
                                    </>
                                );
                            }
                            return null;
                        })()}
                    </>
                )}

                {/* Helper to center map on selection */}
                {selectedFlight && <FlyToSelection position={[selectedFlight.latitude, selectedFlight.longitude]} />}

                {/* Optimized Canvas Layer for 20k+ flights */}
                <FlightCanvasLayer
                    flights={visibleFlights}
                    onFlightClick={setSelectedFlight}
                    selectedFlightId={selectedFlight?.icao24}
                    isDarkMode={isDarkMode}
                />

                {/* Selected Flight Highlighting: Render ONE detailed DOM marker for the selected flight */}
                {selectedFlight && (
                    <PlaneMarker
                        plane={selectedFlight}
                        onClick={() => { }} // Already selected
                        isSelected={true}
                        isDarkMode={isDarkMode}
                    />
                )}
            </MapContainer>

            {/* UI Overlay */}
            {/* UI Overlay (Top Left) */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
                <div className={`backdrop-blur-md p-4 rounded-2xl border shadow-xl pointer-events-auto transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
                            SkyStream
                        </h1>
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-orange-100 hover:bg-orange-200 text-orange-500'}`}
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {flights.length} visible flights
                        </p>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Find flight (e.g. AAL)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors ${isDarkMode
                                ? 'bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500'
                                : 'bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400'
                                }`}
                        />
                        <Search size={16} className={`absolute left-3 top-2.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    </form>
                </div>
            </div>

            {/* Bottom-left Loader */}
            {loading && (
                <div className={`absolute bottom-4 left-4 z-[1000] flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur border shadow-2xl text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 ${isDarkMode
                    ? 'bg-slate-900/90 border-slate-700 text-sky-400'
                    : 'bg-white/90 border-slate-300 text-sky-600'
                    }`}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading Flights...</span>
                </div>
            )}

            <FlightInfo
                plane={selectedFlight}
                onClose={() => setSelectedFlight(null)}
                isDarkMode={isDarkMode}
            />
        </div >
    );
};

export default Map;
