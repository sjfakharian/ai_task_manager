import React, { useState } from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../types';
import { Card } from './ui/Card';

interface TaskManagerProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ tasks, setTasks }) => {
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.ROUTINE,
    estimated_duration: 60,
    energy_required: 50
  });

  // Feedback Modal State
  const [showFeedback, setShowFeedback] = useState<number | null>(null);
  const [satisfaction, setSatisfaction] = useState(5);
  const [actualEnergy, setActualEnergy] = useState(50);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    const task: Task = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description || '',
      priority: newTask.priority as TaskPriority,
      category: newTask.category as TaskCategory,
      estimated_duration: newTask.estimated_duration || 60,
      energy_required: newTask.energy_required || 50,
      status: TaskStatus.PENDING,
      deadline: newTask.deadline
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      priority: TaskPriority.MEDIUM,
      category: TaskCategory.ROUTINE,
      estimated_duration: 60,
      energy_required: 50,
      description: ''
    });
  };

  const handleCompleteClick = (id: number) => {
      const task = tasks.find(t => t.id === id);
      if (task && task.status !== TaskStatus.COMPLETED) {
          setShowFeedback(id);
      } else {
          toggleStatus(id);
      }
  };

  const submitFeedback = () => {
      if (showFeedback !== null) {
          toggleStatus(showFeedback);
          // In a real app, we would send this feedback (satisfaction, actualEnergy) to the backend/learning system
          console.log(`Feedback for task ${showFeedback}: Sat=${satisfaction}, Energy=${actualEnergy}`);
          setShowFeedback(null);
          setSatisfaction(5);
          setActualEnergy(50);
      }
  };

  const toggleStatus = (id: number) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, status: t.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED } : t
    ));
  };

  const handleDelete = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
      case TaskPriority.URGENT: return 'bg-red-100 text-red-800 border-red-200';
      case TaskPriority.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200';
      case TaskPriority.MEDIUM: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {/* Feedback Modal Overlay */}
      {showFeedback !== null && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-bold mb-4">Task Completed! 🎉</h3>
                  <p className="text-gray-600 mb-6 text-sm">Help the AI agent learn by rating your experience.</p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">Satisfaction (1-10)</label>
                          <input 
                            type="range" min="1" max="10" 
                            value={satisfaction} 
                            onChange={(e) => setSatisfaction(parseInt(e.target.value))}
                            className="w-full accent-indigo-600"
                          />
                          <div className="text-right text-xs font-bold text-indigo-600">{satisfaction}</div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Actual Energy Used (0-100%)</label>
                          <input 
                            type="range" min="0" max="100" 
                            value={actualEnergy} 
                            onChange={(e) => setActualEnergy(parseInt(e.target.value))}
                            className="w-full accent-indigo-600"
                          />
                          <div className="text-right text-xs font-bold text-indigo-600">{actualEnergy}%</div>
                      </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                      <button 
                        onClick={() => setShowFeedback(null)}
                        className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={submitFeedback}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                          Submit
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Add Task Form */}
      <div className="lg:col-span-1">
        <Card title="Add New Task" className="sticky top-6">
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="What needs to be done?"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
                >
                  {Object.values(TaskPriority).map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newTask.category}
                  onChange={e => setNewTask({...newTask, category: e.target.value as TaskCategory})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500"
                >
                  {Object.values(TaskCategory).map(c => (
                    <option key={c} value={c}>{c.replace('_', ' ').charAt(0).toUpperCase() + c.replace('_', ' ').slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input
                  type="number"
                  min="5"
                  value={newTask.estimated_duration}
                  onChange={e => setNewTask({...newTask, estimated_duration: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={newTask.deadline ? newTask.deadline.split('T')[0] : ''}
                  onChange={e => setNewTask({...newTask, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>Energy Required</span>
                <span className="text-gray-500">{newTask.energy_required}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={newTask.energy_required}
                onChange={e => setNewTask({...newTask, energy_required: parseInt(e.target.value)})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low Focus</span>
                <span>High Focus</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add Task
              </button>
            </div>
          </form>
        </Card>
      </div>

      {/* Task List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-gray-800">{tasks.length}</div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Total</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-orange-600">{tasks.filter(t => t.status === TaskStatus.PENDING).length}</div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === TaskStatus.COMPLETED).length}</div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Done</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="text-2xl font-bold text-indigo-600">
                    {Math.round(tasks.reduce((acc, t) => acc + (t.status === TaskStatus.PENDING ? t.estimated_duration : 0), 0) / 60)}h
                </div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Work Load</div>
            </div>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
              No tasks yet. Add one to get started!
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`group bg-white rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${
                  task.status === TaskStatus.COMPLETED ? 'border-gray-100 opacity-75' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => handleCompleteClick(task.id)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === TaskStatus.COMPLETED 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-indigo-500 text-transparent'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    <div>
                      <h4 className={`font-semibold text-lg ${task.status === TaskStatus.COMPLETED ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {task.title}
                      </h4>
                      {task.description && <p className="text-gray-500 text-sm mt-1">{task.description}</p>}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          {task.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {task.estimated_duration}m
                        </span>
                         <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          {task.energy_required}% Energy
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};