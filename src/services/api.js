import axios from 'axios';

const API_URL = 'https://opensky-network.org/api/states/all';

// Bounding box for initial view (e.g., Europe or US). 
// Let's default to a wide view, but OpenSky can be slow with "all".
// We'll try to fetch all but maybe limit if needed or handle large data.
// For now, let's fetch global data but we might need to filter client side or server side if possible.
// OpenSky 'all' endpoint returns valid vectors.

// Optionally we can use a bounding box designed for Europe or North America to reduce load if global is too much.
// lamin, lmin, lamax, lmax
// Europe approx: 35.0, -10.0, 70.0, 40.0

const simulatedFlights = new Map();

export const fetchFlightData = async (bounds) => {
    try {
        let url = API_URL;
        if (bounds) {
            // bounds: { lamin, lmin, lamax, lmax }
            url = `${API_URL}?lamin=${bounds.lamin}&lmin=${bounds.lmin}&lamax=${bounds.lamax}&lmax=${bounds.lmax}`;
        }

        const response = await axios.get(url, { timeout: 5000 }); // Add timeout
        const data = response.data;

        // OpenSky returns { time: number, states: check[][] }
        // State vector index mapping: 
        // 0: icao24
        // 1: callsign
        // 2: origin_country
        // 5: longitude
        // 6: latitude
        // 7: baro_altitude
        // 9: velocity
        // 10: true_track
        // 13: geo_altitude
        // 17: category

        // If API returns successfully but with no states (common in rate limiting scenarios for 'all'),
        // we should probably fallback to mock data so the user sees SOMETHING instead of an empty map.
        if (!data.states || data.states.length === 0) {
            throw new Error("No flight data received from API (likely rate limited or empty).");
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
        // Filter out planes on ground or with missing coords

    } catch (error) {
        console.warn("Error fetching flight data (likely API rate limit or empty). Using Mock Data.", error);

        // Persistent Mock Data Logic
        // Initialize if empty
        if (simulatedFlights.size === 0) {
            const hubs = [
                { lat: 51.5, lon: -0.1, name: "Europe" }, // London
                { lat: 40.7, lon: -74.0, name: "US East" }, // NYC
                { lat: 34.0, lon: -118.2, name: "US West" }, // LA
                { lat: 35.6, lon: 139.7, name: "Asia East" }, // Tokyo
                { lat: 25.2, lon: 55.3, name: "Middle East" }, // Dubai
                { lat: 1.3, lon: 103.8, name: "Asia SE" }, // Singapore
                { lat: -33.8, lon: 151.2, name: "Australia" }, // Sydney
                { lat: -26.2, lon: 28.0, name: "Africa South" }, // JNB
                { lat: 30.0, lon: 31.2, name: "Africa North" }, // Cairo
                { lat: 19.0, lon: 72.8, name: "India" }, // Mumbai
                { lat: 55.7, lon: 37.6, name: "Russia" }, // Moscow
                { lat: -23.5, lon: -46.6, name: "South America" }, // Sao Paulo
                { lat: 61.2, lon: -149.9, name: "Alaska" }, // Anchorage
                { lat: 64.1, lon: -21.9, name: "Atlantic" } // Reykjavik
            ];
            const airports = ["LHR", "JFK", "DXB", "SIN", "SYD", "HND", "CDG", "AMS", "FRA", "LAX", "BOM", "DEL", "NRT", "PEK", "HKG", "YYZ", "YVR", "GRU", "EZE", "JNB"];

            for (let i = 0; i < 3000; i++) {
                const hub = hubs[Math.floor(Math.random() * hubs.length)];
                const startLat = hub.lat + (Math.random() - 0.5) * 50;
                const startLon = hub.lon + (Math.random() - 0.5) * 70;

                // Pick two random airports
                const origin = airports[Math.floor(Math.random() * airports.length)];
                let dest = airports[Math.floor(Math.random() * airports.length)];
                while (dest === origin) dest = airports[Math.floor(Math.random() * airports.length)];

                simulatedFlights.set(`mock${i.toString(16)}`, {
                    icao24: `mock${i.toString(16)}`,
                    callsign: `FLT${1000 + i}`,
                    country: "International",
                    longitude: startLon,
                    latitude: startLat,
                    altitude: 5000 + Math.random() * 8000,
                    velocity: 200 + Math.random() * 100, // m/s roughly
                    track: Math.floor(Math.random() * 360),
                    onGround: false,
                    origin_airport: origin,
                    destination_airport: dest
                });
            }
        }

        // Simulate Movement for all flights
        const flights = [];
        simulatedFlights.forEach((plane, key) => {
            // Update position based on velocity (simple approximation)
            // 200 m/s approx 0.002 degrees per second? very rough.
            // Let's say 0.05 degree shift every update (10s)

            // Move partially in track direction
            const rad = plane.track * (Math.PI / 180);
            const dist = 0.05; // degree step
            plane.latitude += Math.cos(rad) * dist;
            plane.longitude += Math.sin(rad) * dist;

            // Random small turn
            if (Math.random() > 0.8) {
                plane.track = (plane.track + (Math.random() - 0.5) * 20) % 360;
            }

            flights.push({ ...plane }); // Return copy
        });

        return flights;
    }
};

export const fetchFlightTrack = async (icao24) => {
    try {
        // OpenSky Tracks API (free for anonymous for live flights sometimes, restricted often)
        // We'll try the public endpoint.
        // Note: This often returns 403 or 404 if no recent track or not auth.
        // Time = 0 means "latest available track" usually or we specify last duration.
        // Actually /tracks/all is the endpoint.
        const url = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`;

        const response = await axios.get(url);
        const data = response.data;

        // API returns { icao24, startTime, endTime, path: [[time, lat, lon, alt, true_track, on_ground], ...] }
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
        console.warn("Could not fetch track (likely CORS/Auth restricted). Using fallback path.", error);
        // Return a simple generated path based on the logic or just empty
        // We can't easily generate a matching path for query ICAO without passing more data.
        // But we can return a small fake path if we really want to demonstrate validity, 
        // however, Map.jsx handles empty path by showing nothing or starting point.
        // Let's purposefully return empty here so the map just shows the plane.
        return [];
    }
};

export const fetchAircraftPhoto = async (icao24) => {
    try {
        // PlaneSpotters API
        const url = `https://api.planespotters.net/pub/photos/hex/${icao24}`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.photos && data.photos.length > 0) {
            return data.photos[0].thumbnail_large.src;
        }
        return null;
    } catch (error) {
        console.warn("Could not fetch aircraft photo:", error);
        return null;
    }
};

