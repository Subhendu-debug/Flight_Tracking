export const airports = {
    "LHR": "London Heathrow, UK",
    "JFK": "John F. Kennedy Intl, New York, USA",
    "DXB": "Dubai International, UAE",
    "SIN": "Changi Airport, Singapore",
    "SYD": "Sydney Kingsford Smith, Australia",
    "HND": "Haneda Airport, Tokyo, Japan",
    "CDG": "Charles de Gaulle, Paris, France",
    "AMS": "Schiphol Airport, Amsterdam, NL",
    "FRA": "Frankfurt Airport, Germany",
    "LAX": "Los Angeles Intl, USA",
    "BOM": "Chhatrapati Shivaji Maharaj Intl, Mumbai, India",
    "DEL": "Indira Gandhi Intl, Delhi, India",
    "NRT": "Narita Intl, Tokyo, Japan",
    "PEK": "Beijing Capital Intl, China",
    "HKG": "Hong Kong Intl, Hong Kong",
    "YYZ": "Toronto Pearson Intl, Canada",
    "YVR": "Vancouver Intl, Canada",
    "GRU": "São Paulo-Guarulhos Intl, Brazil",
    "EZE": "Ezeiza Intl, Buenos Aires, Argentina",
    "JNB": "O.R. Tambo Intl, Johannesburg, South Africa"
};

export const getAirportName = (code) => {
    if (!code) return "N/A";
    return airports[code] || code;
};
