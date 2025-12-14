import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { Task } from '../types';
// Removed static import to prevent blocking app load if dependency fails
// import { GoogleGenAI } from "@google/genai";

interface AIAgentProps {
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => void;
  apiKey: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const AIAgent: React.FC<AIAgentProps> = ({ tasks, onAddTask, apiKey }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm your AI Task Advisor. I can help you prioritize tasks, suggest what to defer, or plan your day. How can I help you right now?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isConfigured = !!apiKey;

  const getSystemPrompt = () => {
    const taskContext = JSON.stringify(tasks.map(t => ({
      title: t.title,
      priority: t.priority,
      status: t.status,
      energy: t.energy_required,
      duration: t.estimated_duration
    })));

    return `
    You are an intelligent task management advisor.
    Current User Context:
    - Current Time: ${new Date().toLocaleTimeString()}
    - Tasks: ${taskContext}
    
    Your capabilities:
    1. Prioritize: Suggest the best order for tasks.
    2. Defer: Suggest tasks to move to tomorrow if overloaded.
    3. Strategy: Give productivity tips based on energy levels (assume morning peak).
    4. New Tasks: If the user mentions a new task, explicitly format it as JSON in your response like: {"new_task": {"title": "...", "priority": "...", "duration": ...}} so I can parse it.
    
    Keep responses concise, friendly, and practical. Use emojis.
    `;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    if (!isConfigured) {
        setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'model', content: "⚠️ API Key is missing. Please add your key in the Settings tab." }]);
        setInput('');
        return;
    }

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      // DYNAMIC IMPORT: Load the library only when needed
      const module = await import("@google/genai");
      const GoogleGenAI = module.GoogleGenAI;

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMsg,
        config: {
            systemInstruction: getSystemPrompt(),
        }
      });

      const text = response.text;
      
      const jsonMatch = text.match(/\{"new_task":\s*\{.*?\}\}/);
      if (jsonMatch) {
          try {
              const data = JSON.parse(jsonMatch[0]);
              if (data.new_task) {
                  onAddTask({
                      ...data.new_task,
                      category: 'routine', // Default
                      energy_required: 50,
                      status: 'pending'
                  });
              }
          } catch (e) {
              console.error("Failed to parse task JSON", e);
          }
      }

      setMessages(prev => [...prev, { role: 'model', content: text || "I didn't get a response." }]);
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Sorry, I encountered an error.";
      if (error.message && error.message.includes("Failed to resolve module")) {
          errorMessage += " The AI library could not be loaded. Please check your internet connection.";
      } else {
          errorMessage += " Verify your API Key in Settings or check your connection.";
      }
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let prompt = "";
    switch(action) {
        case 'prioritize':
            prompt = "Please prioritize my current pending tasks based on importance and energy.";
            break;
        case 'defer':
            prompt = "I feel overwhelmed. Which tasks should I defer to tomorrow?";
            break;
        case 'strategy':
            prompt = "Give me a productivity strategy for the next 4 hours.";
            break;
    }
    if (prompt) {
        setInput(prompt);
    }
  };

  if (!isConfigured) {
      return (
          <div className="h-full flex items-center justify-center p-6">
              <Card className="max-w-md w-full text-center p-8 bg-indigo-50 border-indigo-100">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Setup Required</h3>
                  <p className="text-indigo-700 mb-4">
                      To use the AI Advisor with your own account, please add your Gemini API Key in Settings.
                  </p>
                  <p className="text-sm text-indigo-600 opacity-75 mb-4">
                      Using your own key ensures you control the usage and limits.
                  </p>
                  <button onClick={() => document.querySelector<HTMLButtonElement>('button[data-tab="settings"]')?.click()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      Go to Settings
                  </button>
              </Card>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 flex flex-col h-full">
        <Card title="Chat with Advisor" className="flex-1 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 border rounded-lg bg-gray-50 h-[400px]">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                            m.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                        }`}>
                            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm flex items-center gap-2">
                             <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                             <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                             <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your tasks..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
            </div>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-4">
          <Card title="Quick Actions">
              <div className="space-y-3">
                  <button onClick={() => handleQuickAction('prioritize')} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-3">
                      <span className="text-xl">📊</span>
                      <div>
                          <div className="font-semibold text-gray-800">Prioritize Tasks</div>
                          <div className="text-xs text-gray-500">Get AI suggestion on what to do first</div>
                      </div>
                  </button>
                  <button onClick={() => handleQuickAction('defer')} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-3">
                      <span className="text-xl">⏸️</span>
                      <div>
                          <div className="font-semibold text-gray-800">Defer Tasks</div>
                          <div className="text-xs text-gray-500">Find tasks to move to tomorrow</div>
                      </div>
                  </button>
                  <button onClick={() => handleQuickAction('strategy')} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-3">
                      <span className="text-xl">🎯</span>
                      <div>
                          <div className="font-semibold text-gray-800">Productivity Strategy</div>
                          <div className="text-xs text-gray-500">Optimize schedule based on energy</div>
                      </div>
                  </button>
              </div>
          </Card>

          <Card title="Agent Status">
               <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                   </div>
                   <div>
                       <div className="font-bold text-gray-800">Gemini 2.5 Flash</div>
                       <div className="text-xs text-green-600 flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                           Active
                       </div>
                   </div>
               </div>
               <p className="text-xs text-gray-500 leading-relaxed">
                   The AI Agent analyzes your {tasks.length} tasks and local time ({new Date().getHours()}:00) to provide personalized advice.
               </p>
          </Card>
      </div>
    </div>
  );
};