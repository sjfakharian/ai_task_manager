import React, { useState } from 'react';
import { Card } from './ui/Card';

interface UserPreferencesProps {
    apiKey: string;
    onSaveApiKey: (key: string) => void;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({ apiKey, onSaveApiKey }) => {
  const [localKey, setLocalKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
      onSaveApiKey(localKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <Card title="AI Configuration">
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            value={localKey}
                            onChange={(e) => setLocalKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" 
                        />
                        <button 
                            onClick={handleSave}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors text-white ${isSaved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {isSaved ? 'Saved!' : 'Save Key'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        To use your own Gemini quota, get an API Key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-600 hover:underline">Google AI Studio</a>.
                        This key is stored locally in your browser.
                    </p>
                </div>
            </div>
        </Card>

        <Card title="Work Hours">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Time</label>
                    <input type="time" defaultValue="09:00" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work End Time</label>
                    <input type="time" defaultValue="18:00" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </div>
        </Card>

        <Card title="Sleep & Energy">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Wake Time</label>
                    <input type="time" defaultValue="07:00" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Sleep Time</label>
                    <input type="time" defaultValue="23:00" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chronotype</label>
                <div className="grid grid-cols-3 gap-4">
                    <button className="p-4 border-2 border-transparent bg-gray-50 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left">
                        <div className="font-semibold text-gray-800">Morning Lark</div>
                        <div className="text-xs text-gray-500 mt-1">Early riser, peak energy before noon.</div>
                    </button>
                    <button className="p-4 border-2 border-indigo-500 bg-indigo-50 rounded-xl transition-all text-left relative">
                         <div className="absolute top-2 right-2 text-indigo-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                         </div>
                        <div className="font-semibold text-indigo-900">Neutral</div>
                        <div className="text-xs text-indigo-700 mt-1">Standard 9-5 energy curve.</div>
                    </button>
                    <button className="p-4 border-2 border-transparent bg-gray-50 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left">
                        <div className="font-semibold text-gray-800">Night Owl</div>
                        <div className="text-xs text-gray-500 mt-1">Late riser, peak energy in evening.</div>
                    </button>
                </div>
            </div>
        </Card>

        <Card title="Daily Goals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deep Work Target (min)</label>
                    <input type="number" defaultValue="240" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Goal (min)</label>
                    <input type="number" defaultValue="30" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </div>
        </Card>
    </div>
  );
};