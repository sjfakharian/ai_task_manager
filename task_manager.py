"""
Smart Task Manager with dynamic scheduling, energy optimization, and AI recommendations.
"""
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from enum import Enum
import pickle

import numpy as np
from dateutil import parser


class Priority(Enum):
    """Task priority levels."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4


class EnergyLevel(Enum):
    """User energy levels throughout the day."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class Task:
    """Represents a task with all its attributes."""
    
    def __init__(
        self,
        title: str,
        description: str = "",
        duration_minutes: int = 30,
        priority: Priority = Priority.MEDIUM,
        deadline: Optional[datetime] = None,
        required_energy: EnergyLevel = EnergyLevel.MEDIUM,
        tags: Optional[List[str]] = None,
        task_id: Optional[str] = None
    ):
        self.task_id = task_id or self._generate_id()
        self.title = title
        self.description = description
        self.duration_minutes = duration_minutes
        self.priority = priority
        self.deadline = deadline
        self.required_energy = required_energy
        self.tags = tags or []
        self.completed = False
        self.scheduled_time: Optional[datetime] = None
        self.created_at = datetime.now()
        
    def _generate_id(self) -> str:
        """Generate a unique task ID."""
        return f"task_{datetime.now().timestamp()}"
    
    def to_dict(self) -> Dict:
        """Convert task to dictionary for serialization."""
        return {
            'task_id': self.task_id,
            'title': self.title,
            'description': self.description,
            'duration_minutes': self.duration_minutes,
            'priority': self.priority.name,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'required_energy': self.required_energy.name,
            'tags': self.tags,
            'completed': self.completed,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'created_at': self.created_at.isoformat()
        }
    
    @staticmethod
    def from_dict(data: Dict) -> 'Task':
        """Create task from dictionary."""
        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            duration_minutes=data.get('duration_minutes', 30),
            priority=Priority[data.get('priority', 'MEDIUM')],
            deadline=parser.parse(data['deadline']) if data.get('deadline') else None,
            required_energy=EnergyLevel[data.get('required_energy', 'MEDIUM')],
            tags=data.get('tags', []),
            task_id=data.get('task_id')
        )
        task.completed = data.get('completed', False)
        if data.get('scheduled_time'):
            task.scheduled_time = parser.parse(data['scheduled_time'])
        if data.get('created_at'):
            task.created_at = parser.parse(data['created_at'])
        return task


class EnergyProfile:
    """Manages user's energy levels throughout the day."""
    
    def __init__(self):
        # Default energy profile (can be customized per user)
        self.hourly_energy = {
            6: EnergyLevel.LOW,
            7: EnergyLevel.MEDIUM,
            8: EnergyLevel.HIGH,
            9: EnergyLevel.HIGH,
            10: EnergyLevel.HIGH,
            11: EnergyLevel.MEDIUM,
            12: EnergyLevel.MEDIUM,
            13: EnergyLevel.LOW,
            14: EnergyLevel.LOW,
            15: EnergyLevel.MEDIUM,
            16: EnergyLevel.HIGH,
            17: EnergyLevel.MEDIUM,
            18: EnergyLevel.MEDIUM,
            19: EnergyLevel.LOW,
            20: EnergyLevel.LOW,
        }
    
    def get_energy_at_time(self, dt: datetime) -> EnergyLevel:
        """Get energy level at a specific time."""
        hour = dt.hour
        return self.hourly_energy.get(hour, EnergyLevel.MEDIUM)
    
    def find_best_time_slots(
        self,
        start_time: datetime,
        end_time: datetime,
        required_energy: EnergyLevel,
        duration_minutes: int
    ) -> List[datetime]:
        """Find time slots that match the required energy level."""
        slots = []
        current = start_time
        
        while current < end_time:
            if self.get_energy_at_time(current).value >= required_energy.value:
                slots.append(current)
            current += timedelta(minutes=30)  # Check every 30 minutes
        
        return slots


