# Metrics Computation Explained

## Overview

The Analyzer App computes classification metrics by comparing user CSV submissions against a canonical answer CSV. This document explains the mathematical formulas, implementation details, and edge cases.

## Metrics Computed

### 1. Accuracy

**Definition:** The proportion of correct predictions out of all predictions made.

**Formula:**
```
Accuracy = (Number of Correct Predictions) / (Total Number of Predictions)
```

**Example:**
- Total rows compared: 100
- Correct predictions: 85
- Accuracy = 85 / 100 = 0.85 (85%)

**Implementation:**
```javascript
const matches = predictions.filter(p => p.predicted === p.actual).length;
const accuracy = matches / predictions.length;
```

### 2. Precision (Macro-Averaged)

**Definition:** The proportion of true positive predictions among all positive predictions for each class, averaged across all classes.

**Per-Class Formula:**
```
Precision_class = TP / (TP + FP)

Where:
- TP (True Positives) = Predicted as this class AND actually this class
- FP (False Positives) = Predicted as this class BUT actually different class
```

**Macro Average:**
```
Precision = (Sum of all class precisions) / (Number of classes)
```

**Example (Binary Classification):**

Given predictions for "positive" and "negative":

| Actual/Predicted | Positive | Negative |
|-----------------|----------|----------|
| Positive        | 40 (TP)  | 10 (FN)  |
| Negative        | 15 (FP)  | 35 (TN)  |

For "positive" class:
- Precision = 40 / (40 + 15) = 0.727

For "negative" class:
- Precision = 35 / (35 + 10) = 0.778

Macro-averaged Precision = (0.727 + 0.778) / 2 = 0.753

**Example (Multi-Class):**

For 3 classes (A, B, C) with 100 total predictions:

| Class | TP | FP | FN | Precision |
|-------|----|----|----|---------:|
| A     | 30 | 5  | 8  | 0.857    |
| B     | 25 | 10 | 5  | 0.714    |
| C     | 20 | 8  | 12 | 0.714    |

Macro-averaged Precision = (0.857 + 0.714 + 0.714) / 3 = 0.762

### 3. Recall (Macro-Averaged)

**Definition:** The proportion of true positive predictions among all actual instances of each class, averaged across all classes.

**Per-Class Formula:**
```
Recall_class = TP / (TP + FN)

Where:
- TP (True Positives) = Predicted as this class AND actually this class
- FN (False Negatives) = Predicted as different class BUT actually this class
```

**Macro Average:**
```
Recall = (Sum of all class recalls) / (Number of classes)
```

**Example (Binary Classification):**

Using the same confusion matrix as above:

For "positive" class:
- Recall = 40 / (40 + 10) = 0.800

For "negative" class:
- Recall = 35 / (35 + 15) = 0.700

Macro-averaged Recall = (0.800 + 0.700) / 2 = 0.750

### 4. F1 Score

**Definition:** The harmonic mean of precision and recall, providing a single metric that balances both.

**Formula:**
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

**Why Harmonic Mean?**
The harmonic mean penalizes extreme values more than the arithmetic mean, ensuring that both precision and recall must be reasonably high for a good F1 score.

**Example:**
- Precision = 0.753
- Recall = 0.750
- F1 = 2 × (0.753 × 0.750) / (0.753 + 0.750) = 0.751

**Edge Case - Zero Division:**
If both precision and recall are zero:
```
F1 = 0
```

## Implementation Details

### Code Flow

1. **Parse CSVs:** Both user submission and canonical answer are parsed into arrays of objects with `row_id` and `label`.

2. **Match Rows:** Create a map of canonical answers by `row_id` for O(1) lookup.

3. **Compare Labels:** For each matching `row_id`, compare the predicted label with the actual label.

4. **Build Confusion Matrix:** For each class, count TP, FP, FN.

5. **Compute Per-Class Metrics:** Calculate precision and recall for each class.

6. **Macro-Average:** Average precision and recall across all classes.

7. **Compute F1:** Calculate harmonic mean of macro-averaged precision and recall.

### Key Code Snippet

```javascript
export function computeMetrics(predictions) {
  const total = predictions.length;
  let matches = 0;

  // Count matches
  predictions.forEach(pred => {
    if (pred.predicted === pred.actual) {
      matches++;
    }
  });

  // Accuracy
  const accuracy = matches / total;

  // Get all unique labels
  const allLabels = new Set();
  predictions.forEach(pred => {
    allLabels.add(pred.predicted);
    allLabels.add(pred.actual);
  });

  const labels = Array.from(allLabels);

  // Compute precision and recall for each class
  const precisions = [];
  const recalls = [];

  labels.forEach(label => {
    const tp = predictions.filter(
      pred => pred.predicted === label && pred.actual === label
    ).length;

    const fp = predictions.filter(
      pred => pred.predicted === label && pred.actual !== label
    ).length;

    const fn = predictions.filter(
      pred => pred.predicted !== label && pred.actual === label
    ).length;

    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;

    precisions.push(precision);
    recalls.push(recall);
  });

  // Macro-average
  const avgPrecision = precisions.reduce((sum, p) => sum + p, 0) / precisions.length;
  const avgRecall = recalls.reduce((sum, r) => sum + r, 0) / recalls.length;

  // F1 score
  const f1 = (avgPrecision + avgRecall) > 0 
    ? 2 * (avgPrecision * avgRecall) / (avgPrecision + avgRecall)
    : 0;

  return { accuracy, precision: avgPrecision, recall: avgRecall, f1, matches };
}
```

