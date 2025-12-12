import { useLocation, useNavigate } from 'react-router-dom';

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const submission = location.state?.submission;

  if (!submission) {
    return (
      <div className="main-content">
        <div className="card">
          <h1 className="card-title">No Results</h1>
          <p>No submission data found.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  const getMetricColor = (value) => {
    if (value >= 0.8) return 'good';
    if (value >= 0.6) return 'medium';
    return 'poor';
  };

  const { metrics, summary, preview } = submission;

  return (
    <div className="main-content">
      <div className="card">
        <h1 className="card-title">Submission Results</h1>
        
        <div className="alert alert-success">
          <strong>Submission processed successfully!</strong>
          <br />
          Attempt #{submission.attemptNumber} - {submission.filename}
        </div>

        <h2 className="card-subtitle">Performance Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Accuracy</div>
            <div className={`metric-value ${getMetricColor(metrics.accuracy)}`}>
              {(metrics.accuracy * 100).toFixed(2)}%
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Precision</div>
            <div className={`metric-value ${getMetricColor(metrics.precision)}`}>
              {(metrics.precision * 100).toFixed(2)}%
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Recall</div>
            <div className={`metric-value ${getMetricColor(metrics.recall)}`}>
              {(metrics.recall * 100).toFixed(2)}%
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">F1 Score</div>
            <div className={`metric-value ${getMetricColor(metrics.f1)}`}>
              {(metrics.f1 * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        <h2 className="card-subtitle mt-2">Summary</h2>
        <table className="table">
          <tbody>
            <tr>
              <td><strong>Rows in Canonical Answer</strong></td>
              <td>{summary.rowsInCanonical}</td>
            </tr>
            <tr>
              <td><strong>Rows in Your Submission</strong></td>
              <td>{summary.rowsInSubmission}</td>
            </tr>
            <tr>
              <td><strong>Rows Compared</strong></td>
              <td>{summary.rowsCompared}</td>
            </tr>
            <tr>
              <td><strong>Correct Matches</strong></td>
              <td style={{ color: '#27ae60', fontWeight: 'bold' }}>{summary.matches}</td>
            </tr>
            <tr>
              <td><strong>Mismatches</strong></td>
              <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>{summary.mismatches}</td>
            </tr>
            {summary.missingRows > 0 && (
              <tr>
                <td><strong>Missing Rows</strong></td>
                <td style={{ color: '#f39c12' }}>{summary.missingRows} (in canonical but not in submission)</td>
              </tr>
            )}
            {summary.extraRows > 0 && (
              <tr>
                <td><strong>Extra Rows</strong></td>
                <td style={{ color: '#f39c12' }}>{summary.extraRows} (in submission but not in canonical)</td>
              </tr>
            )}
          </tbody>
        </table>

        {preview && preview.length > 0 && (
          <>
            <h2 className="card-subtitle mt-2">Sample Results (Mismatches Prioritized)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Row ID</th>
                    <th>Your Prediction</th>
                    <th>Actual Label</th>
                    <th>Match</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} style={{ 
                      backgroundColor: row.match ? '#d4edda' : '#fadbd8' 
                    }}>
                      <td>{row.row_id}</td>
                      <td>{row.predicted}</td>
                      <td>{row.actual}</td>
                      <td>
                        {row.match ? (
                          <span style={{ color: '#27ae60' }}>✓ Match</span>
                        ) : (
                          <span style={{ color: '#e74c3c' }}>✗ Mismatch</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex gap-1 mt-2">
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Upload Another
          </button>
          <button onClick={() => navigate('/submissions')} className="btn btn-secondary">
            View All Submissions
          </button>
          <button onClick={() => navigate('/leaderboard')} className="btn btn-secondary">
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;