class DynamicScheduler:
    """Dynamic scheduling engine that optimizes task scheduling."""
    
    def __init__(self, energy_profile: EnergyProfile):
        self.energy_profile = energy_profile
    
    def calculate_task_score(
        self,
        task: Task,
        slot_time: datetime
    ) -> float:
        """Calculate a score for scheduling a task at a given time."""
        score = 0.0
        
        # Priority score (0-4)
        score += task.priority.value * 2
        
        # Energy match score (0-3)
        energy_at_slot = self.energy_profile.get_energy_at_time(slot_time)
        if energy_at_slot.value >= task.required_energy.value:
            score += 3
        else:
            score -= (task.required_energy.value - energy_at_slot.value)
        
        # Deadline urgency score
        if task.deadline:
            time_until_deadline = (task.deadline - slot_time).total_seconds() / 3600
            if time_until_deadline < 0:
                score -= 100  # Penalize past deadlines heavily
            elif time_until_deadline < 24:
                score += 5  # Boost tasks due soon
            elif time_until_deadline < 48:
                score += 3
        
        return score
    
    def schedule_tasks(
        self,
        tasks: List[Task],
        start_time: datetime,
        end_time: datetime
    ) -> List[Task]:
        """Schedule tasks optimally within the given time window."""
        # Filter out completed tasks
        pending_tasks = [t for t in tasks if not t.completed]
        
        # Sort by priority and deadline
        pending_tasks.sort(
            key=lambda t: (
                -t.priority.value,
                t.deadline if t.deadline else datetime.max
            )
        )
        
        scheduled_tasks = []
        current_time = start_time
        
        for task in pending_tasks:
            # Find best time slot for this task
            best_slot = None
            best_score = float('-inf')
            
            search_end = min(
                end_time,
                task.deadline - timedelta(minutes=task.duration_minutes)
                if task.deadline else end_time
            )
            
            # Try to find optimal slot
            test_time = current_time
            while test_time < search_end:
                score = self.calculate_task_score(task, test_time)
                if score > best_score:
                    best_score = score
                    best_slot = test_time
                test_time += timedelta(minutes=30)
            
            if best_slot:
                task.scheduled_time = best_slot
                scheduled_tasks.append(task)
                # Move current time forward
                if best_slot >= current_time:
                    current_time = best_slot + timedelta(minutes=task.duration_minutes)
        
        return scheduled_tasks


class AIRecommendationEngine:
    """AI-powered recommendation engine for task management."""
    
    def __init__(self):
        self.task_history = []
        self.model_trained = False
    
    def learn_from_task(self, task: Task, completion_time_minutes: Optional[int] = None):
        """Learn from completed tasks to improve recommendations."""
        if task.completed:
            self.task_history.append({
                'priority': task.priority.value,
                'duration': task.duration_minutes,
                'energy': task.required_energy.value,
                'tags': len(task.tags),
                'actual_duration': completion_time_minutes or task.duration_minutes
            })
    
    def recommend_duration(self, task: Task) -> int:
        """Recommend optimal duration based on similar tasks."""
        if len(self.task_history) < 3:
            return task.duration_minutes
        
        # Simple recommendation based on historical data
        similar_tasks = [
            t for t in self.task_history
            if abs(t['priority'] - task.priority.value) <= 1
        ]
        
        if similar_tasks:
            avg_duration = np.mean([t['actual_duration'] for t in similar_tasks])
            return int(avg_duration)
        
        return task.duration_minutes
    
    def recommend_energy_level(self, task: Task) -> EnergyLevel:
        """Recommend energy level based on task attributes."""
        # High priority tasks typically need higher energy
        if task.priority == Priority.URGENT:
            return EnergyLevel.HIGH
        elif task.priority == Priority.HIGH:
            return EnergyLevel.HIGH if task.duration_minutes > 60 else EnergyLevel.MEDIUM
        elif task.priority == Priority.MEDIUM:
            return EnergyLevel.MEDIUM
        else:
            return EnergyLevel.LOW
    
    def get_productivity_insights(self, tasks: List[Task]) -> Dict[str, any]:
        """Analyze tasks and provide productivity insights."""
        completed = [t for t in tasks if t.completed]
        pending = [t for t in tasks if not t.completed]
        
        insights = {
            'total_tasks': len(tasks),
            'completed_tasks': len(completed),
            'pending_tasks': len(pending),
            'completion_rate': len(completed) / len(tasks) if tasks else 0,
            'avg_task_duration': np.mean([t.duration_minutes for t in tasks]) if tasks else 0,
            'high_priority_pending': len([t for t in pending if t.priority.value >= Priority.HIGH.value])
        }
        
        # Recommendations
        recommendations = []
        if insights['high_priority_pending'] > 3:
            recommendations.append("You have multiple high-priority tasks pending. Consider focusing on these first.")
        if insights['completion_rate'] < 0.5 and len(tasks) > 5:
            recommendations.append("Your completion rate is below 50%. Consider breaking down large tasks into smaller ones.")
        
        insights['recommendations'] = recommendations
        return insights


