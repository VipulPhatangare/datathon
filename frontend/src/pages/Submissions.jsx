import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissionAPI } from '../api';

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await submissionAPI.getMySubmissions();
      setSubmissions(response.data.submissions);
    } catch (err) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (submissionId) => {
    navigate(`/submission/${submissionId}`);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <h1 className="card-title">My Submissions</h1>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="text-center">
            <p className="text-muted">No submissions yet</p>
            <button onClick={() => navigate('/')} className="btn btn-primary mt-1">
              Upload Your First Submission
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Attempt #</th>
                  <th>Filename</th>
                  <th>Uploaded At</th>
                  <th>Accuracy</th>
                  <th>F1 Score</th>
                  <th>Matches</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td>#{sub.attemptNumber}</td>
                    <td>{sub.filename}</td>
                    <td>{new Date(sub.uploadedAt).toLocaleString()}</td>
                    <td>
                      <strong style={{ 
                        color: sub.accuracy >= 0.8 ? '#27ae60' : 
                               sub.accuracy >= 0.6 ? '#f39c12' : '#e74c3c' 
                      }}>
                        {(sub.accuracy * 100).toFixed(2)}%
                      </strong>
                    </td>
                    <td>{(sub.f1 * 100).toFixed(2)}%</td>
                    <td>{sub.matches} / {sub.rowsTotal}</td>
                    <td>
                      <button 
                        onClick={() => viewDetails(sub._id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Submissions;
