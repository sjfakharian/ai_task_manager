import React, { useState, useEffect } from 'react';
import { Schedule, TimeBlock } from '../types';
import { Card } from './ui/Card';
import { calculateDuration } from '../utils/algorithms';

interface DailyScheduleProps {
  accessToken: string | null;
}

// Mock schedule generator
const generateMockSchedule = (): Schedule => {
  const blocks: TimeBlock[] = [
    { id: 1, start_time: '07:00', end_time: '07:30', duration: 30, block_type: 'personal', title: 'Morning Routine & Breakfast', is_completed: true, source: 'local' },
    { id: 2, start_time: '07:30', end_time: '09:00', duration: 90, block_type: 'task', title: 'Deep Work: Project Report', is_completed: true, source: 'local' },
    { id: 3, start_time: '09:00', end_time: '09:15', duration: 15, block_type: 'break', title: 'Short Break', is_completed: false, source: 'local' },
    { id: 4, start_time: '09:15', end_time: '10:45', duration: 90, block_type: 'task', title: 'Learning: New Framework', is_completed: false, source: 'local' },
    { id: 5, start_time: '10:45', end_time: '11:00', duration: 15, block_type: 'break', title: 'Coffee Break', is_completed: false, source: 'local' },
    { id: 6, start_time: '11:00', end_time: '12:00', duration: 60, block_type: 'task', title: 'Email Review & Admin', is_completed: false, source: 'local' },
    { id: 7, start_time: '12:00', end_time: '13:00', duration: 60, block_type: 'meal', title: 'Lunch Break', is_completed: false, source: 'local' },
    { id: 8, start_time: '13:00', end_time: '14:30', duration: 90, block_type: 'task', title: 'Team Sync & Meetings', is_completed: false, source: 'local' },
  ];

  return {
    id: 101,
    date: new Date().toISOString(),
    productivity_score: 88.5,
    health_score: 92.0,
    overall_score: 90.2,
    time_blocks: blocks
  };
};

