import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchFlightData, fetchFlightTrack } from '../services/api';
import { getAirportCoords } from '../data/airports';
import L from 'leaflet';
import PlaneMarker from './PlaneMarker';
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
        onBoundsChange(map.getBounds());
    }, [map]);

    return null;
};

const Map = () => {
    const [flights, setFlights] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [flightPath, setFlightPath] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadProgress, setLoadProgress] = useState(0);
    const [bounds, setBounds] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const getData = async () => {
        // Fetch all data for now. Can be optimized to fetch by bounds.
        // European bounds example: { lamin: 35, lmin: -10, lamax: 70, lmax: 40 }
        // Let's try to fetch global or a large area.
        const data = await fetchFlightData();
        // If it's mock data (length 7), we don't want to slice it away if we had a logic error.
        // But slice(0, 300) is fine for 7 items.
        // However, let's just setFlights directly.
        setFlights(data);

        // Finish loading animation
        setLoadProgress(100);
        setTimeout(() => {
            setLoading(false);
        }, 500); // Small delay to show 100%

        setLastUpdated(new Date());
    };

    // Simulated Loading Progress
    useEffect(() => {
        if (loading && loadProgress < 90) {
            const timer = setInterval(() => {
                setLoadProgress(prev => {
                    const next = prev + Math.random() * 15;
                    return next > 90 ? 90 : next;
                });
            }, 200);
            return () => clearInterval(timer);
        }
    }, [loading, loadProgress]);

    useEffect(() => {
        getData();
        const interval = setInterval(getData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

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
        if (!bounds) return flights; // Render all if bounds not ready (or could be 0)
        // Pad bounds slightly to avoid popping issues at edges
        const paddedBounds = bounds.pad(0.1);
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

                {visibleFlights.map((flight) => (
                    <PlaneMarker
                        key={flight.icao24}
                        plane={flight}
                        onClick={setSelectedFlight}
                        isSelected={selectedFlight?.icao24 === flight.icao24}
                        isDarkMode={isDarkMode}
                    />
                ))}
            </MapContainer>

            {/* UI Overlay */}
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
                            {loading ? 'Fetching data...' : `${flights.length} active flights`}
                        </p>
                        {!loading && flights.length < 10 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                SIMULATED
                            </span>
                        )}
                        <span className={`text-[10px] ml-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            ({visibleFlights.length} visible)
                        </span>
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

            <FlightInfo
                plane={selectedFlight}
                onClose={() => setSelectedFlight(null)}
                isDarkMode={isDarkMode}
            />

            {loading && (
                <div className={`absolute inset-0 z-[2000] flex items-center justify-center transition-opacity duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="flex flex-col items-center w-full max-w-md px-6">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent mb-8 animate-pulse">
                            SkyStream
                        </h1>
                        <div className={`w-full rounded-full h-2 overflow-hidden border shadow-[0_0_20px_rgba(14,165,233,0.3)] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'}`}>
                            <div
                                className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-full transition-all duration-300 ease-out"
                                style={{ width: `${loadProgress}%` }}
                            ></div>
                        </div>
                        <div className={`flex justify-between w-full mt-2 text-xs font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <span>INITIALIZING SYSTEM...</span>
                            <span>{Math.round(loadProgress)}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Map;
