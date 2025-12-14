# AI Task Manager

Smart task manager with dynamic scheduling, energy level optimization, Google Calendar sync, and AI-powered recommendations.

## Features

- **Dynamic Scheduling**: Automatically schedules tasks based on priority, deadlines, and available time slots
- **Energy Level Optimization**: Matches tasks to your energy levels throughout the day for maximum productivity
- **Google Calendar Sync**: Seamlessly syncs your tasks with Google Calendar
- **AI-Powered Recommendations**: Learn from your task completion patterns and get intelligent suggestions
- **Priority Management**: Support for multiple priority levels (Low, Medium, High, Urgent)
- **Productivity Insights**: Get detailed analytics on your task completion and productivity patterns

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sjfakharian/ai_task_manager.git
cd ai_task_manager
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Quick Start

### Adding a Task

```bash
python cli.py add "Write project documentation" -p high -m 60 -e high
```

### Listing Tasks

```bash
python cli.py list
```

### Scheduling Your Day

```bash
python cli.py schedule
```

### Completing a Task

```bash
python cli.py complete <task_id>
```

### Getting Productivity Insights

```bash
python cli.py insights
```

## Usage Examples

### Add a task with deadline
```bash
python cli.py add "Prepare presentation" \
  --description "Quarterly review presentation" \
  --priority urgent \
  --duration 120 \
  --energy high \
  --deadline "2025-12-20T14:00:00"
```

### Schedule tasks for a specific day
```bash
python cli.py schedule --date "2025-12-15" --start-hour 8 --end-hour 18
```

### Mark a task as completed with actual duration
```bash
python cli.py complete task_1234567890 --actual-duration 45
```

### Sync with Google Calendar
```bash
python cli.py sync
```

## Google Calendar Integration

To enable Google Calendar sync:

1. Create a Google Cloud project and enable the Google Calendar API
2. Download the `credentials.json` file and place it in the project directory
3. Run the sync command:
```bash
python cli.py sync
```

The first time you run this, it will open a browser window for authentication.

## Energy Profile

The task manager uses an energy profile to optimize when tasks are scheduled. The default profile assumes:

- **High energy**: 8 AM - 10 AM, 4 PM
- **Medium energy**: 7 AM, 11 AM - 12 PM, 3 PM, 5 PM - 6 PM
- **Low energy**: 6 AM, 1 PM - 2 PM (post-lunch dip), 7 PM - 8 PM

You can customize this by modifying the `EnergyProfile` class in `task_manager.py`.

## AI Recommendations

The AI engine learns from your task completion patterns and provides:

- **Duration estimation**: Suggests realistic task durations based on similar past tasks
- **Energy level matching**: Recommends optimal energy levels for different task types
- **Productivity insights**: Analyzes your completion rates and provides actionable recommendations

## API Usage

You can also use the task manager programmatically:

```python
from task_manager import SmartTaskManager, Task, Priority, EnergyLevel
from datetime import datetime, timedelta

# Initialize manager
manager = SmartTaskManager()

# Add a task
task = Task(
    title="Code review",
    description="Review pull requests",
    duration_minutes=45,
    priority=Priority.HIGH,
    required_energy=EnergyLevel.HIGH,
    deadline=datetime.now() + timedelta(days=1)
)
manager.add_task(task)

# Schedule the day
scheduled = manager.schedule_day()

# Get insights
insights = manager.get_insights()
print(f"Completion rate: {insights['completion_rate']:.1%}")
```

## CLI Commands

- `add` - Add a new task
- `list` - List all tasks
- `complete` - Mark a task as completed
- `delete` - Delete a task
- `schedule` - Schedule tasks for the day
- `insights` - Get productivity insights
- `sync` - Sync tasks with Google Calendar

Run `python cli.py <command> --help` for detailed options.

## Testing

Run the test suite:

```bash
python test_task_manager.py
```

## Configuration

Copy `config.yaml.example` to `config.yaml` and customize your preferences:

- Working hours
- Energy profile
- Default task settings
- Google Calendar preferences
- AI settings

## Data Storage

Tasks are stored in `tasks.json` in the current directory. This file contains:
- All your tasks
- AI learning history
- Task completion data

## Requirements

- Python 3.7+
- numpy
- scikit-learn
- python-dateutil
- pytz
- google-auth-oauthlib (for Calendar sync)
- google-auth-httplib2 (for Calendar sync)
- google-api-python-client (for Calendar sync)

## License

See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
