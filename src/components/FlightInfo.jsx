
import { useState, useEffect } from 'react';
import { X, Plane, Gauge, Eclipse, MapPin, Globe, Calendar, Building2, Map } from 'lucide-react';
import { fetchAircraftPhoto } from '../services/api';
import { getAirlineName } from '../data/airlines';
import { getAirportName } from '../data/airports';


const FlightInfo = ({ plane, onClose, isDarkMode = true }) => {
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
    const statusColor = plane.onGround ? "text-yellow-400" : "text-green-500";
    // Use helper to get full name
    const airlineName = getAirlineName(plane.callsign);

    const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-700 text-slate-100" : "bg-white/90 border-slate-200 text-slate-800";
    const subCardBg = isDarkMode ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-100/50 border-slate-200/50";
    const textMuted = isDarkMode ? "text-slate-400" : "text-slate-500";
    const textBright = isDarkMode ? "text-white" : "text-slate-900";

    return (
        <div className={`absolute top-4 right-4 z-[1000] w-80 backdrop-blur-md rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-right-10 ${cardBg}`}>

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
                    <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-200 to-slate-300'}`}>
                        <Plane size={64} className={`${isDarkMode ? 'text-slate-700' : 'text-slate-400'} opacity-50`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                    </div>
                )}
            </div>

            <div className="p-6 relative">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                            {plane.callsign || plane.icao24}
                        </h2>
                        <p className="text-sm font-semibold text-sky-500 mt-1 flex items-center gap-1.5">
                            <Building2 size={12} /> {airlineName}
                        </p>
                        <p className={`text-xs font-mono mt-0.5 ${textMuted}`}>{plane.country}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors z-10 ${isDarkMode ? 'hover:bg-slate-800/50 text-slate-400 hover:text-white' : 'hover:bg-slate-200/50 text-slate-500 hover:text-slate-900'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Route / Status */}
                    <div className={`p-4 rounded-xl border ${subCardBg}`}>
                        <div className="flex justify-between items-center mb-3">
                            <div className="text-center">
                                <p className={`text-xs font-bold uppercase ${textMuted}`}>Origin</p>
                                <p className={`text-sm font-bold max-w-[100px] leading-tight mx-auto ${textBright}`}>{getAirportName(plane.origin_airport)}</p>
                            </div>
                            <Plane size={24} className={`${textMuted} transform rotate-90 shrink-0 mx-2`} />
                            <div className="text-center">
                                <p className={`text-xs font-bold uppercase ${textMuted}`}>Dest</p>
                                <p className={`text-sm font-bold max-w-[100px] leading-tight mx-auto ${textBright}`}>{getAirportName(plane.destination_airport)}</p>
                            </div>
                        </div>
                        <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-slate-700/30' : 'border-slate-300/30'}`}>
                            <span className={`text-xs font-semibold uppercase ${textMuted}`}>Status</span>
                            <span className={`text-sm font-bold flex items-center gap-2 ${statusColor}`}>
                                <span className={`w-2 h-2 rounded-full ${plane.onGround ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
                                {status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-xl border ${subCardBg}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-sky-400" />
                                <p className={`text-xs uppercase font-semibold ${textMuted}`}>Departure</p>
                            </div>
                            <p className={`text-md font-medium ${textBright}`}>
                                {plane.departure_time ? new Date(plane.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                            </p>
                        </div>
                        <div className={`p-3 rounded-xl border ${subCardBg}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar size={14} className="text-indigo-400" />
                                <p className={`text-xs uppercase font-semibold ${textMuted}`}>Arrival</p>
                            </div>
                            <p className={`text-md font-medium ${textBright}`}>
                                {plane.arrival_time ? new Date(plane.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                            </p>
                        </div>

                        {/* Journey Progress Bar */}
                        {plane.departure_time && plane.arrival_time && (() => {
                            const now = new Date().getTime();
                            const start = new Date(plane.departure_time).getTime();
                            const end = new Date(plane.arrival_time).getTime();
                            const total = end - start;
                            const elapsed = now - start;
                            const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));

                            return (
                                <div className={`col-span-2 p-3 rounded-xl border ${subCardBg}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className={`text-xs uppercase font-semibold ${textMuted}`}>Journey Progress</p>
                                        <p className="text-xs text-sky-500 font-bold">{Math.round(percent)}%</p>
                                    </div>
                                    <div className={`w-full h-2 rounded-full overflow-hidden relative ${isDarkMode ? 'bg-slate-900' : 'bg-slate-300'}`}>
                                        <div
                                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-1000 ease-out"
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
                                            style={{ left: `${percent}%`, marginLeft: '-6px' }}
                                        >
                                            <Plane size={12} className={isDarkMode ? 'text-white' : 'text-slate-800'} fill="currentColor" style={{ transform: 'rotate(90deg)' }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className={`p-3 rounded-xl border ${subCardBg}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Gauge size={14} className="text-blue-400" />
                                <p className={`text-xs uppercase font-semibold ${textMuted}`}>Speed</p>
                            </div>
                            <p className={`text-lg font-medium ${textBright}`}>{Math.round(plane.velocity * 3.6)} <span className={`text-sm ${textMuted}`}>km/h</span></p>
                        </div>
                        <div className={`p-3 rounded-xl border ${subCardBg}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Plane size={14} className="text-purple-400" />
                                <p className={`text-xs uppercase font-semibold ${textMuted}`}>Alt</p>
                            </div>
                            <p className={`text-lg font-medium ${textBright}`}>{Math.round(plane.altitude)} <span className={`text-sm ${textMuted}`}>m</span></p>
                        </div>
                    </div>

                    <div className={`flex items-center p-3 rounded-xl border ${subCardBg}`}>
                        <div className="p-2 bg-emerald-500/20 rounded-lg mr-3">
                            <MapPin size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className={`text-xs uppercase font-semibold ${textMuted}`}>Coordinates</p>
                            <p className={`text-sm font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {plane.latitude.toFixed(2)}, {plane.longitude.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`mt-6 pt-4 border-t text-center flex justify-between items-center px-2 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                    <p className={`text-[10px] font-mono ${textMuted}`}>ID: {plane.icao24}</p>
                    <p className={`text-[10px] font-mono ${textMuted}`}>Photo © PlaneSpotters.net</p>
                </div>
            </div>
        </div>
    );
};

export default FlightInfo;
