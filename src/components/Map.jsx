import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchFlightData, fetchFlightTrack } from '../services/api';
import PlaneMarker from './PlaneMarker';
import FlightInfo from './FlightInfo';
import { Loader2 } from 'lucide-react';

const Map = () => {
    const [flights, setFlights] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [flightPath, setFlightPath] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const getData = async () => {
        // Fetch all data for now. Can be optimized to fetch by bounds.
        // European bounds example: { lamin: 35, lmin: -10, lamax: 70, lmax: 40 }
        // Let's try to fetch global or a large area.
        const data = await fetchFlightData();
        // If it's mock data (length 7), we don't want to slice it away if we had a logic error.
        // But slice(0, 300) is fine for 7 items.
        // However, let's just setFlights directly.
        setFlights(data);
        setLoading(false);
        setLastUpdated(new Date());
    };

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

    return (
        <div className="relative h-screen w-screen bg-slate-950">
            <MapContainer
                center={[48.8566, 2.3522]} // Start over Paris/Europe
                zoom={5}
                scrollWheelZoom={true}
                className="h-full w-full outline-none"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {selectedFlight && flightPath.length > 1 && (
                    <Polyline
                        positions={flightPath}
                        pathOptions={{ color: '#38bdf8', weight: 2, dashArray: '4, 8', opacity: 0.7 }}
                    />
                )}

                {flights.map((flight) => (
                    <PlaneMarker
                        key={flight.icao24}
                        plane={flight}
                        onClick={setSelectedFlight}
                        isSelected={selectedFlight?.icao24 === flight.icao24}
                    />
                ))}
            </MapContainer>

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-xl pointer-events-auto">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
                        SkyStream
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
                        <p className="text-xs text-slate-400 font-medium">
                            {loading ? 'Fetching data...' : `${flights.length} active flights`}
                        </p>
                        {!loading && flights.length < 10 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                SIMULATED
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <FlightInfo
                plane={selectedFlight}
                onClose={() => setSelectedFlight(null)}
            />

            {loading && flights.length === 0 && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
                        <p className="text-slate-300 font-medium tracking-wide">Initializing Radar...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Map;
