#!/usr/bin/env python3
"""
Tests for the Smart Task Manager.
"""
import unittest
import os
import json
from datetime import datetime, timedelta

from task_manager import (
    Task, Priority, EnergyLevel, EnergyProfile, 
    DynamicScheduler, AIRecommendationEngine, SmartTaskManager
)


class TestTask(unittest.TestCase):
    """Test Task class."""
    
    def test_task_creation(self):
        """Test creating a task."""
        task = Task(
            title="Test Task",
            description="Test description",
            duration_minutes=60,
            priority=Priority.HIGH
        )
        
        self.assertEqual(task.title, "Test Task")
        self.assertEqual(task.description, "Test description")
        self.assertEqual(task.duration_minutes, 60)
        self.assertEqual(task.priority, Priority.HIGH)
        self.assertFalse(task.completed)
    
    def test_task_serialization(self):
        """Test task serialization and deserialization."""
        original = Task(
            title="Test Task",
            duration_minutes=30,
            priority=Priority.URGENT,
            deadline=datetime.now() + timedelta(days=1)
        )
        
        # Serialize
        data = original.to_dict()
        
        # Deserialize
        restored = Task.from_dict(data)
        
        self.assertEqual(restored.title, original.title)
        self.assertEqual(restored.duration_minutes, original.duration_minutes)
        self.assertEqual(restored.priority, original.priority)


class TestEnergyProfile(unittest.TestCase):
    """Test EnergyProfile class."""
    
    def test_energy_at_time(self):
        """Test getting energy level at specific time."""
        profile = EnergyProfile()
        
        morning = datetime.now().replace(hour=9, minute=0)
        energy = profile.get_energy_at_time(morning)
        
        self.assertIn(energy, [EnergyLevel.LOW, EnergyLevel.MEDIUM, EnergyLevel.HIGH])
    
    def test_find_best_time_slots(self):
        """Test finding optimal time slots."""
        profile = EnergyProfile()
        
        start = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=8)
        
        slots = profile.find_best_time_slots(
            start, end, EnergyLevel.HIGH, 60
        )
        
        self.assertIsInstance(slots, list)
        self.assertTrue(len(slots) > 0)


class TestDynamicScheduler(unittest.TestCase):
    """Test DynamicScheduler class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.energy_profile = EnergyProfile()
        self.scheduler = DynamicScheduler(self.energy_profile)
    
    def test_calculate_task_score(self):
        """Test task scoring."""
        task = Task(
            title="High Priority Task",
            priority=Priority.HIGH,
            required_energy=EnergyLevel.HIGH
        )
        
        morning = datetime.now().replace(hour=9, minute=0)
        score = self.scheduler.calculate_task_score(task, morning)
        
        self.assertIsInstance(score, float)
    
    def test_schedule_tasks(self):
        """Test scheduling multiple tasks."""
        tasks = [
            Task("Task 1", priority=Priority.HIGH, duration_minutes=60),
            Task("Task 2", priority=Priority.MEDIUM, duration_minutes=30),
            Task("Task 3", priority=Priority.LOW, duration_minutes=45),
        ]
        
        start = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=8)
        
        scheduled = self.scheduler.schedule_tasks(tasks, start, end)
        
        self.assertTrue(len(scheduled) <= len(tasks))
        
        # Check that high priority tasks are scheduled
        high_priority_scheduled = any(
            t.priority == Priority.HIGH and t.scheduled_time is not None 
            for t in scheduled
        )
        self.assertTrue(high_priority_scheduled)


class TestAIRecommendationEngine(unittest.TestCase):
    """Test AIRecommendationEngine class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.engine = AIRecommendationEngine()
    
    def test_recommend_energy_level(self):
        """Test energy level recommendation."""
        urgent_task = Task("Urgent", priority=Priority.URGENT)
        recommended = self.engine.recommend_energy_level(urgent_task)
        
        self.assertEqual(recommended, EnergyLevel.HIGH)
    
    def test_learning_from_tasks(self):
        """Test learning from completed tasks."""
        task = Task("Test Task", duration_minutes=30)
        task.completed = True
        
        self.engine.learn_from_task(task, completion_time_minutes=45)
        
        self.assertEqual(len(self.engine.task_history), 1)
        self.assertEqual(self.engine.task_history[0]['actual_duration'], 45)
    
    def test_productivity_insights(self):
        """Test productivity insights generation."""
        tasks = [
            Task("Task 1", priority=Priority.HIGH),
            Task("Task 2", priority=Priority.MEDIUM),
            Task("Task 3", priority=Priority.LOW),
        ]
        tasks[0].completed = True
        
        insights = self.engine.get_productivity_insights(tasks)
        
        self.assertEqual(insights['total_tasks'], 3)
        self.assertEqual(insights['completed_tasks'], 1)
        self.assertEqual(insights['pending_tasks'], 2)
        self.assertAlmostEqual(insights['completion_rate'], 1/3)


