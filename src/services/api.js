import axios from 'axios';
import { getAirportCoords } from '../data/airports'; // Import logic to get coords

const API_URL = 'https://opensky-network.org/api/states/all';

const simulatedFlights = new Map();

// Mock Data Assets
const mockPhotos = [
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542296332-2e44a996aa21?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559268975-54e588e363b0?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583073600538-f9d9b246be1b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1520437351633-315877c3d566?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1569154941061-e0e964b4c093?q=80&w=800&auto=format&fit=crop"
];

// Region-specific airlines for realism
const regionalAirlines = {
    US: ["AAL", "UAL", "DAL", "SWA", "JBU"],
    India: ["AIC", "IGO", "VTI", "SEJ"],
    Europe: ["BAW", "DLH", "AFR", "KLM", "RYR", "EZY"],
    Asia: ["JAL", "ANA", "SIA", "CPA", "KAL"],
    China: ["CCA", "CSN", "CES", "CHH"],
    Global: ["UAE", "QFA", "ANZ", "ETH", "QTR"]
};

export const fetchFlightData = async (bounds) => {
    try {
        let url = API_URL;
        if (bounds) {
            url = `${API_URL}?lamin=${bounds.lamin}&lmin=${bounds.lmin}&lamax=${bounds.lamax}&lmax=${bounds.lmax}`;
        }

        const response = await axios.get(url, { timeout: 5000 });
        const data = response.data;

        if (!data.states || data.states.length === 0) {
            throw new Error("No flight data received from API.");
        }

        return data.states.map(state => ({
            icao24: state[0],
            callsign: state[1]?.trim(),
            country: state[2],
            longitude: state[5],
            latitude: state[6],
            altitude: state[7],
            velocity: state[9],
            track: state[10],
            onGround: state[8]
        })).filter(plane => plane.longitude && plane.latitude && !plane.onGround);

    } catch (error) {
        console.warn("Error fetching flight data. Using Mock Data.", error);

        if (simulatedFlights.size === 0) {
            // Define regions for domestic flights
            const domesticRoutes = {
                US: ["JFK", "LAX", "SFO", "ORD", "DFW", "DEN", "ATL", "MIA", "SEA", "BOS"],
                India: ["BOM", "DEL", "BLR", "MAA", "CCU", "HYD"],
                Europe: ["LHR", "CDG", "AMS", "FRA", "MUC", "ZRH", "BCN", "MAD", "FCO", "IST"],
                Asia: ["HND", "NRT", "KIX", "ICN", "HKG", "SIN", "BKK", "KUL"],
                China: ["PEK", "PVG", "CAN", "SZX", "CTU"]
            };

            const allAirports = Object.values(domesticRoutes).flat().concat(["DXB", "SYD", "GRU", "JNB", "YYZ", "YVR", "EZE"]);

            for (let i = 0; i < 3000; i++) {
                // Decision: 50% Domestic, 50% International
                const isDomestic = Math.random() < 0.5;
                let origin, dest, airlines;

                if (isDomestic) {
                    const regions = Object.keys(domesticRoutes);
                    const regionKey = regions[Math.floor(Math.random() * regions.length)];
                    const regionAirports = domesticRoutes[regionKey];

                    origin = regionAirports[Math.floor(Math.random() * regionAirports.length)];
                    dest = regionAirports[Math.floor(Math.random() * regionAirports.length)];
                    while (dest === origin) dest = regionAirports[Math.floor(Math.random() * regionAirports.length)];

                    airlines = regionalAirlines[regionKey] || regionalAirlines.Global;
                } else {
                    origin = allAirports[Math.floor(Math.random() * allAirports.length)];
                    dest = allAirports[Math.floor(Math.random() * allAirports.length)];
                    while (dest === origin) dest = allAirports[Math.floor(Math.random() * allAirports.length)];
                    airlines = regionalAirlines.Global.concat(regionalAirlines.Europe, regionalAirlines.US, regionalAirlines.Asia);
                }

                // Pick an airline and generate callsign
                const airline = airlines[Math.floor(Math.random() * airlines.length)];
                const flightNum = Math.floor(Math.random() * 900) + 100;

                // Assign a mock photo
                const mockPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];

                // Calculate Spawn Position ALONG the route
                const originCoords = getAirportCoords(origin);
                const destCoords = getAirportCoords(dest);

                let startLat, startLon, track;

                if (originCoords && destCoords) {
                    // Linear interpolation for spawn point (visual approx)
                    // t = 0 (origin) -> 1 (dest). Spawn somewhere in middle 10-90%
                    const t = 0.1 + Math.random() * 0.8;
                    startLat = originCoords[0] + t * (destCoords[0] - originCoords[0]);
                    startLon = originCoords[1] + t * (destCoords[1] - originCoords[1]);

                    // Calculate Bearing (Great Circle - Forward Azimuth)
                    const toRad = (deg) => deg * Math.PI / 180;
                    const toDeg = (rad) => rad * 180 / Math.PI;

                    const lat1 = toRad(originCoords[0]);
                    const lon1 = toRad(originCoords[1]);
                    const lat2 = toRad(destCoords[0]);
                    const lon2 = toRad(destCoords[1]);

                    const dLon = lon2 - lon1;

                    const y = Math.sin(dLon) * Math.cos(lat2);
                    const x = Math.cos(lat1) * Math.sin(lat2) -
                        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

                    track = (toDeg(Math.atan2(y, x)) + 360) % 360; // Normalize 0-360

                } else {
                    // Fallback to random if coords missing (rare)
                    startLat = 20 + (Math.random() - 0.5) * 60;
                    startLon = (Math.random() - 0.5) * 180;
                    track = Math.random() * 360;
                }

                simulatedFlights.set(`mock${i.toString(16)}`, {
                    icao24: `mock${i.toString(16)}`,
                    callsign: `${airline}${flightNum}`,
                    country: "International",
                    longitude: startLon,
                    latitude: startLat,
                    altitude: 5000 + Math.random() * 8000,
                    velocity: 200 + Math.random() * 100,
                    track: track,
                    onGround: false,
                    origin_airport: origin,
                    destination_airport: dest,
                    photo: mockPhoto
                });
            }
        }

        // Simulate Movement for all flights
        const flights = [];
        simulatedFlights.forEach((plane, key) => {
            const rad = plane.track * (Math.PI / 180);
            const dist = 0.05; // degree step
            plane.latitude += Math.cos(rad) * dist;
            plane.longitude += Math.sin(rad) * dist;
            flights.push({ ...plane });
        });

        return flights;
    }
};

export const fetchFlightTrack = async (icao24) => {
    try {
        const url = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`;
        const response = await axios.get(url);
        const data = response.data;

        if (data && data.path) {
            return data.path.map(p => ({
                lat: p[1],
                lng: p[2],
                alt: p[3],
                time: p[0]
            }));
        }
        return [];
    } catch (error) {
        return [];
    }
};

export const fetchAircraftPhoto = async (icao24) => {
    try {
        const url = `https://api.planespotters.net/pub/photos/hex/${icao24}`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.photos && data.photos.length > 0) {
            return data.photos[0].thumbnail_large.src;
        }
        return null;
    } catch (error) {
        return null;
    }
};
