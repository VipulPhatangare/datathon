/**
 * Compute classification metrics
 * 
 * Formulas:
 * - Accuracy = (correct predictions) / (total predictions)
 * - Precision = TP / (TP + FP) for each class, then averaged
 * - Recall = TP / (TP + FN) for each class, then averaged
 * - F1 = 2 * (Precision * Recall) / (Precision + Recall)
 * 
 * For multi-class problems, we compute macro-averaged metrics:
 * - Calculate precision/recall for each class separately
 * - Average across all classes (macro average)
 */

/**
 * Compute all metrics from predictions and actual labels
 * @param {Array} predictions - Array of { row_id, predicted, actual }
 * @returns {Object} - { accuracy, precision, recall, f1, matches }
 */
export function computeMetrics(predictions) {
  if (!predictions || predictions.length === 0) {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1: 0,
      matches: 0
    };
  }

  const total = predictions.length;
  let matches = 0;

  // Count matches
  predictions.forEach(pred => {
    if (pred.predicted === pred.actual) {
      matches++;
    }
  });

  // Compute accuracy
  const accuracy = matches / total;

  // Get all unique labels from both predicted and actual
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
    // True Positives: predicted as label AND actually label
    const tp = predictions.filter(
      pred => pred.predicted === label && pred.actual === label
    ).length;

    // False Positives: predicted as label BUT actually something else
    const fp = predictions.filter(
      pred => pred.predicted === label && pred.actual !== label
    ).length;

    // False Negatives: predicted as something else BUT actually label
    const fn = predictions.filter(
      pred => pred.predicted !== label && pred.actual === label
    ).length;

    // Precision for this class
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    precisions.push(precision);

    // Recall for this class
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    recalls.push(recall);
  });

  // Macro-averaged precision and recall
  const avgPrecision = precisions.reduce((sum, p) => sum + p, 0) / precisions.length;
  const avgRecall = recalls.reduce((sum, r) => sum + r, 0) / recalls.length;

  // F1 score
  const f1 = (avgPrecision + avgRecall) > 0 
    ? 2 * (avgPrecision * avgRecall) / (avgPrecision + avgRecall)
    : 0;

  return {
    accuracy: parseFloat(accuracy.toFixed(6)),
    precision: parseFloat(avgPrecision.toFixed(6)),
    recall: parseFloat(avgRecall.toFixed(6)),
    f1: parseFloat(f1.toFixed(6)),
    matches
  };
}

/**
 * Compare user submission with canonical answer CSV
 * @param {Array} userCSVData - User's uploaded CSV data
 * @param {Array} answerCSVData - Canonical answer CSV data
 * @returns {Object} - Comparison results with metrics and preview
 */
export function compareCSVData(userCSVData, answerCSVData) {
  // Create a map for quick lookup of canonical answers by row_id
  const answerMap = new Map();
  answerCSVData.forEach(row => {
    answerMap.set(row.row_id, row.label);
  });

  // Create a map for user submissions
  const userMap = new Map();
  userCSVData.forEach(row => {
    userMap.set(row.row_id, row.label);
  });

  // Find common row_ids and compare
  const comparisons = [];
  const missingInUser = [];
  const extraInUser = [];

  // Check each row in canonical answer
  answerCSVData.forEach(answerRow => {
    const rowId = answerRow.row_id;
    if (userMap.has(rowId)) {
      const predicted = userMap.get(rowId);
      const actual = answerRow.label;
      comparisons.push({
        row_id: rowId,
        predicted,
        actual,
        match: predicted === actual
      });
    } else {
      missingInUser.push(rowId);
    }
  });

  // Check for extra rows in user submission
  userCSVData.forEach(userRow => {
    if (!answerMap.has(userRow.row_id)) {
      extraInUser.push(userRow.row_id);
    }
  });

  // Compute metrics on compared rows
  const metrics = computeMetrics(comparisons);

  return {
    comparisons,
    metrics,
    rowsInCanonical: answerCSVData.length,
    rowsInSubmission: userCSVData.length,
    rowsCompared: comparisons.length,
    missingRows: missingInUser.length,
    extraRows: extraInUser.length,
    missingRowIds: missingInUser.slice(0, 10), // Sample
    extraRowIds: extraInUser.slice(0, 10) // Sample
  };
}