class TestSmartTaskManager(unittest.TestCase):
    """Test SmartTaskManager class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_file = "test_tasks.json"
        self.manager = SmartTaskManager(data_file=self.test_file)
    
    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.test_file):
            os.remove(self.test_file)
    
    def test_add_task(self):
        """Test adding a task."""
        task = Task("Test Task", priority=Priority.HIGH)
        added_task = self.manager.add_task(task)
        
        self.assertIsNotNone(added_task.task_id)
        self.assertEqual(len(self.manager.tasks), 1)
    
    def test_complete_task(self):
        """Test completing a task."""
        task = Task("Test Task")
        self.manager.add_task(task)
        
        result = self.manager.complete_task(task.task_id)
        
        self.assertTrue(result)
        self.assertTrue(task.completed)
    
    def test_delete_task(self):
        """Test deleting a task."""
        task = Task("Test Task")
        self.manager.add_task(task)
        
        result = self.manager.delete_task(task.task_id)
        
        self.assertTrue(result)
        self.assertEqual(len(self.manager.tasks), 0)
    
    def test_list_tasks(self):
        """Test listing tasks."""
        self.manager.add_task(Task("Task 1"))
        self.manager.add_task(Task("Task 2"))
        
        task3 = Task("Task 3")
        self.manager.add_task(task3)
        self.manager.complete_task(task3.task_id)
        
        # List without completed
        pending = self.manager.list_tasks(include_completed=False)
        self.assertEqual(len(pending), 2)
        
        # List all
        all_tasks = self.manager.list_tasks(include_completed=True)
        self.assertEqual(len(all_tasks), 3)
    
    def test_schedule_day(self):
        """Test scheduling a day."""
        self.manager.add_task(Task("Task 1", duration_minutes=60, priority=Priority.HIGH))
        self.manager.add_task(Task("Task 2", duration_minutes=30, priority=Priority.MEDIUM))
        
        scheduled = self.manager.schedule_day()
        
        self.assertTrue(len(scheduled) > 0)
        self.assertTrue(all(t.scheduled_time is not None for t in scheduled))
    
    def test_save_and_load(self):
        """Test saving and loading tasks."""
        task1 = Task("Task 1", priority=Priority.HIGH)
        task2 = Task("Task 2", priority=Priority.LOW)
        
        self.manager.add_task(task1)
        self.manager.add_task(task2)
        self.manager.save_tasks()
        
        # Create new manager and load
        new_manager = SmartTaskManager(data_file=self.test_file)
        
        self.assertEqual(len(new_manager.tasks), 2)
        self.assertEqual(new_manager.tasks[0].title, "Task 1")
        self.assertEqual(new_manager.tasks[1].title, "Task 2")
    
    def test_insights(self):
        """Test getting insights."""
        self.manager.add_task(Task("Task 1"))
        self.manager.add_task(Task("Task 2"))
        
        insights = self.manager.get_insights()
        
        self.assertIn('total_tasks', insights)
        self.assertIn('completed_tasks', insights)
        self.assertIn('recommendations', insights)


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    run_tests()
