export const airports = {
    // International Hubs
    "LHR": { name: "London Heathrow, UK", lat: 51.4700, lon: -0.4543 },
    "JFK": { name: "John F. Kennedy Intl, New York, USA", lat: 40.6413, lon: -73.7781 },
    "DXB": { name: "Dubai International, UAE", lat: 25.2532, lon: 55.3657 },
    "SIN": { name: "Changi Airport, Singapore", lat: 1.3644, lon: 103.9915 },
    "SYD": { name: "Sydney Kingsford Smith, Australia", lat: -33.9399, lon: 151.1753 },
    "HND": { name: "Haneda Airport, Tokyo, Japan", lat: 35.5494, lon: 139.7798 },
    "CDG": { name: "Charles de Gaulle, Paris, France", lat: 49.0097, lon: 2.5479 },
    "AMS": { name: "Schiphol Airport, Amsterdam, NL", lat: 52.3105, lon: 4.7683 },
    "FRA": { name: "Frankfurt Airport, Germany", lat: 50.0333, lon: 8.5706 },
    "LAX": { name: "Los Angeles Intl, USA", lat: 33.9416, lon: -118.4085 },
    "YYZ": { name: "Toronto Pearson Intl, Canada", lat: 43.6777, lon: -79.6248 },
    "GRU": { name: "São Paulo-Guarulhos Intl, Brazil", lat: -23.4256, lon: -46.4803 },
    "JNB": { name: "O.R. Tambo Intl, Johannesburg, South Africa", lat: -26.1367, lon: 28.2411 },
    "PEK": { name: "Beijing Capital Intl, China", lat: 40.0799, lon: 116.6031 },
    "YVR": { name: "Vancouver Intl, Canada", lat: 49.1947, lon: -123.1762 },
    "EZE": { name: "Ezeiza Intl, Buenos Aires, Argentina", lat: -34.8150, lon: -58.5348 },

    // US Domestic
    "SFO": { name: "San Francisco Intl, USA", lat: 37.6213, lon: -122.3790 },
    "ORD": { name: "O'Hare Intl, Chicago, USA", lat: 41.9742, lon: -87.9073 },
    "DFW": { name: "Dallas/Fort Worth Intl, USA", lat: 32.8998, lon: -97.0403 },
    "DEN": { name: "Denver Intl, USA", lat: 39.8561, lon: -104.6737 },
    "ATL": { name: "Hartsfield-Jackson Atlanta, USA", lat: 33.6407, lon: -84.4277 },
    "MIA": { name: "Miami Intl, USA", lat: 25.7959, lon: -80.2871 },
    "SEA": { name: "Seattle-Tacoma Intl, USA", lat: 47.4502, lon: -122.3088 },
    "BOS": { name: "Logan Intl, Boston, USA", lat: 42.3656, lon: -71.0096 },

    // India Domestic
    "BOM": { name: "Chhatrapati Shivaji Maharaj Intl, Mumbai, India", lat: 19.0896, lon: 72.8656 },
    "DEL": { name: "Indira Gandhi Intl, Delhi, India", lat: 28.5562, lon: 77.1000 },
    "BLR": { name: "Kempegowda Intl, Bengaluru, India", lat: 13.1986, lon: 77.7066 },
    "MAA": { name: "Chennai Intl, India", lat: 12.9941, lon: 80.1709 },
    "CCU": { name: "Netaji Subhash Chandra Bose Intl, Kolkata, India", lat: 22.6548, lon: 88.4467 },
    "HYD": { name: "Rajiv Gandhi Intl, Hyderabad, India", lat: 17.2403, lon: 78.4294 },
    "PNQ": { name: "Pune Airport, India", lat: 18.5823, lon: 73.9197 },
    "AMD": { name: "Sardar Vallabhbhai Patel Intl, Ahmedabad, India", lat: 23.0734, lon: 72.6266 },
    "GOI": { name: "Dabolim Airport, Goa, India", lat: 15.3800, lon: 73.8314 },
    "COK": { name: "Cochin Intl, Kochi, India", lat: 10.1518, lon: 76.3930 },
    "JAI": { name: "Jaipur Intl, India", lat: 26.8242, lon: 75.8122 },

    // Europe Regional
    "MUC": { name: "Munich Airport, Germany", lat: 48.3536, lon: 11.7750 },
    "ZRH": { name: "Zurich Airport, Switzerland", lat: 47.4581, lon: 8.5555 },
    "BCN": { name: "Barcelona-El Prat, Spain", lat: 41.2974, lon: 2.0833 },
    "MAD": { name: "Adolfo Suárez Madrid-Barajas, Spain", lat: 40.4839, lon: -3.5679 },
    "FCO": { name: "Leonardo da Vinci–Fiumicino, Rome, Italy", lat: 41.8003, lon: 12.2389 },
    "IST": { name: "Istanbul Airport, Turkey", lat: 41.2753, lon: 28.7519 },

    // Asia Regional
    "NRT": { name: "Narita Intl, Tokyo, Japan", lat: 35.7720, lon: 140.3929 },
    "KIX": { name: "Kansai Intl, Osaka, Japan", lat: 34.4320, lon: 135.2304 },
    "ICN": { name: "Incheon Intl, Seoul, South Korea", lat: 37.4602, lon: 126.4407 },
    "HKG": { name: "Hong Kong Intl, Hong Kong", lat: 22.3080, lon: 113.9185 },
    "BKK": { name: "Suvarnabhumi, Bangkok, Thailand", lat: 13.6900, lon: 100.7501 },
    "KUL": { name: "Kuala Lumpur Intl, Malaysia", lat: 2.7456, lon: 101.7099 },
    "SGN": { name: "Tan Son Nhat Intl, Ho Chi Minh, Vietnam", lat: 10.8185, lon: 106.6588 },

    // China Domestic
    "PVG": { name: "Shanghai Pudong Intl, China", lat: 31.1443, lon: 121.8083 },
    "CAN": { name: "Guangzhou Baiyun Intl, China", lat: 23.3959, lon: 113.2988 },
    "SZX": { name: "Shenzhen Bao'an Intl, China", lat: 22.6393, lon: 113.8107 },
    "CTU": { name: "Chengdu Shuangliu Intl, China", lat: 30.5785, lon: 103.9471 }
};

export const getAirportName = (code) => {
    if (!code) return "N/A";
    const airport = airports[code];
    return airport ? airport.name : code;
};

export const getAirportCoords = (code) => {
    if (!code) return null;
    const airport = airports[code];
    return airport ? [airport.lat, airport.lon] : null;
};
