#!/usr/bin/env python3
"""
CLI interface for the Smart Task Manager.
"""
import sys
import argparse
from datetime import datetime, timedelta
from typing import Optional

from task_manager import (
    SmartTaskManager, Task, Priority, EnergyLevel
)

try:
    from calendar_sync import GoogleCalendarSync
    CALENDAR_AVAILABLE = True
except ImportError:
    CALENDAR_AVAILABLE = False


def parse_priority(priority_str: str) -> Priority:
    """Parse priority from string."""
    priority_map = {
        'low': Priority.LOW,
        'medium': Priority.MEDIUM,
        'high': Priority.HIGH,
        'urgent': Priority.URGENT
    }
    return priority_map.get(priority_str.lower(), Priority.MEDIUM)


def parse_energy(energy_str: str) -> EnergyLevel:
    """Parse energy level from string."""
    energy_map = {
        'low': EnergyLevel.LOW,
        'medium': EnergyLevel.MEDIUM,
        'high': EnergyLevel.HIGH
    }
    return energy_map.get(energy_str.lower(), EnergyLevel.MEDIUM)


def parse_datetime(date_str: str) -> Optional[datetime]:
    """Parse datetime from string."""
    if not date_str:
        return None
    
    try:
        # Try parsing ISO format
        return datetime.fromisoformat(date_str)
    except ValueError:
        pass
    
    try:
        # Try common formats
        from dateutil import parser
        return parser.parse(date_str)
    except:
        return None


def cmd_add(manager: SmartTaskManager, args):
    """Add a new task."""
    deadline = parse_datetime(args.deadline) if args.deadline else None
    
    task = Task(
        title=args.title,
        description=args.description or "",
        duration_minutes=args.duration,
        priority=parse_priority(args.priority),
        deadline=deadline,
        required_energy=parse_energy(args.energy),
        tags=args.tags.split(',') if args.tags else []
    )
    
    manager.add_task(task)
    print(f"✓ Task added: {task.title} (ID: {task.task_id})")


def cmd_list(manager: SmartTaskManager, args):
    """List all tasks."""
    tasks = manager.list_tasks(include_completed=args.all)
    
    if not tasks:
        print("No tasks found.")
        return
    
    print(f"\n{'ID':<20} {'Title':<30} {'Priority':<10} {'Duration':<10} {'Status':<10}")
    print("-" * 90)
    
    for task in tasks:
        status = "✓ Done" if task.completed else "Pending"
        if task.scheduled_time and not task.completed:
            status = f"Scheduled: {task.scheduled_time.strftime('%Y-%m-%d %H:%M')}"
        
        print(f"{task.task_id:<20} {task.title[:28]:<30} {task.priority.name:<10} {task.duration_minutes:<10} {status:<10}")


def cmd_complete(manager: SmartTaskManager, args):
    """Mark a task as completed."""
    if manager.complete_task(args.task_id, args.actual_duration):
        print(f"✓ Task {args.task_id} marked as completed")
    else:
        print(f"✗ Task {args.task_id} not found")


def cmd_delete(manager: SmartTaskManager, args):
    """Delete a task."""
    if manager.delete_task(args.task_id):
        print(f"✓ Task {args.task_id} deleted")
    else:
        print(f"✗ Task {args.task_id} not found")


def cmd_schedule(manager: SmartTaskManager, args):
    """Schedule tasks for the day."""
    date = parse_datetime(args.date) if args.date else datetime.now()
    
    scheduled = manager.schedule_day(
        date=date,
        work_start_hour=args.start_hour,
        work_end_hour=args.end_hour
    )
    
    if not scheduled:
        print("No tasks to schedule.")
        return
    
    print(f"\n📅 Schedule for {date.strftime('%Y-%m-%d')}:")
    print(f"{'Time':<20} {'Task':<30} {'Duration':<10} {'Priority':<10}")
    print("-" * 80)
    
    for task in scheduled:
        if task.scheduled_time:
            time_str = task.scheduled_time.strftime('%H:%M')
            print(f"{time_str:<20} {task.title[:28]:<30} {task.duration_minutes} min    {task.priority.name:<10}")


