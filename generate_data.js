import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const countries = [
  { name: 'United States', lat: 37.0902, lon: -95.7129, baseTemp: 12, tempRange: 15 },
  { name: 'Canada', lat: 56.1304, lon: -106.3468, baseTemp: -5, tempRange: 20 },
  { name: 'Brazil', lat: -14.2350, lon: -51.9253, baseTemp: 25, tempRange: 5 },
  { name: 'United Kingdom', lat: 55.3781, lon: -3.4360, baseTemp: 10, tempRange: 10 },
  { name: 'Germany', lat: 51.1657, lon: 10.4515, baseTemp: 9, tempRange: 12 },
  { name: 'India', lat: 20.5937, lon: 78.9629, baseTemp: 24, tempRange: 10 },
  { name: 'China', lat: 35.8617, lon: 104.1954, baseTemp: 14, tempRange: 18 },
  { name: 'Australia', lat: -25.2744, lon: 133.7751, baseTemp: 22, tempRange: 10 },
  { name: 'South Africa', lat: -30.5595, lon: 22.9375, baseTemp: 18, tempRange: 8 },
  { name: 'Russia', lat: 61.5240, lon: 105.3188, baseTemp: -5, tempRange: 25 },
  { name: 'Japan', lat: 36.2048, lon: 138.2529, baseTemp: 15, tempRange: 12 },
  { name: 'Argentina', lat: -38.4161, lon: -63.6167, baseTemp: 14, tempRange: 10 },
  { name: 'France', lat: 46.2276, lon: 2.2137, baseTemp: 11, tempRange: 10 },
  { name: 'Italy', lat: 41.8719, lon: 12.5674, baseTemp: 14, tempRange: 12 },
  { name: 'Spain', lat: 40.4637, lon: -3.7492, baseTemp: 15, tempRange: 12 },
  { name: 'Mexico', lat: 23.6345, lon: -102.5528, baseTemp: 21, tempRange: 8 },
  { name: 'Indonesia', lat: -0.7893, lon: 113.9213, baseTemp: 27, tempRange: 2 },
  { name: 'Nigeria', lat: 9.0820, lon: 8.6753, baseTemp: 27, tempRange: 4 },
  { name: 'Egypt', lat: 26.8206, lon: 30.8025, baseTemp: 22, tempRange: 10 },
  { name: 'Saudi Arabia', lat: 23.8859, lon: 45.0792, baseTemp: 25, tempRange: 15 },
  { name: 'Sweden', lat: 60.1282, lon: 18.6435, baseTemp: 3, tempRange: 18 },
  { name: 'Norway', lat: 60.4720, lon: 8.4689, baseTemp: 2, tempRange: 15 },
  { name: 'Chile', lat: -35.6751, lon: -71.5430, baseTemp: 12, tempRange: 8 },
  { name: 'New Zealand', lat: -40.9006, lon: 174.8860, baseTemp: 11, tempRange: 8 }
];

const startDate = new Date('2010-01-01');
const endDate = new Date('2023-12-31');

let csvContent = 'Date,Country,Latitude,Longitude,Temperature,Humidity\n';

for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
  const month = d.getMonth();
  const year = d.getFullYear();
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  
  // Global warming trend (slight increase over time)
  const yearOffset = (year - 2010) * 0.04;

  countries.forEach(country => {
    // Seasonal variation: Northern hemisphere peaks in July (month 6), Southern in Jan (month 0)
    const isNorthern = country.lat > 0;
    const peakMonth = isNorthern ? 6 : 0;
    const monthDiff = Math.abs(month - peakMonth);
    const seasonalOffset = Math.cos((monthDiff / 6) * Math.PI) * country.tempRange;
    
    // Random noise
    const noise = (Math.random() - 0.5) * 2.5;
    
    const temp = country.baseTemp + seasonalOffset + yearOffset + noise;
    
    // Humidity: somewhat inversely related to temp, plus noise
    const humidity = Math.max(10, Math.min(100, 75 - (temp - 15) * 1.2 + (Math.random() - 0.5) * 15));

    csvContent += `${dateStr},${country.name},${country.lat},${country.lon},${temp.toFixed(2)},${humidity.toFixed(2)}\n`;
  });
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

fs.writeFileSync(path.join(publicDir, 'climate_data.csv'), csvContent);
console.log('Sample data generated at public/climate_data.csv');