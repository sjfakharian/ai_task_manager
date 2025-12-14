export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export enum TaskCategory {
  DEEP_WORK = "deep_work",
  CREATIVE = "creative",
  MEETINGS = "meetings",
  ADMINISTRATIVE = "administrative",
  ROUTINE = "routine",
  LEARNING = "learning"
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  estimated_duration: number; // minutes
  energy_required: number; // 0-100
  deadline?: string;
}

export interface TimeBlock {
  id: number;
  start_time: string;
  end_time: string;
  duration: number;
  block_type: 'task' | 'break' | 'meal' | 'sleep' | 'exercise' | 'personal' | 'meeting';
  title: string;
  is_completed: boolean;
  source?: 'google_calendar' | 'local';
}

export interface Schedule {
  id: number;
  date: string;
  productivity_score: number;
  health_score: number;
  overall_score: number;
  time_blocks: TimeBlock[];
}

export interface Preferences {
  work_start_time: string;
  work_end_time: string;
  lunch_break_start: string;
  preferred_wake_time: string;
  preferred_sleep_time: string;
  chronotype: 'morning' | 'evening' | 'neutral';
  daily_deep_work_target: number;
}

export interface HealthRecommendation {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  type: string;
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}