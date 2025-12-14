import React, { useState, useEffect } from 'react';
import { TaskManager } from './components/TaskManager';
import { DailySchedule } from './components/DailySchedule';
import { HealthAnalytics } from './components/HealthAnalytics';
import { UserPreferences } from './components/UserPreferences';
import { AIAgent } from './components/AIAgent';
import { Task, TaskPriority, TaskCategory, TaskStatus, UserProfile } from './types';

// Declare Google GIS client type
declare const google: any;

enum Tab {
  TASKS = 'tasks',
  SCHEDULE = 'schedule',
  HEALTH = 'health',
  AGENT = 'agent',
  SETTINGS = 'settings'
}

const MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: "Complete Project Report",
    description: "Finalize quarterly analysis",
    priority: TaskPriority.HIGH,
    category: TaskCategory.DEEP_WORK,
    status: TaskStatus.PENDING,
    estimated_duration: 90,
    energy_required: 85,
    deadline: new Date(Date.now() + 86400000).toISOString() // Tomorrow
  },
  {
    id: 2,
    title: "Team Sync",
    description: "Weekly status meeting",
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.MEETINGS,
    status: TaskStatus.COMPLETED,
    estimated_duration: 30,
    energy_required: 40
  },
  {
    id: 3,
    title: "Email Review",
    priority: TaskPriority.LOW,
    category: TaskCategory.ADMINISTRATIVE,
    status: TaskStatus.PENDING,
    estimated_duration: 45,
    energy_required: 30
  }
];