export const DailySchedule: React.FC<DailyScheduleProps> = ({ accessToken }) => {
  const [schedule, setSchedule] = useState<Schedule>(generateMockSchedule());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
        fetchGoogleCalendarEvents();
    }
  }, [accessToken]);

  const fetchGoogleCalendarEvents = async () => {
      if (!accessToken) return;

      setIsSyncing(true);
      setSyncStatus('Syncing Google Calendar...');

      try {
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

          // Using fetch directly instead of gapi.client to avoid complex dependency initialization for this demo
          const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime`, 
              {
                  headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                  }
              }
          );
          
          if (!response.ok) {
              throw new Error('Failed to fetch calendar events');
          }

          const data = await response.json();
          const events = data.items || [];
          
          if (events.length > 0) {
              const calendarBlocks: TimeBlock[] = events.map((event: any, index: number) => {
                  const start = new Date(event.start.dateTime || event.start.date);
                  const end = new Date(event.end.dateTime || event.end.date);
                  const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const duration = calculateDuration(startTime, endTime);
                  
                  return {
                      id: 200 + index, // IDs to avoid collision with mock
                      start_time: startTime,
                      end_time: endTime,
                      duration: duration,
                      block_type: 'meeting', // Default to meeting for calendar events
                      title: event.summary || '(No Title)',
                      is_completed: end < new Date(),
                      source: 'google_calendar'
                  };
              });

              // Merge logic: Simple append for demo. Real app would resolve conflicts.
              // Sorting all blocks by start time
              setSchedule(prev => {
                  const combined = [...prev.time_blocks, ...calendarBlocks].sort((a, b) => {
                      return a.start_time.localeCompare(b.start_time);
                  });
                  return { ...prev, time_blocks: combined };
              });
              setSyncStatus(`Synced ${events.length} events from Google Calendar`);
          } else {
              setSyncStatus('No events found for today');
          }

      } catch (error) {
          console.error("Error fetching calendar:", error);
          setSyncStatus('Failed to sync. Please check network/auth.');
      } finally {
          setIsSyncing(false);
          // Clear status after 3 seconds
          setTimeout(() => setSyncStatus(null), 3000);
      }
  };

  const getBlockStyles = (type: string, source?: string) => {
    // Distinct style for Google Calendar events
    if (source === 'google_calendar') {
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }

    switch(type) {
      case 'task': return 'bg-indigo-50 border-indigo-100 text-indigo-700';
      case 'break': return 'bg-teal-50 border-teal-100 text-teal-700';
      case 'meal': return 'bg-orange-50 border-orange-100 text-orange-700';
      case 'exercise': return 'bg-red-50 border-red-100 text-red-700';
      case 'personal': return 'bg-purple-50 border-purple-100 text-purple-700';
      case 'meeting': return 'bg-blue-50 border-blue-100 text-blue-700';
      default: return 'bg-gray-50 border-gray-100 text-gray-700';
    }
  };

  const getBlockIcon = (type: string, source?: string) => {
    if (source === 'google_calendar') {
        return (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        );
    }
    switch(type) {
      case 'task': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
      );
      case 'break': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      );
      case 'meal': return (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
      ); 
      case 'personal': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      );
      default: return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-1 space-y-4">
        <Card title="Today's Scores" className="bg-indigo-900 text-white border-none shadow-lg">
          <div className="space-y-4">
             <div>
                <div className="flex justify-between text-sm text-indigo-200 mb-1">Productivity</div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">{schedule.productivity_score}</span>
                    <span className="text-sm text-indigo-300 mb-1">/ 100</span>
                </div>
                <div className="w-full bg-indigo-800 h-1.5 rounded-full mt-2">
                    <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${schedule.productivity_score}%` }}></div>
                </div>
             </div>
             
             <div>
                <div className="flex justify-between text-sm text-indigo-200 mb-1">Health & Wellness</div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">{schedule.health_score}</span>
                    <span className="text-sm text-indigo-300 mb-1">/ 100</span>
                </div>
                <div className="w-full bg-indigo-800 h-1.5 rounded-full mt-2">
                    <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${schedule.health_score}%` }}></div>
                </div>
             </div>
          </div>
        </Card>
        
        <button className="w-full py-3 bg-white border border-indigo-600 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors shadow-sm">
          Generate New Schedule
        </button>

        {syncStatus && (
            <div className={`text-xs text-center p-2 rounded-lg ${syncStatus.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {syncStatus}
            </div>
        )}
      </div>

      <div className="lg:col-span-3">
        <Card title="Timeline" className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto pr-2 relative space-y-4">
             {/* Current Time Line Indicator */}
             <div className="absolute top-[180px] left-0 right-0 z-10 flex items-center pointer-events-none">
                <div className="w-20 text-right pr-4 text-xs font-bold text-red-500">NOW</div>
                <div className="flex-1 h-px bg-red-500 relative">
                    <div className="absolute right-0 -top-1 w-2 h-2 rounded-full bg-red-500"></div>
                </div>
             </div>

            {schedule.time_blocks.map((block, index) => (
              <div key={block.id} className="flex group">
                <div className="w-20 flex flex-col items-end pr-4 pt-1">
                  <span className="text-sm font-bold text-gray-700">{block.start_time}</span>
                  <span className="text-xs text-gray-400">{block.end_time}</span>
                </div>
                
                <div className="relative flex-1">
                   {/* Vertical Line */}
                   {index !== schedule.time_blocks.length - 1 && (
                     <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-gray-100 group-hover:bg-gray-200 transition-colors"></div>
                   )}
                   
                   <div className={`p-4 rounded-xl border mb-2 flex gap-4 items-start transition-all hover:shadow-md ${getBlockStyles(block.block_type, block.source)}`}>
                      <div className={`mt-0.5 p-2 rounded-lg bg-white/60 shadow-sm`}>
                        {getBlockIcon(block.block_type, block.source)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                    {block.title}
                                    {block.source === 'google_calendar' && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 border border-blue-200">G-Cal</span>
                                    )}
                                </h4>
                            </div>
                            <span className="text-xs font-medium px-2 py-0.5 bg-white/50 rounded-md">
                                {block.duration} min
                            </span>
                        </div>
                        <p className="text-sm opacity-80 capitalize mt-0.5">{block.block_type.replace('_', ' ')}</p>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            checked={block.is_completed} 
                            readOnly
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                   </div>
                </div>
              </div>
            ))}
            
            <div className="text-center py-4 text-gray-400 text-sm">
                End of planned day
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};