
import { useState, useEffect } from 'react';
import { X, Plane, Gauge, Eclipse, MapPin, Globe, Calendar, Building2, Map } from 'lucide-react';
import { fetchAircraftPhoto } from '../services/api';
import { getAirlineName } from '../data/airlines';
import { getAirportName } from '../data/airports';


const FlightInfo = ({ plane, onClose }) => {
    const [photo, setPhoto] = useState(null);

    useEffect(() => {
        if (plane) {
            setPhoto(null); // Reset
            // If mock photo exists, use it
            if (plane.photo) {
                setPhoto(plane.photo);
            } else {
                // Fetch real photo
                const getPhoto = async () => {
                    const url = await fetchAircraftPhoto(plane.icao24, plane.callsign);
                    setPhoto(url);
                };
                getPhoto();
            }
        }
    }, [plane]);

    if (!plane) return null;

    const status = plane.onGround ? "On Ground" : "In Flight";
    const statusColor = plane.onGround ? "text-yellow-400" : "text-green-400";
    // Use helper to get full name
    const airlineName = getAirlineName(plane.callsign);

    return (
        <div className="absolute top-4 right-4 z-[1000] w-80 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden text-slate-100 transition-all duration-300 animate-in slide-in-from-right-10">

            <div className="w-full h-48 overflow-hidden relative group bg-slate-950">
                {/* Real Photo or Gradient Fallback */}
                {photo ? (
                    <div className="w-full h-full relative">
                        <img
                            src={photo}
                            alt={plane.callsign}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
                    </div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <Plane size={64} className="text-slate-700 opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                    </div>
                )}
            </div>

            <div className="p-6 relative">
                {/* Decorative line if no photo/header image used to exist, but now we have 3D header */}
                {/* <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-purple-500"></div> */}

                <div className="flex justify-between items-start mb-6">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                            {plane.callsign || plane.icao24}
                        </h2>
                        <p className="text-sm font-semibold text-sky-400 mt-1 flex items-center gap-1.5">
                            <Building2 size={12} /> {airlineName}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{plane.country}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800/50 rounded-full transition-colors text-slate-400 hover:text-white z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Route / Status */}
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-3">
                            <div className="text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase">Origin</p>
                                <p className="text-sm font-bold text-white max-w-[100px] leading-tight mx-auto">{getAirportName(plane.origin_airport)}</p>
                            </div>
                            <Plane size={24} className="text-slate-500 transform rotate-90 shrink-0 mx-2" />
                            <div className="text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase">Dest</p>
                                <p className="text-sm font-bold text-white max-w-[100px] leading-tight mx-auto">{getAirportName(plane.destination_airport)}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                            <span className="text-xs text-slate-400 font-semibold uppercase">Status</span>
                            <span className={`text-sm font-bold flex items-center gap-2 ${statusColor}`}>
                                <span className={`w-2 h-2 rounded-full ${plane.onGround ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
                                {status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-sky-400" />
                                <p className="text-xs text-slate-400 uppercase font-semibold">Departure</p>
                            </div>
                            <p className="text-md font-medium text-white">
                                {plane.departure_time ? new Date(plane.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                            </p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-indigo-400" />
                                <p className="text-xs text-slate-400 uppercase font-semibold">Arrival</p>
                            </div>
                            <p className="text-md font-medium text-white">
                                {plane.arrival_time ? new Date(plane.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                            </p>
                        </div>

                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Gauge size={14} className="text-blue-400" />
                                <p className="text-xs text-slate-400 uppercase font-semibold">Speed</p>
                            </div>
                            <p className="text-lg font-medium">{Math.round(plane.velocity * 3.6)} <span className="text-sm text-slate-500">km/h</span></p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Plane size={14} className="text-purple-400" />
                                <p className="text-xs text-slate-400 uppercase font-semibold">Alt</p>
                            </div>
                            <p className="text-lg font-medium">{Math.round(plane.altitude)} <span className="text-sm text-slate-500">m</span></p>
                        </div>
                    </div>

                    <div className="flex items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                            <MapPin size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Coordinates</p>
                            <p className="text-sm font-mono text-slate-300">
                                {plane.latitude.toFixed(2)}, {plane.longitude.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/50 text-center flex justify-between items-center px-2">
                    <p className="text-[10px] text-slate-500 font-mono">ID: {plane.icao24}</p>
                    <p className="text-[10px] text-slate-600 font-mono">Photo © PlaneSpotters.net</p>
                </div>
            </div>
        </div>
    );
};

export default FlightInfo;
