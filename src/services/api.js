import axios from 'axios';
import { getAirportCoords } from '../data/airports'; // Import logic to get coords

const API_URL = 'https://opensky-network.org/api/states/all';

const simulatedFlights = new Map();

// Mock Data Assets
// Mock Data Assets
// const mockPhotos = [...]; // Removed to ensure no random pics

// Region-specific airlines for realism
const regionalAirlines = {
    US: ["AAL", "UAL", "DAL", "SWA", "JBU"],
    India: ["AIC", "IGO", "VTI", "SEJ"],
    Europe: ["BAW", "DLH", "AFR", "KLM", "RYR", "EZY"],
    Asia: ["JAL", "ANA", "SIA", "CPA", "KAL", "SCO"],
    China: ["CCA", "CSN", "CES", "CHH"],
    Global: ["UAE", "QFA", "ANZ", "ETH", "QTR"]
};

// Define regions for domestic flights
const domesticRoutes = {
    US: ["JFK", "LAX", "SFO", "ORD", "DFW", "DEN", "ATL", "MIA", "SEA", "BOS"],
    India: ["BOM", "DEL", "BLR", "MAA", "CCU", "HYD", "PNQ", "AMD", "GOI", "COK", "JAI"],
    Europe: ["LHR", "CDG", "AMS", "FRA", "MUC", "ZRH", "BCN", "MAD", "FCO", "IST"],
    Asia: ["HND", "NRT", "KIX", "ICN", "HKG", "SIN", "BKK", "KUL"],
    China: ["PEK", "PVG", "CAN", "SZX", "CTU"]
};

// All airports list
const allAirports = Object.values(domesticRoutes).flat().concat(["DXB", "SYD", "GRU", "JNB", "YYZ", "YVR", "EZE"]);

