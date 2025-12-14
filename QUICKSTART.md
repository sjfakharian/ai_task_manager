# Quick Start Guide

## Installation

```bash
# Clone the repository
git clone https://github.com/sjfakharian/ai_task_manager.git
cd ai_task_manager

# Install dependencies
pip install -r requirements.txt
```

## Basic Usage

### 1. Add Your First Task

```bash
python cli.py add "Complete project proposal" \
  --priority high \
  --duration 90 \
  --energy high \
  --description "Draft and finalize Q1 project proposal"
```

### 2. Add More Tasks

```bash
python cli.py add "Team standup" -p medium -m 15 -e medium
python cli.py add "Code review" -p urgent -m 45 -e high
python cli.py add "Email responses" -p low -m 30 -e low
```

### 3. View Your Tasks

```bash
python cli.py list
```

### 4. Schedule Your Day

```bash
python cli.py schedule
```

The system will automatically arrange your tasks based on:
- Priority levels
- Energy requirements
- Your energy profile throughout the day
- Available time slots

### 5. Complete a Task

```bash
python cli.py complete <task_id> --actual-duration 40
```

### 6. Get Productivity Insights

```bash
python cli.py insights
```

## Advanced Features

### Custom Work Hours

```bash
python cli.py schedule --start-hour 8 --end-hour 18
```

### Add Deadline

```bash
python cli.py add "Submit report" \
  -p urgent \
  -m 120 \
  --deadline "2025-12-20T17:00:00"
```

### Sync with Google Calendar

1. Get your Google Calendar API credentials (`credentials.json`)
2. Run the sync command:

```bash
python cli.py sync
```

## Using the API

```python
from task_manager import SmartTaskManager, Task, Priority, EnergyLevel
from datetime import datetime, timedelta

# Initialize
manager = SmartTaskManager()

# Add a task
task = Task(
    title="Important meeting",
    priority=Priority.HIGH,
    duration_minutes=60,
    required_energy=EnergyLevel.HIGH,
    deadline=datetime.now() + timedelta(days=1)
)
manager.add_task(task)

# Schedule
scheduled = manager.schedule_day()

# Get insights
insights = manager.get_insights()
```

## Energy Profile

The system optimizes task scheduling based on your energy levels:

**High Energy Hours**: 8-10 AM, 4 PM  
Best for: Complex tasks, important meetings, creative work

**Medium Energy Hours**: 7 AM, 11 AM-12 PM, 3 PM, 5-6 PM  
Best for: Regular tasks, collaboration, planning

**Low Energy Hours**: 6 AM, 1-2 PM (post-lunch), 7-8 PM  
Best for: Routine tasks, emails, administrative work

## Tips for Best Results

1. **Be Realistic with Duration**: Track actual completion times to improve AI recommendations
2. **Use Priorities Wisely**: Not everything can be urgent
3. **Match Energy Levels**: Assign energy requirements that match task complexity
4. **Review Insights**: Check productivity metrics regularly
5. **Complete Tasks**: Mark tasks done with actual duration for better learning

## Getting Help

```bash
# General help
python cli.py --help

# Command-specific help
python cli.py add --help
python cli.py schedule --help
```

## Next Steps

- Try the example script: `python example.py`
- Customize your energy profile in `task_manager.py`
- Set up Google Calendar sync
- Check `IMPLEMENTATION.md` for technical details
