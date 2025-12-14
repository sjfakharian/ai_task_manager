#!/usr/bin/env python3
"""
Example usage of the Smart Task Manager API.
"""
from datetime import datetime, timedelta
from task_manager import SmartTaskManager, Task, Priority, EnergyLevel


def main():
    """Demonstrate API usage."""
    print("=== Smart Task Manager API Demo ===\n")
    
    # Initialize the task manager
    manager = SmartTaskManager(data_file="demo_tasks.json")
    
    # Add some tasks
    print("Adding tasks...")
    task1 = Task(
        title="Write quarterly report",
        description="Q4 2025 performance analysis",
        duration_minutes=120,
        priority=Priority.HIGH,
        required_energy=EnergyLevel.HIGH,
        deadline=datetime.now() + timedelta(days=2),
        tags=["reports", "management"]
    )
    manager.add_task(task1)
    
    task2 = Task(
        title="Review pull requests",
        description="Review team PRs",
        duration_minutes=45,
        priority=Priority.URGENT,
        required_energy=EnergyLevel.HIGH,
        tags=["code-review", "development"]
    )
    manager.add_task(task2)
    
    task3 = Task(
        title="Update documentation",
        description="Update API docs",
        duration_minutes=60,
        priority=Priority.MEDIUM,
        required_energy=EnergyLevel.MEDIUM,
        tags=["documentation"]
    )
    manager.add_task(task3)
    
    task4 = Task(
        title="Respond to emails",
        description="Daily email processing",
        duration_minutes=30,
        priority=Priority.LOW,
        required_energy=EnergyLevel.LOW,
        tags=["communication"]
    )
    manager.add_task(task4)
    
    print(f"✓ Added {len(manager.tasks)} tasks\n")
    
    # List all tasks
    print("Current tasks:")
    for task in manager.list_tasks():
        print(f"  - {task.title} (Priority: {task.priority.name}, Duration: {task.duration_minutes}min)")
    print()
    
    # Schedule the day
    print("Scheduling tasks for today...")
    scheduled = manager.schedule_day(work_start_hour=9, work_end_hour=17)
    print(f"✓ Scheduled {len(scheduled)} tasks\n")
    
    # Show schedule
    print("Today's Schedule:")
    for task in scheduled:
        if task.scheduled_time:
            time_str = task.scheduled_time.strftime("%H:%M")
            end_time = task.scheduled_time + timedelta(minutes=task.duration_minutes)
            end_str = end_time.strftime("%H:%M")
            print(f"  {time_str} - {end_str}: {task.title} ({task.priority.name})")
    print()
    
    # Complete a task
    print("Completing a task...")
    if scheduled:
        first_task = scheduled[0]
        manager.complete_task(first_task.task_id, actual_duration_minutes=40)
        print(f"✓ Completed: {first_task.title}\n")
    
    # Get insights
    print("Productivity Insights:")
    insights = manager.get_insights()
    print(f"  Total tasks: {insights['total_tasks']}")
    print(f"  Completed: {insights['completed_tasks']}")
    print(f"  Pending: {insights['pending_tasks']}")
    print(f"  Completion rate: {insights['completion_rate']:.1%}")
    print(f"  Average duration: {insights['avg_task_duration']:.0f} minutes")
    
    if insights['recommendations']:
        print("\n  Recommendations:")
        for rec in insights['recommendations']:
            print(f"    • {rec}")
    
    print("\n✓ Demo completed!")
    print(f"  Data saved to: demo_tasks.json")


if __name__ == '__main__':
    main()