// Helper to calculate route parameters
const calculateRouteParams = (origin, dest) => {
    const originCoords = getAirportCoords(origin);
    const destCoords = getAirportCoords(dest);

    if (!originCoords || !destCoords) return null;

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

    const track = (toDeg(Math.atan2(y, x)) + 360) % 360; // Normalize 0-360

    // Calculate Distance (Haversine) in km
    const R = 6371; // Radius of the earth in km
    const dLat = lat2 - lat1;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return { originCoords, destCoords, track, distance };
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
        // console.warn("Error fetching flight data. Using Mock Data."); // Reduce noise

        if (simulatedFlights.size === 0) {
            for (let i = 0; i < 4000; i++) { // Generate 4000 flights
                // Decision: 50% Domestic, 50% International
                const isDomestic = Math.random() < 0.5;
                let origin, dest, airlines, regionKey;

                if (isDomestic) {
                    const regions = Object.keys(domesticRoutes);
                    regionKey = regions[Math.floor(Math.random() * regions.length)];
                    const regionAirports = domesticRoutes[regionKey];

                    origin = regionAirports[Math.floor(Math.random() * regionAirports.length)];
                    dest = regionAirports[Math.floor(Math.random() * regionAirports.length)];
                    while (dest === origin) dest = regionAirports[Math.floor(Math.random() * regionAirports.length)];

                    airlines = regionalAirlines[regionKey] || regionalAirlines.Global;
                } else {
                    regionKey = "Global"; // Default for international
                    origin = allAirports[Math.floor(Math.random() * allAirports.length)];
                    dest = allAirports[Math.floor(Math.random() * allAirports.length)];
                    while (dest === origin) dest = allAirports[Math.floor(Math.random() * allAirports.length)];
                    airlines = regionalAirlines.Global.concat(regionalAirlines.Europe, regionalAirlines.US, regionalAirlines.Asia);
                }

                // Pick an airline and generate callsign
                const airline = airlines[Math.floor(Math.random() * airlines.length)];
                const flightNum = Math.floor(Math.random() * 900) + 100;

                // Calculate Spawn Position ALONG the route
                const routeParams = calculateRouteParams(origin, dest);

                let startLat, startLon, track, startTime, endTime;

                if (routeParams) {
                    const { originCoords, destCoords, track: routeTrack, distance } = routeParams;
                    track = routeTrack;

                    // Estimate Duration
                    const velocityKmH = 850;
                    const durationHours = distance / velocityKmH;
                    const durationMs = durationHours * 60 * 60 * 1000;

                    // Random progress 10-90%
                    const t = 0.1 + Math.random() * 0.8;

                    // Calculate exact current position based on 't'
                    startLat = originCoords[0] + t * (destCoords[0] - originCoords[0]);
                    startLon = originCoords[1] + t * (destCoords[1] - originCoords[1]);

                    const now = Date.now();
                    // Back-calculate Departure Time so that 'now' corresponds to 't'
                    const elapsedMs = durationMs * t;
                    startTime = new Date(now - elapsedMs).toISOString();
                    endTime = new Date(now + (durationMs - elapsedMs)).toISOString();

                } else {
                    // Fallback to random if coords missing (rare)
                    startLat = 20 + (Math.random() - 0.5) * 60;
                    startLon = (Math.random() - 0.5) * 180;
                    track = Math.random() * 360;
                    startTime = new Date().toISOString();
                    endTime = new Date(Date.now() + 3600000).toISOString();
                }

                const countryName = isDomestic ? (regionKey === "US" ? "United States" : regionKey) : "International";

                // Store Start/End Coords for robust interpolation
                const originCoordsVal = routeParams ? routeParams.originCoords : [startLat, startLon];
                const destCoordsVal = routeParams ? routeParams.destCoords : [startLat, startLon];

                simulatedFlights.set(`mock${i.toString(16)}`, {
                    icao24: `mock${i.toString(16)}`,
                    callsign: `${airline}${flightNum}`,
                    country: countryName,
                    longitude: startLon,
                    latitude: startLat,
                    altitude: 5000 + Math.random() * 8000,
                    velocity: 200 + Math.random() * 100, // m/s
                    track: track,
                    onGround: false,
                    origin_airport: origin,
                    destination_airport: dest,
                    start_coords: originCoordsVal,
                    end_coords: destCoordsVal,
                    photo: null,
                    departure_time: startTime,
                    arrival_time: endTime
                });
            }
        }

        // Simulate Movement for all flights
        const flights = [];
        simulatedFlights.forEach((plane, key) => {
            const now = Date.now();
            const arrivalTime = new Date(plane.arrival_time).getTime();
            const departureTime = new Date(plane.departure_time).getTime();

            // Check if flight has arrived
            if (now > arrivalTime) {
                // RESPRAWN LOGIC:
                const newOrigin = plane.destination_airport || "LHR";
                let newDest = allAirports[Math.floor(Math.random() * allAirports.length)];
                while (newDest === newOrigin) {
                    newDest = allAirports[Math.floor(Math.random() * allAirports.length)];
                }

                const route = calculateRouteParams(newOrigin, newDest);

                if (route) {
                    const { originCoords, destCoords, track: newTrack, distance } = route;

                    plane.origin_airport = newOrigin;
                    plane.destination_airport = newDest;
                    plane.start_coords = originCoords;
                    plane.end_coords = destCoords;
                    plane.latitude = originCoords[0];
                    plane.longitude = originCoords[1];
                    plane.track = newTrack;

                    const velocityKmH = 850;
                    const durationHours = distance / velocityKmH;
                    const durationMs = durationHours * 60 * 60 * 1000;

                    plane.departure_time = new Date(now).toISOString();
                    plane.arrival_time = new Date(now + durationMs).toISOString();
                }
            } else {
                // TIME-BASED INTERPOLATION (Fixes overshoot/miscalculation)
                const totalDuration = arrivalTime - departureTime;

                if (totalDuration > 0 && plane.start_coords && plane.end_coords) {
                    const elapsed = now - departureTime;
                    const t = Math.max(0, Math.min(1, elapsed / totalDuration)); // Clamp 0-1

                    const startLat = plane.start_coords[0];
                    const startLon = plane.start_coords[1];
                    const endLat = plane.end_coords[0];
                    const endLon = plane.end_coords[1];

                    // Update Position
                    plane.latitude = startLat + (endLat - startLat) * t;
                    plane.longitude = startLon + (endLon - startLon) * t;

                    // Update Track to point to destination (Simple bearing calculation)
                    const toRad = deg => deg * Math.PI / 180;
                    const toDeg = rad => rad * 180 / Math.PI;

                    const dLon = toRad(endLon - plane.longitude);
                    const lat1 = toRad(plane.latitude);
                    const lat2 = toRad(endLat);

                    const y = Math.sin(dLon) * Math.cos(lat2);
                    const x = Math.cos(lat1) * Math.sin(lat2) -
                        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

                    plane.track = (toDeg(Math.atan2(y, x)) + 360) % 360;
                } else {
                    // Fallback for old planes or missing coords (incremental)
                    const rad = plane.track * (Math.PI / 180);
                    const dist = 0.05;
                    plane.latitude += Math.cos(rad) * dist;
                    plane.longitude += Math.sin(rad) * dist;
                }
            }

            flights.push({ ...plane });
        });

        // Filter by bounds if provided
        if (bounds) {
            const { lamin, lmin, lamax, lmax } = bounds;
            return flights.filter(f =>
                f.latitude >= lamin &&
                f.latitude <= lamax &&
                f.longitude >= lmin &&
                f.longitude <= lmax
            );
        }

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

// Representative photos for major airlines (fallback for mock data)
const airlinePhotos = {
    "AAL": "https://images.unsplash.com/photo-1542296332-2e44a996aa21?q=80&w=800&auto=format&fit=crop", // AA generic
    "UAL": "https://images.unsplash.com/photo-1559268975-54e588e363b0?q=80&w=800&auto=format&fit=crop", // United
    "DAL": "https://images.unsplash.com/photo-1583073600538-f9d9b246be1b?q=80&w=800&auto=format&fit=crop", // Delta
    "BAW": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop", // BA
    "DLH": "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=800&auto=format&fit=crop", // Lufthansa
    "AFR": "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?q=80&w=800&auto=format&fit=crop", // Air France
    "UAE": "https://images.unsplash.com/photo-1542296332-2e44a996aa21?q=80&w=800&auto=format&fit=crop", // Emirates (placeholder AA for now, need valid Unsplash)
    "KLM": "https://images.unsplash.com/photo-1520437351633-315877c3d566?q=80&w=800&auto=format&fit=crop", // KLM
    "SWA": "https://images.unsplash.com/photo-1569154941061-e0e964b4c093?q=80&w=800&auto=format&fit=crop", // Southwest
    "SCO": "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?q=80&w=800&auto=format&fit=crop", // Scoot (Yellow/White Plane or generic)
    "Default": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop" // Generic Plane
};

export const fetchAircraftPhoto = async (icao24, callsign) => {
    try {
        // 1. Try Real Photo API first
        const url = `https://api.planespotters.net/pub/photos/hex/${icao24}`;
        const response = await axios.get(url, { timeout: 2000 }); // Low timeout to fallback quickly
        const data = response.data;

        if (data.photos && data.photos.length > 0) {
            return data.photos[0].thumbnail_large.src;
        }

        throw new Error("No real photo found");
    } catch (error) {
        // 2. Representative Fallback Logic
        if (callsign) {
            const prefix = callsign.substring(0, 3).toUpperCase();
            if (airlinePhotos[prefix]) {
                return airlinePhotos[prefix];
            }
        }
        // 3. Generic Fallback
        return null; // Return null to show the gradient icon if no specific airline match
    }
};
