/**
 * Mathematical Algorithms and Calculations
 * Core algorithms for task scheduling, energy analysis, and productivity metrics
 */

export interface EnergyPattern {
  hour: number;
  energy: number; // 0-100
}

/**
 * Default circadian energy pattern based on human biology
 * Peak energy typically occurs mid-morning (9-11 AM)
 */
export const DEFAULT_ENERGY_PATTERN: EnergyPattern[] = [
  { hour: 6, energy: 30 },
  { hour: 7, energy: 50 },
  { hour: 8, energy: 70 },
  { hour: 9, energy: 85 },
  { hour: 10, energy: 90 }, // Peak energy
  { hour: 11, energy: 85 },
  { hour: 12, energy: 75 },
  { hour: 13, energy: 60 }, // Post-lunch dip
  { hour: 14, energy: 50 },
  { hour: 15, energy: 55 },
  { hour: 16, energy: 70 },
  { hour: 17, energy: 75 },
  { hour: 18, energy: 70 },
  { hour: 19, energy: 60 },
  { hour: 20, energy: 50 },
  { hour: 21, energy: 40 },
  { hour: 22, energy: 30 },
  { hour: 23, energy: 20 },
];

/**
 * Calculate optimal task scheduling time based on energy requirements
 * @param energyRequired - Energy level needed for task (0-100)
 * @param energyPattern - Energy pattern data
 * @returns Array of optimal time windows (hours) for the task
 */
export function findOptimalTimeWindows(
  energyRequired: number,
  energyPattern: EnergyPattern[] = DEFAULT_ENERGY_PATTERN
): number[] {
  const optimalHours: number[] = [];
  
  energyPattern.forEach(({ hour, energy }) => {
    if (energy >= energyRequired) {
      optimalHours.push(hour);
    }
  });
  
  return optimalHours;
}

/**
 * Calculate peak energy window
 * @param energyPattern - Energy pattern data
 * @returns Object with peak hour and energy level
 */
export function calculatePeakEnergy(
  energyPattern: EnergyPattern[] = DEFAULT_ENERGY_PATTERN
): { hour: number; energy: number } {
  const peak = energyPattern.reduce((max, current) => 
    current.energy > max.energy ? current : max
  );
  
  return { hour: peak.hour, energy: peak.energy };
}

/**
 * Calculate productivity score based on completed tasks and energy alignment
 * @param completedTasks - Number of completed tasks
 * @param totalTasks - Total number of tasks
 * @param energyAlignment - How well tasks were aligned with energy levels (0-1)
 * @returns Productivity score (0-100)
 */
export function calculateProductivityScore(
  completedTasks: number,
  totalTasks: number,
  energyAlignment: number = 0.5
): number {
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const baseScore = completionRate * 100;
  const alignmentBonus = energyAlignment * 20; // Up to 20 points bonus
  
  return Math.min(100, Math.round(baseScore + alignmentBonus));
}

/**
 * Calculate health score based on sleep, breaks, and work-life balance
 * @param sleepHours - Hours of sleep
 * @param breakCount - Number of breaks taken
 * @param workHours - Total work hours
 * @returns Health score (0-100)
 */
export function calculateHealthScore(
  sleepHours: number,
  breakCount: number,
  workHours: number
): number {
  // Sleep score (optimal: 7-9 hours)
  let sleepScore = 0;
  if (sleepHours >= 7 && sleepHours <= 9) {
    sleepScore = 40; // Optimal sleep
  } else if (sleepHours >= 6 && sleepHours <= 10) {
    sleepScore = 30; // Acceptable
  } else {
    sleepScore = Math.max(0, 40 - Math.abs(sleepHours - 8) * 5);
  }
  
  // Break score (optimal: break every 90 minutes)
  const optimalBreaks = Math.floor(workHours / 1.5);
  const breakScore = Math.min(30, (breakCount / Math.max(optimalBreaks, 1)) * 30);
  
  // Work-life balance (optimal: 8 hours work)
  const balanceScore = workHours <= 8 ? 30 : Math.max(0, 30 - (workHours - 8) * 3);
  
  return Math.min(100, Math.round(sleepScore + breakScore + balanceScore));
}

/**
 * Calculate task duration in minutes from two time strings
 * @param startTime - Start time string (HH:MM format)
 * @param endTime - End time string (HH:MM format)
 * @returns Duration in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const start = new Date();
  start.setHours(startHours, startMinutes, 0, 0);
  
  const end = new Date();
  end.setHours(endHours, endMinutes, 0, 0);
  
  // Handle overnight events
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Calculate total estimated time for pending tasks
 * @param tasks - Array of tasks with estimated_duration
 * @returns Total time in minutes
 */
export function calculateTotalTaskTime(tasks: Array<{ estimated_duration: number; status: string }>): number {
  return tasks
    .filter(task => task.status !== 'completed')
    .reduce((total, task) => total + task.estimated_duration, 0);
}

/**
 * Find deep work windows (energy >= 70)
 * @param energyPattern - Energy pattern data
 * @returns Array of hours suitable for deep work
 */
export function findDeepWorkWindows(
  energyPattern: EnergyPattern[] = DEFAULT_ENERGY_PATTERN
): number[] {
  return energyPattern
    .filter(({ energy }) => energy >= 70)
    .map(({ hour }) => hour);
}

/**
 * Calculate energy alignment score for a task scheduled at a specific hour
 * @param scheduledHour - Hour when task is scheduled (0-23)
 * @param taskEnergyRequired - Energy required for the task (0-100)
 * @param energyPattern - Energy pattern data
 * @returns Alignment score (0-1), where 1 is perfect alignment
 */
export function calculateEnergyAlignment(
  scheduledHour: number,
  taskEnergyRequired: number,
  energyPattern: EnergyPattern[] = DEFAULT_ENERGY_PATTERN
): number {
  const hourData = energyPattern.find(({ hour }) => hour === scheduledHour);
  if (!hourData) return 0;
  
  const availableEnergy = hourData.energy;
  
  // Perfect alignment: available energy matches required energy
  if (availableEnergy >= taskEnergyRequired) {
    // Bonus if we have extra energy (but not too much)
    const excess = availableEnergy - taskEnergyRequired;
    return Math.min(1, 1 - (excess / 100));
  } else {
    // Penalty for insufficient energy
    const deficit = taskEnergyRequired - availableEnergy;
    return Math.max(0, 1 - (deficit / 50));
  }
}

