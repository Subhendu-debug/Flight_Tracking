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

export const fetchFlightData = async (bounds) => {
    try {
        let url = API_URL;
        if (bounds) {
            // bounds: { lamin, lmin, lamax, lmax }
            url = `${API_URL}?lamin=${bounds.lamin}&lmin=${bounds.lmin}&lamax=${bounds.lamax}&lmax=${bounds.lmax}`;
        }

        const response = await axios.get(url);
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

        if (!data.states) return [];

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
        console.error("Error fetching flight data:", error);
        return [];
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
        console.warn("Could not fetch track (likely CORS/Auth restricted):", error);
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

