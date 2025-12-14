import React from 'react';
import { Card } from './ui/Card';
import { HealthRecommendation } from '../types';
import { DEFAULT_ENERGY_PATTERN, calculatePeakEnergy } from '../utils/algorithms';

// Use energy pattern from algorithms module
const energyData = DEFAULT_ENERGY_PATTERN;

const mockRecommendations: HealthRecommendation[] = [
  {
    id: 1,
    title: "Deep Work Window",
    description: "Your peak energy is between 9:00 and 11:00. Schedule your most demanding tasks then.",
    priority: 'high',
    type: 'productivity',
    reason: "Circadian rhythm alignment"
  },
  {
    id: 2,
    title: "Hydration Check",
    description: "You haven't logged water intake in 3 hours.",
    priority: 'medium',
    type: 'hydration',
    reason: "Maintenance interval exceeded"
  },
  {
    id: 3,
    title: "Evening Wind-down",
    description: "Avoid blue light starting at 21:00 to ensure sleep quality.",
    priority: 'medium',
    type: 'sleep',
    reason: "Melatonin production support"
  }
];

const SimpleEnergyChart = () => {
    // Determine dimensions
    const width = 600;
    const height = 250;
    const padding = 30;
    
    // Scales
    const minHour = 6;
    const maxHour = 23;
    const maxEnergy = 100;
    
    const getX = (hour: number) => padding + ((hour - minHour) / (maxHour - minHour)) * (width - 2 * padding);
    const getY = (energy: number) => height - padding - (energy / maxEnergy) * (height - 2 * padding);
    
    // Create Path
    let d = `M ${getX(energyData[0].hour)} ${getY(energyData[0].energy)}`;
    energyData.forEach((point, i) => {
        if (i > 0) d += ` L ${getX(point.hour)} ${getY(point.energy)}`;
    });
    
    // Close area for fill
    const fillD = d + ` L ${getX(23)} ${height - padding} L ${getX(6)} ${height - padding} Z`;

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                {/* Background Grid */}
                {[0, 25, 50, 75, 100].map(level => (
                    <line 
                        key={level} 
                        x1={padding} y1={getY(level)} 
                        x2={width - padding} y2={getY(level)} 
                        stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" 
                    />
                ))}
                
                {/* Y Axis Labels */}
                <text x={padding - 10} y={getY(0)} className="text-[10px] fill-gray-400" textAnchor="end">0</text>
                <text x={padding - 10} y={getY(50)} className="text-[10px] fill-gray-400" textAnchor="end">50</text>
                <text x={padding - 10} y={getY(100)} className="text-[10px] fill-gray-400" textAnchor="end">100</text>

                {/* Deep Work Zone (70+) */}
                <rect 
                    x={padding} 
                    y={getY(100)} 
                    width={width - 2 * padding} 
                    height={getY(70) - getY(100)} 
                    fill="#FEF3C7" opacity="0.5" 
                />
                <line x1={padding} y1={getY(70)} x2={width - padding} y2={getY(70)} stroke="#F59E0B" strokeWidth="1" strokeDasharray="2" />
                <text x={width - padding} y={getY(72)} className="text-[10px] fill-amber-600" textAnchor="end">Deep Work Zone</text>

                {/* The Chart */}
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={fillD} fill="url(#gradient)" stroke="none" />
                <path d={d} fill="none" stroke="#4F46E5" strokeWidth="3" />

                {/* X Axis Labels */}
                {energyData.filter((_, i) => i % 3 === 0).map(point => (
                    <text 
                        key={point.hour} 
                        x={getX(point.hour)} 
                        y={height - 10} 
                        className="text-[10px] fill-gray-500" 
                        textAnchor="middle"
                    >
                        {point.hour}:00
                    </text>
                ))}
            </svg>
        </div>
    );
};

export const HealthAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Energy Chart */}
      <Card title="Circadian Energy Rhythm">
        <div className="w-full mt-4 bg-white rounded-lg">
          <SimpleEnergyChart />
        </div>
        
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-sm text-indigo-800 flex gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p>
            <strong>Strategic Analysis:</strong> Your energy peaks at <strong>{calculatePeakEnergy().hour}:00</strong>. 
            Based on data, schedule analytical tasks like coding or financial modeling between <strong>09:00</strong> and <strong>12:00</strong>.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommendations */}
        <Card title="Wellness Advisor">
            <div className="space-y-4">
                {mockRecommendations.map(rec => (
                    <div key={rec.id} className="border border-gray-100 rounded-lg p-4 bg-white hover:border-indigo-100 hover:shadow-sm transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider
                                ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : 
                                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {rec.priority.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-medium text-gray-500">Why:</span> {rec.reason}
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        {/* Sleep Stats */}
        <Card title="Sleep Optimization">
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Bedtime</div>
                    <div className="text-2xl font-bold text-slate-800">23:00</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Wake Up</div>
                    <div className="text-2xl font-bold text-slate-800">07:00</div>
                </div>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        </div>
                        <div>
                            <div className="font-semibold text-gray-800">5 Cycles</div>
                            <div className="text-xs text-gray-500">Total duration: 7.5 hrs</div>
                        </div>
                    </div>
                    <div className="text-green-600 font-bold">Optimal</div>
                </div>

                <h5 className="font-medium text-sm text-gray-700 mt-4 mb-2">Quality Tips:</h5>
                <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex gap-2">
                        <span className="text-indigo-500">•</span> Lower room temperature to 19°C
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-500">•</span> Avoid caffeine after 14:00
                    </li>
                </ul>
            </div>
        </Card>
      </div>
    </div>
  );
};