// NOTE: Replace this with your actual Google Cloud Client ID
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"; 

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TASKS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // API Key State (User provided or Environment)
  const [userApiKey, setUserApiKey] = useState<string>(() => {
      // Try to get from local storage first, then env
      return localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
  });

  const handleSaveApiKey = (key: string) => {
      setUserApiKey(key);
      localStorage.setItem('gemini_api_key', key);
  };

  // Simple Notification System Logic
  const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== TaskStatus.COMPLETED);
  const notificationCount = overdueTasks.length;

  const handleAddTask = (partialTask: Partial<Task>) => {
      const task: Task = {
          id: Date.now(),
          title: partialTask.title || "New Task",
          description: partialTask.description || "",
          priority: partialTask.priority || TaskPriority.MEDIUM,
          category: partialTask.category || TaskCategory.ROUTINE,
          status: TaskStatus.PENDING,
          estimated_duration: partialTask.estimated_duration || 30,
          energy_required: partialTask.energy_required || 50,
          deadline: partialTask.deadline
      };
      setTasks([...tasks, task]);
  };

  // Google Login Logic
  const handleGoogleLogin = () => {
    if (typeof google === 'undefined') {
        alert("Google scripts not loaded yet. Please wait or refresh.");
        return;
    }

    setIsLoggingIn(true);

    try {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: async (tokenResponse: any) => {
                if (tokenResponse.access_token) {
                    setAccessToken(tokenResponse.access_token);
                    // Fetch user info
                    try {
                        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                        });
                        const userInfo = await userInfoResponse.json();
                        setUser({
                            name: userInfo.name,
                            email: userInfo.email,
                            picture: userInfo.picture
                        });
                        setActiveTab(Tab.SCHEDULE); // Switch to schedule to show sync
                    } catch (error) {
                        console.error("Error fetching user info:", error);
                    }
                }
                setIsLoggingIn(false);
            },
        });
        client.requestAccessToken();
    } catch (e) {
        console.error("Login failed", e);
        setIsLoggingIn(false);
        // Fallback for demo purposes if no Client ID is set
        if (GOOGLE_CLIENT_ID.includes("YOUR_CLIENT_ID")) {
             alert("Google Login requires a valid Client ID in App.tsx. Simulating login for demo.");
             setUser({
                 name: "Demo User",
                 email: "user@example.com",
                 picture: "https://ui-avatars.com/api/?name=Demo+User&background=4F46E5&color=fff"
             });
             setAccessToken("demo_token");
        }
    }
  };

  const handleLogout = () => {
      const confirmLogout = window.confirm("Are you sure you want to disconnect your Google Account?");
      if (confirmLogout) {
          if (accessToken && typeof google !== 'undefined') {
              google.accounts.oauth2.revoke(accessToken, () => {
                  console.log('Access token revoked');
              });
          }
          setUser(null);
          setAccessToken(null);
      }
  };

  const renderContent = () => {
    switch(activeTab) {
      case Tab.TASKS: return <TaskManager tasks={tasks} setTasks={setTasks} />;
      case Tab.SCHEDULE: return <DailySchedule accessToken={accessToken} />;
      case Tab.HEALTH: return <HealthAnalytics />;
      case Tab.AGENT: return <AIAgent tasks={tasks} onAddTask={handleAddTask} apiKey={userApiKey} />;
      case Tab.SETTINGS: return <UserPreferences apiKey={userApiKey} onSaveApiKey={handleSaveApiKey} />;
      default: return <TaskManager tasks={tasks} setTasks={setTasks} />;
    }
  };

  const NavItem = ({ tab, label, icon }: { tab: Tab, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        activeTab === tab 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
          : 'text-gray-500 hover:bg-white hover:text-indigo-600'
      }`}
    >
      <div className={`${activeTab === tab ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'}`}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 border-r border-gray-200 flex flex-col p-4 hidden md:flex">
        <div className="mb-8 px-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                AI
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">TaskManager</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem 
            tab={Tab.TASKS} 
            label="My Tasks" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>} 
          />
          <NavItem 
            tab={Tab.SCHEDULE} 
            label="Schedule" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>} 
          />
          <NavItem 
            tab={Tab.HEALTH} 
            label="Health & Energy" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} 
          />
          <NavItem 
            tab={Tab.AGENT} 
            label="AI Advisor" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>} 
          />
           <NavItem 
            tab={Tab.SETTINGS} 
            label="Preferences" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>} 
          />
        </nav>

        {!user ? (
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
                 <div className="text-sm font-semibold text-gray-800 mb-2">Sync Calendar</div>
                 <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                 >
                    {isLoggingIn ? (
                        <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.789 L -6.704 42.319 C -8.804 40.359 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                     Sign in with Google
                 </button>
            </div>
        ) : (
             <div className="p-4 bg-indigo-50 rounded-xl">
                 <div className="flex items-center gap-3 mb-3">
                     <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                     <div className="overflow-hidden">
                         <div className="text-sm font-bold text-gray-800 truncate">{user.name}</div>
                         <div className="text-xs text-indigo-600 truncate">Connected</div>
                     </div>
                 </div>
                 <button onClick={handleLogout} className="text-xs text-red-500 hover:underline w-full text-left">Disconnect</button>
            </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
            <h2 className="text-lg font-semibold text-gray-800">
                {activeTab === Tab.TASKS && 'Task Management'}
                {activeTab === Tab.SCHEDULE && 'Daily Schedule'}
                {activeTab === Tab.HEALTH && 'Health Analytics'}
                {activeTab === Tab.AGENT && 'AI Advisor'}
                {activeTab === Tab.SETTINGS && 'User Preferences'}
            </h2>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors relative"
                    >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                       {notificationCount > 0 && (
                           <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                       )}
                    </button>
                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                                <span className="font-semibold text-sm">Notifications</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{notificationCount}</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {overdueTasks.length > 0 ? overdueTasks.map(t => (
                                    <div key={t.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                        <div className="text-sm font-medium text-red-600 mb-1">Overdue Task</div>
                                        <div className="text-sm text-gray-700">{t.title}</div>
                                    </div>
                                )) : (
                                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-sm text-right hidden sm:block">
                    <div className="font-medium text-gray-900">{user ? user.name : "Guest User"}</div>
                    <div className="text-gray-500 text-xs">{user ? "Premium Plan" : "Basic Plan"}</div>
                </div>
                {user ? (
                     <img src={user.picture} alt="Profile" className="w-9 h-9 rounded-full border border-gray-300" />
                ) : (
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border border-gray-300">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                )}
            </div>
        </header>

        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto bg-white border-b border-gray-200 p-2 gap-2">
            <button onClick={() => setActiveTab(Tab.TASKS)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === Tab.TASKS ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}>Tasks</button>
            <button onClick={() => setActiveTab(Tab.SCHEDULE)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === Tab.SCHEDULE ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}>Schedule</button>
            <button onClick={() => setActiveTab(Tab.HEALTH)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === Tab.HEALTH ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}>Health</button>
            <button onClick={() => setActiveTab(Tab.AGENT)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === Tab.AGENT ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}>AI Advisor</button>
            <button onClick={() => setActiveTab(Tab.SETTINGS)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === Tab.SETTINGS ? 'bg-indigo-600 text-white' : 'bg-gray-50'}`}>Settings</button>
        </div>
        
        {/* Mobile Login Button (Only visible if not logged in) */}
        {!user && (
            <div className="md:hidden p-4 bg-indigo-50 border-b border-indigo-100 flex justify-center">
                 <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-700"
                 >
                     <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.789 L -6.704 42.319 C -8.804 40.359 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                     Sign in with Google
                 </button>
            </div>
        )}

        <div className="p-6">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;