## Edge Cases Handled

### 1. Missing Rows in User Submission

**Scenario:** User submits fewer rows than canonical answer.

**Handling:**
- Only compare rows with matching `row_id`
- Report number of missing rows
- Exclude missing rows from metrics calculation

**Example:**
- Canonical: 100 rows (IDs 1-100)
- User: 95 rows (IDs 1-95)
- Result: Compare 95 rows, report 5 missing

### 2. Extra Rows in User Submission

**Scenario:** User submits additional rows not in canonical answer.

**Handling:**
- Identify extra `row_id` values
- Report number of extra rows
- Exclude extra rows from metrics calculation

**Example:**
- Canonical: 100 rows (IDs 1-100)
- User: 105 rows (IDs 1-105)
- Result: Compare 100 rows, report 5 extra

### 3. Completely Mismatched Row IDs

**Scenario:** User submission has no overlapping `row_id` values.

**Handling:**
- rowsCompared = 0
- Return error message: "No matching rows found"

### 4. Empty Submission

**Scenario:** User uploads CSV with headers but no data rows.

**Handling:**
- Reject at upload with validation error
- Message: "CSV file is empty"

### 5. Single Class Prediction

**Scenario:** All predictions are the same class.

**Handling:**
- If predictions match actual: Perfect metrics (1.0)
- If predictions don't match: Zero metrics (0.0)

### 6. Imbalanced Classes

**Scenario:** Classes have different frequencies.

**Handling:**
- Macro-averaging treats all classes equally
- Each class contributes equally to final metrics
- Prevents dominance by majority class

**Example:**
- Class A: 80 instances
- Class B: 15 instances
- Class C: 5 instances
- Each class's precision/recall weighted equally in average

## Comparison with Other Averaging Methods

### Macro-Average (Used)
- Treats all classes equally
- Good for imbalanced datasets
- Each class contributes 1/N to final metric

### Micro-Average (Not Used)
- Treats all instances equally
- Sum TP/FP/FN across all classes
- Dominated by majority class

### Weighted Average (Not Used)
- Weight by class frequency
- Between macro and micro
- More complex to interpret

**Why Macro?** Ensures fair evaluation across all classes, important when class distribution is unknown or imbalanced.

## Testing Metrics

Unit tests verify:
1. Perfect accuracy (100%)
2. Zero accuracy (0%)
3. Partial accuracy (50%, 80%)
4. Binary classification metrics
5. Multi-class classification
6. Edge cases (empty, single class)
7. CSV comparison logic
8. Missing/extra rows handling

Run tests:
```bash
cd backend
npm test
```

## Performance Considerations

### Time Complexity
- CSV parsing: O(n) where n = number of rows
- Row matching: O(n) with Map lookup
- Metrics computation: O(n × c) where c = number of classes
- Overall: O(n × c), typically O(n) for small c

### Space Complexity
- Storing parsed CSVs: O(n)
- Label sets: O(c)
- Comparison results: O(n)
- Overall: O(n)

### Optimizations
1. **Map-based lookup:** O(1) row matching instead of O(n²)
2. **Single pass:** Count TP/FP/FN in one iteration
3. **Limit preview data:** Store only 20 sample rows in DB
4. **Index on row_id:** Fast canonical CSV queries

## Validation Rules

### Required Columns
- `row_id`: Unique identifier (string)
- `label`: Classification label (string)

### Optional Columns
- Any additional columns allowed
- Ignored during comparison

### Data Types
- All values converted to strings
- Trimmed for whitespace
- Case-sensitive comparison

### File Constraints
- Format: CSV
- Encoding: UTF-8
- Max size: 10MB
- Max rows: No hard limit (practical limit ~100k rows)

## Reporting

### User-Facing Metrics
- Accuracy: Displayed as percentage (85.5%)
- Precision: Displayed as percentage (82.3%)
- Recall: Displayed as percentage (87.1%)
- F1 Score: Displayed as percentage (84.6%)

### Additional Information
- Total rows compared
- Number of correct matches
- Number of mismatches
- Missing rows count
- Extra rows count
- Sample of mismatched rows (preview)

### Color Coding
- Green (≥80%): Good performance
- Yellow (60-79%): Medium performance
- Red (<60%): Poor performance

## References

1. **Precision and Recall:** https://en.wikipedia.org/wiki/Precision_and_recall
2. **F1 Score:** https://en.wikipedia.org/wiki/F-score
3. **Macro vs Micro Averaging:** https://scikit-learn.org/stable/modules/model_evaluation.html
4. **Confusion Matrix:** https://en.wikipedia.org/wiki/Confusion_matrix

---

**Last Updated:** December 2025
