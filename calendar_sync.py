"""
Google Calendar integration for syncing tasks.
"""
import os
import pickle
from datetime import datetime, timedelta
from typing import List, Optional, Dict

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False

from task_manager import Task, Priority, EnergyLevel


# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/calendar']


class GoogleCalendarSync:
    """Sync tasks with Google Calendar."""
    
    def __init__(self, credentials_file: str = 'credentials.json'):
        if not GOOGLE_AVAILABLE:
            raise ImportError(
                "Google Calendar libraries not available. "
                "Install with: pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client"
            )
        
        self.credentials_file = credentials_file
        self.token_file = 'token.pickle'
        self.service = None
        self.calendar_id = 'primary'
    
    def authenticate(self) -> bool:
        """Authenticate with Google Calendar API."""
        creds = None
        
        # Load token if exists
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)
        
        # If no valid credentials, authenticate
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception:
                    # If refresh fails, re-authenticate
                    if not os.path.exists(self.credentials_file):
                        return False
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, SCOPES
                    )
                    creds = flow.run_local_server(port=0)
            else:
                if not os.path.exists(self.credentials_file):
                    return False
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES
                )
                creds = flow.run_local_server(port=0)
            
            # Save credentials
            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)
        
        self.service = build('calendar', 'v3', credentials=creds)
        return True
    
    def task_to_event(self, task: Task) -> Dict:
        """Convert a task to a Google Calendar event."""
        if not task.scheduled_time:
            raise ValueError("Task must have a scheduled time to sync")
        
        end_time = task.scheduled_time + timedelta(minutes=task.duration_minutes)
        
        event = {
            'summary': task.title,
            'description': f"{task.description}\n\nPriority: {task.priority.name}\nEnergy: {task.required_energy.name}",
            'start': {
                'dateTime': task.scheduled_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'UTC',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }
        
        # Add task ID to extended properties for tracking
        event['extendedProperties'] = {
            'private': {
                'task_id': task.task_id
            }
        }
        
        return event
    
    def sync_task_to_calendar(self, task: Task) -> Optional[str]:
        """Sync a single task to Google Calendar."""
        if not self.service:
            if not self.authenticate():
                return None
        
        try:
            event = self.task_to_event(task)
            
            # Check if event already exists
            existing_event_id = self._find_event_by_task_id(task.task_id)
            
            if existing_event_id:
                # Update existing event
                event = self.service.events().update(
                    calendarId=self.calendar_id,
                    eventId=existing_event_id,
                    body=event
                ).execute()
            else:
                # Create new event
                event = self.service.events().insert(
                    calendarId=self.calendar_id,
                    body=event
                ).execute()
            
            return event.get('id')
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None
    
    def sync_tasks_to_calendar(self, tasks: List[Task]) -> int:
        """Sync multiple tasks to Google Calendar."""
        synced_count = 0
        
        for task in tasks:
            if task.scheduled_time and not task.completed:
                if self.sync_task_to_calendar(task):
                    synced_count += 1
        
        return synced_count
    
    def _find_event_by_task_id(self, task_id: str) -> Optional[str]:
        """Find a calendar event by task ID."""
        if not self.service:
            return None
        
        try:
            # Search for events with this task_id in extended properties
            now = datetime.utcnow()
            time_min = (now - timedelta(days=30)).isoformat() + 'Z'
            time_max = (now + timedelta(days=90)).isoformat() + 'Z'
            
            events_result = self.service.events().list(
                calendarId=self.calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                privateExtendedProperty=f'task_id={task_id}',
                singleEvents=True
            ).execute()
            
            events = events_result.get('items', [])
            if events:
                return events[0]['id']
            
        except HttpError:
            pass
        
        return None
    
    def delete_task_from_calendar(self, task_id: str) -> bool:
        """Delete a task's event from Google Calendar."""
        if not self.service:
            if not self.authenticate():
                return False
        
        event_id = self._find_event_by_task_id(task_id)
        if event_id:
            try:
                self.service.events().delete(
                    calendarId=self.calendar_id,
                    eventId=event_id
                ).execute()
                return True
            except HttpError:
                return False
        
        return False
    
    def get_calendar_events(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        """Get events from Google Calendar."""
        if not self.service:
            if not self.authenticate():
                return []
        
        if not start_date:
            start_date = datetime.utcnow()
        if not end_date:
            end_date = start_date + timedelta(days=7)
        
        try:
            events_result = self.service.events().list(
                calendarId=self.calendar_id,
                timeMin=start_date.isoformat() + 'Z',
                timeMax=end_date.isoformat() + 'Z',
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            return events_result.get('items', [])
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return []
    
    def find_free_time_slots(
        self,
        date: datetime,
        duration_minutes: int,
        work_start_hour: int = 9,
        work_end_hour: int = 17
    ) -> List[datetime]:
        """Find free time slots in the calendar."""
        if not self.service:
            if not self.authenticate():
                return []
        
        start_of_day = date.replace(hour=work_start_hour, minute=0, second=0, microsecond=0)
        end_of_day = date.replace(hour=work_end_hour, minute=0, second=0, microsecond=0)
        
        # Get all events for the day
        events = self.get_calendar_events(start_of_day, end_of_day)
        
        # Build list of busy time slots
        busy_slots = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            if 'T' in start:  # dateTime format
                from dateutil import parser
                busy_slots.append((parser.parse(start), parser.parse(end)))
        
        # Find free slots
        free_slots = []
        current_time = start_of_day
        
        while current_time + timedelta(minutes=duration_minutes) <= end_of_day:
            slot_end = current_time + timedelta(minutes=duration_minutes)
            
            # Check if this slot overlaps with any busy slot
            is_free = True
            for busy_start, busy_end in busy_slots:
                if (current_time < busy_end and slot_end > busy_start):
                    is_free = False
                    break
            
            if is_free:
                free_slots.append(current_time)
            
            current_time += timedelta(minutes=30)  # Check every 30 minutes
        
        return free_slots