def cmd_insights(manager: SmartTaskManager, args):
    """Get productivity insights."""
    insights = manager.get_insights()
    
    print("\n📊 Productivity Insights:")
    print("-" * 50)
    print(f"Total tasks: {insights['total_tasks']}")
    print(f"Completed: {insights['completed_tasks']}")
    print(f"Pending: {insights['pending_tasks']}")
    print(f"Completion rate: {insights['completion_rate']:.1%}")
    print(f"Average task duration: {insights['avg_task_duration']:.0f} minutes")
    print(f"High priority pending: {insights['high_priority_pending']}")
    
    if insights['recommendations']:
        print("\n💡 Recommendations:")
        for rec in insights['recommendations']:
            print(f"  • {rec}")


def cmd_sync(manager: SmartTaskManager, args):
    """Sync tasks with Google Calendar."""
    if not CALENDAR_AVAILABLE:
        print("✗ Google Calendar sync not available. Install required packages:")
        print("  pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        return
    
    try:
        sync = GoogleCalendarSync()
        
        if not sync.authenticate():
            print("✗ Failed to authenticate with Google Calendar")
            print("  Make sure you have credentials.json in the current directory")
            return
        
        tasks = manager.list_tasks()
        synced = sync.sync_tasks_to_calendar(tasks)
        
        print(f"✓ Synced {synced} tasks to Google Calendar")
        
    except Exception as e:
        print(f"✗ Error syncing with Google Calendar: {e}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Smart Task Manager with AI-powered scheduling and optimization'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Add task command
    add_parser = subparsers.add_parser('add', help='Add a new task')
    add_parser.add_argument('title', help='Task title')
    add_parser.add_argument('-d', '--description', help='Task description')
    add_parser.add_argument('-m', '--duration', type=int, default=30, help='Duration in minutes (default: 30)')
    add_parser.add_argument('-p', '--priority', default='medium', 
                           choices=['low', 'medium', 'high', 'urgent'],
                           help='Task priority (default: medium)')
    add_parser.add_argument('-e', '--energy', default='medium',
                           choices=['low', 'medium', 'high'],
                           help='Required energy level (default: medium)')
    add_parser.add_argument('--deadline', help='Deadline (ISO format or natural language)')
    add_parser.add_argument('-t', '--tags', help='Comma-separated tags')
    
    # List tasks command
    list_parser = subparsers.add_parser('list', help='List all tasks')
    list_parser.add_argument('-a', '--all', action='store_true', 
                            help='Include completed tasks')
    
    # Complete task command
    complete_parser = subparsers.add_parser('complete', help='Mark task as completed')
    complete_parser.add_argument('task_id', help='Task ID')
    complete_parser.add_argument('--actual-duration', type=int, 
                                help='Actual duration in minutes')
    
    # Delete task command
    delete_parser = subparsers.add_parser('delete', help='Delete a task')
    delete_parser.add_argument('task_id', help='Task ID')
    
    # Schedule command
    schedule_parser = subparsers.add_parser('schedule', help='Schedule tasks for the day')
    schedule_parser.add_argument('-d', '--date', help='Date to schedule (default: today)')
    schedule_parser.add_argument('--start-hour', type=int, default=9, 
                                help='Work start hour (default: 9)')
    schedule_parser.add_argument('--end-hour', type=int, default=17,
                                help='Work end hour (default: 17)')
    
    # Insights command
    insights_parser = subparsers.add_parser('insights', help='Get productivity insights')
    
    # Sync command
    sync_parser = subparsers.add_parser('sync', help='Sync tasks with Google Calendar')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize task manager
    manager = SmartTaskManager()
    
    # Execute command
    commands = {
        'add': cmd_add,
        'list': cmd_list,
        'complete': cmd_complete,
        'delete': cmd_delete,
        'schedule': cmd_schedule,
        'insights': cmd_insights,
        'sync': cmd_sync,
    }
    
    cmd_func = commands.get(args.command)
    if cmd_func:
        cmd_func(manager, args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
