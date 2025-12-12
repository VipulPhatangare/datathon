import { computeMetrics, compareCSVData } from '../utils/metrics.js';

/**
 * Simple test runner
 */
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }
}

function assertEquals(actual, expected, message = '') {
  if (Math.abs(actual - expected) > 0.0001) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertArrayEquals(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Arrays don't match. ${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

console.log('\n=== Running Metrics Tests ===\n');

// Test 1: Perfect accuracy (100%)
test('Perfect accuracy - all predictions match', () => {
  const predictions = [
    { row_id: '1', predicted: 'A', actual: 'A' },
    { row_id: '2', predicted: 'B', actual: 'B' },
    { row_id: '3', predicted: 'A', actual: 'A' },
  ];
  
  const result = computeMetrics(predictions);
  assertEquals(result.accuracy, 1.0, 'Accuracy should be 1.0');
  assertEquals(result.precision, 1.0, 'Precision should be 1.0');
  assertEquals(result.recall, 1.0, 'Recall should be 1.0');
  assertEquals(result.f1, 1.0, 'F1 should be 1.0');
  assertEquals(result.matches, 3, 'Should have 3 matches');
});

// Test 2: Zero accuracy
test('Zero accuracy - no predictions match', () => {
  const predictions = [
    { row_id: '1', predicted: 'A', actual: 'B' },
    { row_id: '2', predicted: 'B', actual: 'A' },
    { row_id: '3', predicted: 'A', actual: 'B' },
  ];
  
  const result = computeMetrics(predictions);
  assertEquals(result.accuracy, 0.0, 'Accuracy should be 0.0');
  assertEquals(result.matches, 0, 'Should have 0 matches');
});

// Test 3: 50% accuracy
test('50% accuracy - half correct', () => {
  const predictions = [
    { row_id: '1', predicted: 'A', actual: 'A' },
    { row_id: '2', predicted: 'B', actual: 'A' },
    { row_id: '3', predicted: 'A', actual: 'A' },
    { row_id: '4', predicted: 'B', actual: 'A' },
  ];
  
  const result = computeMetrics(predictions);
  assertEquals(result.accuracy, 0.5, 'Accuracy should be 0.5');
  assertEquals(result.matches, 2, 'Should have 2 matches');
});

// Test 4: Binary classification metrics
test('Binary classification - precision and recall', () => {
  const predictions = [
    { row_id: '1', predicted: 'positive', actual: 'positive' }, // TP
    { row_id: '2', predicted: 'positive', actual: 'negative' }, // FP
    { row_id: '3', predicted: 'negative', actual: 'negative' }, // TN
    { row_id: '4', predicted: 'negative', actual: 'positive' }, // FN
  ];
  
  const result = computeMetrics(predictions);
  
  // For positive class: TP=1, FP=1, FN=1 -> Precision=0.5, Recall=0.5
  // For negative class: TP=1, FP=1, FN=1 -> Precision=0.5, Recall=0.5
  // Average: Precision=0.5, Recall=0.5
  
  assertEquals(result.accuracy, 0.5, 'Accuracy should be 0.5');
  assertEquals(result.precision, 0.5, 'Precision should be 0.5');
  assertEquals(result.recall, 0.5, 'Recall should be 0.5');
  assertEquals(result.f1, 0.5, 'F1 should be 0.5');
});

// Test 5: Multi-class classification
test('Multi-class classification - 3 classes', () => {
  const predictions = [
    { row_id: '1', predicted: 'A', actual: 'A' },
    { row_id: '2', predicted: 'B', actual: 'B' },
    { row_id: '3', predicted: 'C', actual: 'C' },
    { row_id: '4', predicted: 'A', actual: 'B' },
    { row_id: '5', predicted: 'B', actual: 'C' },
    { row_id: '6', predicted: 'C', actual: 'A' },
  ];
  
  const result = computeMetrics(predictions);
  assertEquals(result.accuracy, 0.5, 'Accuracy should be 0.5');
  // Each class has 1 TP, 1 FP, 1 FN
  // Precision per class = 1/2 = 0.5
  // Recall per class = 1/2 = 0.5
  assertEquals(result.precision, 0.5, 'Precision should be 0.5');
  assertEquals(result.recall, 0.5, 'Recall should be 0.5');
});

// Test 6: Empty predictions
test('Empty predictions array', () => {
  const predictions = [];
  const result = computeMetrics(predictions);
  
  assertEquals(result.accuracy, 0, 'Accuracy should be 0');
  assertEquals(result.precision, 0, 'Precision should be 0');
  assertEquals(result.recall, 0, 'Recall should be 0');
  assertEquals(result.f1, 0, 'F1 should be 0');
  assertEquals(result.matches, 0, 'Matches should be 0');
});

// Test 7: Single class prediction
test('Single class - perfect prediction', () => {
  const predictions = [
    { row_id: '1', predicted: 'A', actual: 'A' },
    { row_id: '2', predicted: 'A', actual: 'A' },
    { row_id: '3', predicted: 'A', actual: 'A' },
  ];
  
  const result = computeMetrics(predictions);
  assertEquals(result.accuracy, 1.0, 'Accuracy should be 1.0');
  assertEquals(result.precision, 1.0, 'Precision should be 1.0');
  assertEquals(result.recall, 1.0, 'Recall should be 1.0');
  assertEquals(result.f1, 1.0, 'F1 should be 1.0');
});

// Test 8: CSV comparison with matching rows
test('CSV comparison - all rows match', () => {
  const userCSV = [
    { row_id: '1', label: 'A' },
    { row_id: '2', label: 'B' },
    { row_id: '3', label: 'C' },
  ];
  
  const answerCSV = [
    { row_id: '1', label: 'A' },
    { row_id: '2', label: 'B' },
    { row_id: '3', label: 'C' },
  ];
  
  const result = compareCSVData(userCSV, answerCSV);
  
  assertEquals(result.rowsInCanonical, 3, 'Should have 3 rows in canonical');
  assertEquals(result.rowsInSubmission, 3, 'Should have 3 rows in submission');
  assertEquals(result.rowsCompared, 3, 'Should compare 3 rows');
  assertEquals(result.missingRows, 0, 'Should have 0 missing rows');
  assertEquals(result.extraRows, 0, 'Should have 0 extra rows');
  assertEquals(result.metrics.accuracy, 1.0, 'Accuracy should be 1.0');
});

// Test 9: CSV comparison with missing rows
test('CSV comparison - missing rows in user submission', () => {
  const userCSV = [
    { row_id: '1', label: 'A' },
    { row_id: '2', label: 'B' },
  ];
  
  const answerCSV = [
    { row_id: '1', label: 'A' },
    { row_id: '2', label: 'B' },
    { row_id: '3', label: 'C' },
  ];
  
  const result = compareCSVData(userCSV, answerCSV);
  
  assertEquals(result.rowsInCanonical, 3, 'Should have 3 rows in canonical');
  assertEquals(result.rowsInSubmission, 2, 'Should have 2 rows in submission');
  assertEquals(result.rowsCompared, 2, 'Should compare 2 rows');
  assertEquals(result.missingRows, 1, 'Should have 1 missing row');
  assertEquals(result.extraRows, 0, 'Should have 0 extra rows');
});

// Test 10: CSV comparison with extra rows
test('CSV comparison - extra rows in user submission', () => {
  const userCSV = [
    { row_id: '1', label: 'A' },
    { row_id: '2', label: 'B' },
    { row_id: '3', label: 'C' },
    { row_id: '4', label: 'D' },
  ];
  
  const answerCSV = [
    { row_id: '1', label: 'A' },
    { row_id: '2', label: 'B' },
  ];
  
  const result = compareCSVData(userCSV, answerCSV);
  
  assertEquals(result.rowsInCanonical, 2, 'Should have 2 rows in canonical');
  assertEquals(result.rowsInSubmission, 4, 'Should have 4 rows in submission');
  assertEquals(result.rowsCompared, 2, 'Should compare 2 rows');
  assertEquals(result.missingRows, 0, 'Should have 0 missing rows');
  assertEquals(result.extraRows, 2, 'Should have 2 extra rows');
});

// Test 11: CSV comparison with mismatched labels
test('CSV comparison - some mismatched labels', () => {
  const userCSV = [
    { row_id: '1', label: 'A' },
    { row_id: '2', label: 'X' }, // Wrong
    { row_id: '3', label: 'C' },
    { row_id: '4', label: 'Y' }, // Wrong
  ];
  
  const answerCSV = [
    { row_id: '1', label: 'A' },
    { row_id: '2', label: 'B' },
    { row_id: '3', label: 'C' },
    { row_id: '4', label: 'D' },
  ];
  
  const result = compareCSVData(userCSV, answerCSV);
  
  assertEquals(result.metrics.accuracy, 0.5, 'Accuracy should be 0.5');
  assertEquals(result.metrics.matches, 2, 'Should have 2 matches');
});

// Test 12: F1 score edge case - zero precision and recall
test('F1 score with zero precision and recall', () => {
  const predictions = [
    { row_id: '1', predicted: 'X', actual: 'A' },
    { row_id: '2', predicted: 'X', actual: 'B' },
  ];
  
  const result = computeMetrics(predictions);
  assertEquals(result.f1, 0, 'F1 should be 0 when precision and recall are 0');
});

console.log('\n=== All Tests Passed! ===\n');
