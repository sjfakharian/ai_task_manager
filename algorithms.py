"""
Mathematical Algorithms and Calculations (Python Version)
Core algorithms for task scheduling, energy analysis, and productivity metrics

This Python module can be used for backend processing, data analysis, or ML training.
"""

from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class EnergyPattern:
    """Energy pattern data point"""
    hour: int
    energy: float  # 0-100


# Default circadian energy pattern based on human biology
# Peak energy typically occurs mid-morning (9-11 AM)
DEFAULT_ENERGY_PATTERN: List[EnergyPattern] = [
    EnergyPattern(6, 30),
    EnergyPattern(7, 50),
    EnergyPattern(8, 70),
    EnergyPattern(9, 85),
    EnergyPattern(10, 90),  # Peak energy
    EnergyPattern(11, 85),
    EnergyPattern(12, 75),
    EnergyPattern(13, 60),  # Post-lunch dip
    EnergyPattern(14, 50),
    EnergyPattern(15, 55),
    EnergyPattern(16, 70),
    EnergyPattern(17, 75),
    EnergyPattern(18, 70),
    EnergyPattern(19, 60),
    EnergyPattern(20, 50),
    EnergyPattern(21, 40),
    EnergyPattern(22, 30),
    EnergyPattern(23, 20),
]


def find_optimal_time_windows(
    energy_required: float,
    energy_pattern: List[EnergyPattern] = None
) -> List[int]:
    """
    Calculate optimal task scheduling time based on energy requirements.
    
    Args:
        energy_required: Energy level needed for task (0-100)
        energy_pattern: Energy pattern data (defaults to DEFAULT_ENERGY_PATTERN)
    
    Returns:
        Array of optimal time windows (hours) for the task
    """
    if energy_pattern is None:
        energy_pattern = DEFAULT_ENERGY_PATTERN
    
    optimal_hours = []
    for pattern in energy_pattern:
        if pattern.energy >= energy_required:
            optimal_hours.append(pattern.hour)
    
    return optimal_hours


def calculate_peak_energy(
    energy_pattern: List[EnergyPattern] = None
) -> Dict[str, float]:
    """
    Calculate peak energy window.
    
    Args:
        energy_pattern: Energy pattern data (defaults to DEFAULT_ENERGY_PATTERN)
    
    Returns:
        Dictionary with peak hour and energy level
    """
    if energy_pattern is None:
        energy_pattern = DEFAULT_ENERGY_PATTERN
    
    peak = max(energy_pattern, key=lambda x: x.energy)
    return {"hour": peak.hour, "energy": peak.energy}


def calculate_productivity_score(
    completed_tasks: int,
    total_tasks: int,
    energy_alignment: float = 0.5
) -> float:
    """
    Calculate productivity score based on completed tasks and energy alignment.
    
    Args:
        completed_tasks: Number of completed tasks
        total_tasks: Total number of tasks
        energy_alignment: How well tasks were aligned with energy levels (0-1)
    
    Returns:
        Productivity score (0-100)
    """
    if total_tasks == 0:
        return 0.0
    
    completion_rate = completed_tasks / total_tasks
    base_score = completion_rate * 100
    alignment_bonus = energy_alignment * 20  # Up to 20 points bonus
    
    return min(100.0, round(base_score + alignment_bonus, 1))


def calculate_health_score(
    sleep_hours: float,
    break_count: int,
    work_hours: float
) -> float:
    """
    Calculate health score based on sleep, breaks, and work-life balance.
    
    Args:
        sleep_hours: Hours of sleep
        break_count: Number of breaks taken
        work_hours: Total work hours
    
    Returns:
        Health score (0-100)
    """
    # Sleep score (optimal: 7-9 hours)
    if 7 <= sleep_hours <= 9:
        sleep_score = 40.0  # Optimal sleep
    elif 6 <= sleep_hours <= 10:
        sleep_score = 30.0  # Acceptable
    else:
        sleep_score = max(0.0, 40.0 - abs(sleep_hours - 8) * 5)
    
    # Break score (optimal: break every 90 minutes)
    optimal_breaks = int(work_hours / 1.5)
    break_score = min(30.0, (break_count / max(optimal_breaks, 1)) * 30)
    
    # Work-life balance (optimal: 8 hours work)
    if work_hours <= 8:
        balance_score = 30.0
    else:
        balance_score = max(0.0, 30.0 - (work_hours - 8) * 3)
    
    return min(100.0, round(sleep_score + break_score + balance_score, 1))


def calculate_duration(start_time: str, end_time: str) -> int:
    """
    Calculate task duration in minutes from two time strings.
    
    Args:
        start_time: Start time string (HH:MM format)
        end_time: End time string (HH:MM format)
    
    Returns:
        Duration in minutes
    """
    from datetime import datetime, timedelta
    
    start = datetime.strptime(start_time, "%H:%M")
    end = datetime.strptime(end_time, "%H:%M")
    
    # Handle overnight events
    if end < start:
        end += timedelta(days=1)
    
    delta = end - start
    return int(delta.total_seconds() / 60)


def find_deep_work_windows(
    energy_pattern: List[EnergyPattern] = None
) -> List[int]:
    """
    Find deep work windows (energy >= 70).
    
    Args:
        energy_pattern: Energy pattern data (defaults to DEFAULT_ENERGY_PATTERN)
    
    Returns:
        Array of hours suitable for deep work
    """
    if energy_pattern is None:
        energy_pattern = DEFAULT_ENERGY_PATTERN
    
    return [pattern.hour for pattern in energy_pattern if pattern.energy >= 70]


def calculate_energy_alignment(
    scheduled_hour: int,
    task_energy_required: float,
    energy_pattern: List[EnergyPattern] = None
) -> float:
    """
    Calculate energy alignment score for a task scheduled at a specific hour.
    
    Args:
        scheduled_hour: Hour when task is scheduled (0-23)
        task_energy_required: Energy required for the task (0-100)
        energy_pattern: Energy pattern data (defaults to DEFAULT_ENERGY_PATTERN)
    
    Returns:
        Alignment score (0-1), where 1 is perfect alignment
    """
    if energy_pattern is None:
        energy_pattern = DEFAULT_ENERGY_PATTERN
    
    hour_data = next((p for p in energy_pattern if p.hour == scheduled_hour), None)
    if not hour_data:
        return 0.0
    
    available_energy = hour_data.energy
    
    # Perfect alignment: available energy matches required energy
    if available_energy >= task_energy_required:
        # Bonus if we have extra energy (but not too much)
        excess = available_energy - task_energy_required
        return min(1.0, 1.0 - (excess / 100))
    else:
        # Penalty for insufficient energy
        deficit = task_energy_required - available_energy
        return max(0.0, 1.0 - (deficit / 50))


if __name__ == "__main__":
    # Example usage
    print("Energy Pattern Algorithms")
    print("=" * 40)
    
    peak = calculate_peak_energy()
    print(f"Peak Energy: Hour {peak['hour']}, Level {peak['energy']}")
    
    deep_work = find_deep_work_windows()
    print(f"Deep Work Windows: {deep_work}")
    
    optimal = find_optimal_time_windows(80)
    print(f"Optimal times for high-energy tasks (80+): {optimal}")

