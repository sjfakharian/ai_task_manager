# Algorithms and Utilities

This directory contains mathematical algorithms and utility functions used throughout the application.

## Files

### `algorithms.ts`
TypeScript implementation of core algorithms for:
- Energy pattern calculations
- Task scheduling optimization
- Productivity and health score calculations
- Time duration calculations
- Energy alignment scoring

### `algorithms.py`
Python implementation of the same algorithms. Useful for:
- Backend processing
- Data analysis
- Machine learning integration
- Batch processing

## Algorithms Overview

### Energy Pattern Analysis
- **Circadian Rhythm**: Default energy pattern based on human biology
- **Peak Energy Detection**: Identifies optimal work windows
- **Deep Work Windows**: Finds hours suitable for high-focus tasks

### Scheduling Algorithms
- **Optimal Time Windows**: Calculates best times to schedule tasks based on energy requirements
- **Energy Alignment**: Scores how well tasks are aligned with available energy

### Scoring Algorithms
- **Productivity Score**: Based on task completion and energy alignment
- **Health Score**: Based on sleep, breaks, and work-life balance

## Usage

### TypeScript
```typescript
import { 
  findOptimalTimeWindows, 
  calculateProductivityScore,
  DEFAULT_ENERGY_PATTERN 
} from './utils/algorithms';

const optimalHours = findOptimalTimeWindows(85);
const score = calculateProductivityScore(8, 10, 0.8);
```

### Python
```python
from utils.algorithms import (
    find_optimal_time_windows,
    calculate_productivity_score,
    DEFAULT_ENERGY_PATTERN
)

optimal_hours = find_optimal_time_windows(85)
score = calculate_productivity_score(8, 10, 0.8)
```

## Mathematical Formulas

### Productivity Score
```
Productivity = (Completed Tasks / Total Tasks) × 100 + (Energy Alignment × 20)
```

### Health Score
```
Health = Sleep Score (0-40) + Break Score (0-30) + Balance Score (0-30)
```

### Energy Alignment
```
Alignment = 1 - (|Available Energy - Required Energy| / Penalty Factor)
```