class SmartTaskManager:
    """Main task manager class integrating all features."""
    
    def __init__(self, data_file: str = "tasks.json"):
        self.data_file = data_file
        self.tasks: List[Task] = []
        self.energy_profile = EnergyProfile()
        self.scheduler = DynamicScheduler(self.energy_profile)
        self.ai_engine = AIRecommendationEngine()
        self.load_tasks()
    
    def add_task(self, task: Task) -> Task:
        """Add a new task."""
        # Use AI to recommend energy level if not specified
        if task.required_energy == EnergyLevel.MEDIUM:
            task.required_energy = self.ai_engine.recommend_energy_level(task)
        
        self.tasks.append(task)
        self.save_tasks()
        return task
    
    def complete_task(self, task_id: str, actual_duration_minutes: Optional[int] = None) -> bool:
        """Mark a task as completed."""
        for task in self.tasks:
            if task.task_id == task_id:
                task.completed = True
                self.ai_engine.learn_from_task(task, actual_duration_minutes)
                self.save_tasks()
                return True
        return False
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task."""
        for i, task in enumerate(self.tasks):
            if task.task_id == task_id:
                self.tasks.pop(i)
                self.save_tasks()
                return True
        return False
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID."""
        for task in self.tasks:
            if task.task_id == task_id:
                return task
        return None
    
    def list_tasks(self, include_completed: bool = False) -> List[Task]:
        """List all tasks."""
        if include_completed:
            return self.tasks
        return [t for t in self.tasks if not t.completed]
    
    def schedule_day(
        self,
        date: Optional[datetime] = None,
        work_start_hour: int = 9,
        work_end_hour: int = 17
    ) -> List[Task]:
        """Schedule tasks for a specific day."""
        if date is None:
            date = datetime.now()
        
        start_time = date.replace(hour=work_start_hour, minute=0, second=0, microsecond=0)
        end_time = date.replace(hour=work_end_hour, minute=0, second=0, microsecond=0)
        
        scheduled = self.scheduler.schedule_tasks(self.tasks, start_time, end_time)
        self.save_tasks()
        return scheduled
    
    def get_insights(self) -> Dict[str, any]:
        """Get AI-powered productivity insights."""
        return self.ai_engine.get_productivity_insights(self.tasks)
    
    def save_tasks(self):
        """Save tasks to file."""
        data = {
            'tasks': [task.to_dict() for task in self.tasks],
            'ai_history': self.ai_engine.task_history
        }
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def load_tasks(self):
        """Load tasks from file."""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                self.tasks = [Task.from_dict(t) for t in data.get('tasks', [])]
                self.ai_engine.task_history = data.get('ai_history', [])
            except (json.JSONDecodeError, KeyError):
                self.tasks = []
