import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { AnimatePresence, motion } from 'motion/react';
import { FileUpload } from './FileUpload';
import { Filters } from './Filters';
import { MapChart } from './MapChart';
import { TimeSeriesChart } from './TimeSeriesChart';
import { TimeSlider } from './TimeSlider';
import { Chatbot } from './Chatbot';
import { ClimateData, FilterState } from '../types';
import { ThermometerSun, Droplets, Map as MapIcon, LineChart as LineChartIcon, Globe2, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<ClimateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    country: 'All',
    startDate: '',
    endDate: ''
  });
  const [currentDate, setCurrentDate] = useState<string>('');
  const [tooltipContent, setTooltipContent] = useState("");

  const loadDefaultDataset = () => {
    setLoading(true);
    fetch('/climate_data.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data as ClimateData[];
            setData(parsedData);
            
            // Set default date range
            if (parsedData.length > 0) {
              const dates = parsedData.map(d => new Date(d.Date).getTime());
              const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
              const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
              setFilters(prev => ({ ...prev, country: 'All', startDate: minDate, endDate: maxDate }));
            }
            setLoading(false);
          }
        });
      })
      .catch(err => {
        console.error("Failed to load default dataset", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDefaultDataset();
  }, []);

  const handleDataLoaded = (newData: ClimateData[]) => {
    setData(newData);
    if (newData.length > 0) {
      const dates = newData.map(d => new Date(d.Date).getTime());
      const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
      const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
      setFilters({ country: 'All', startDate: minDate, endDate: maxDate });
    }
  };

  const countries = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Country))).sort();
  }, [data]);

  const { minDate, maxDate } = useMemo(() => {
    if (data.length === 0) return { minDate: '', maxDate: '' };
    const dates = data.map(d => new Date(d.Date).getTime());
    return {
      minDate: new Date(Math.min(...dates)).toISOString().split('T')[0],
      maxDate: new Date(Math.max(...dates)).toISOString().split('T')[0]
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const date = new Date(d.Date).getTime();
      const start = filters.startDate ? new Date(filters.startDate).getTime() : -Infinity;
      const end = filters.endDate ? new Date(filters.endDate).getTime() : Infinity;
      
      const dateMatch = date >= start && date <= end;
      const countryMatch = filters.country === 'All' || d.Country === filters.country;
      
      const tempMatch = (filters.minTemp === undefined || d.Temperature >= filters.minTemp) &&
                        (filters.maxTemp === undefined || d.Temperature <= filters.maxTemp);
                        
      const humidityMatch = (filters.minHumidity === undefined || (d.Humidity !== undefined && d.Humidity >= filters.minHumidity)) &&
                            (filters.maxHumidity === undefined || (d.Humidity !== undefined && d.Humidity <= filters.maxHumidity));
      
      return dateMatch && countryMatch && tempMatch && humidityMatch;
    });
  }, [data, filters]);

  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(filteredData.map(d => d.Date))).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return dates;
  }, [filteredData]);

  useEffect(() => {
    if (availableDates.length > 0) {
      if (!currentDate || !availableDates.includes(currentDate)) {
        setCurrentDate(availableDates[0]);
      }
    } else {
      setCurrentDate('');
    }
  }, [availableDates, currentDate]);

  const mapData = useMemo(() => {
    return filteredData.filter(d => d.Date === currentDate);
  }, [filteredData, currentDate]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return { avgTemp: 0, avgHumidity: 0, maxTemp: 0, minTemp: 0 };
    
    let tempSum = 0, humiditySum = 0;
    let maxTemp = -Infinity, minTemp = Infinity;
    
    filteredData.forEach(d => {
      tempSum += d.Temperature;
      humiditySum += (d.Humidity || 0);
      if (d.Temperature > maxTemp) maxTemp = d.Temperature;
      if (d.Temperature < minTemp) minTemp = d.Temperature;
    });
    
    return {
      avgTemp: tempSum / filteredData.length,
      avgHumidity: humiditySum / filteredData.length,
      maxTemp,
      minTemp
    };
  }, [filteredData]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'filtered_climate_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-slate-200 relative overflow-hidden">
        {/* Atmospheric background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/20 blur-[120px]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center bg-slate-900/40 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-500 mb-6" />
          <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">Loading Climate Data</h2>
          <p className="text-slate-400">Fetching and parsing global datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans p-4 md:p-8 relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/20 blur-[120px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
              <Globe2 className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Global Climate Dashboard</h1>
              <p className="text-slate-400 mt-1">Interactive visualization of temperature and humidity trends</p>
            </div>
          </div>
          <div className="bg-slate-950/80 px-4 py-2 rounded-full shadow-inner border border-white/5 text-sm font-medium text-indigo-400 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            Live Data Mode
          </div>
        </header>

        {/* Upload & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <FileUpload onDataLoaded={handleDataLoaded} onLoadDefault={loadDefaultDataset} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Filters 
              filters={filters} 
              setFilters={setFilters} 
              countries={countries} 
              minDate={minDate} 
              maxDate={maxDate} 
              onExport={handleExportCSV}
            />
            
            <TimeSlider 
              dates={availableDates} 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
            />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col relative overflow-hidden group hover:bg-slate-800/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ThermometerSun className="w-20 h-20" /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-3 relative z-10"><ThermometerSun className="w-4 h-4 text-orange-400" /><span className="text-xs font-semibold uppercase tracking-wider">Avg Temp</span></div>
                <span className="text-4xl font-light text-white relative z-10">{stats.avgTemp.toFixed(1)}°C</span>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col relative overflow-hidden group hover:bg-slate-800/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Droplets className="w-20 h-20" /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-3 relative z-10"><Droplets className="w-4 h-4 text-blue-400" /><span className="text-xs font-semibold uppercase tracking-wider">Avg Humidity</span></div>
                <span className="text-4xl font-light text-white relative z-10">{stats.avgHumidity.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col relative overflow-hidden group hover:bg-slate-800/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ThermometerSun className="w-20 h-20" /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-3 relative z-10"><ThermometerSun className="w-4 h-4 text-red-400" /><span className="text-xs font-semibold uppercase tracking-wider">Max Temp</span></div>
                <span className="text-4xl font-light text-white relative z-10">{stats.maxTemp.toFixed(1)}°C</span>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col relative overflow-hidden group hover:bg-slate-800/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ThermometerSun className="w-20 h-20" /></div>
                <div className="flex items-center gap-2 text-slate-400 mb-3 relative z-10"><ThermometerSun className="w-4 h-4 text-sky-400" /><span className="text-xs font-semibold uppercase tracking-wider">Min Temp</span></div>
                <span className="text-4xl font-light text-white relative z-10">{stats.minTemp.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <MapIcon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">
                Global Temperature Heatmap {currentDate && <span className="text-indigo-400 font-normal ml-1">({format(parseISO(currentDate), 'MMM yyyy')})</span>}
              </h2>
            </div>
            <div className="relative flex-1">
              <MapChart data={mapData} setTooltipContent={setTooltipContent} />
              <AnimatePresence>
                {tooltipContent && (
                  <motion.div
                    key="tooltip"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-xl pointer-events-none z-10 border border-white/10"
                  >
                    {tooltipContent}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <LineChartIcon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Time-Series Trends</h2>
            </div>
            <div className="flex-1">
              <TimeSeriesChart data={filteredData} selectedCountry={filters.country} currentDate={currentDate} />
            </div>
          </div>
        </div>

      </div>
      <Chatbot 
        countries={countries} 
        onCountryChange={(country) => setFilters(prev => ({ ...prev, country }))} 
      />
    </div>
  );
};