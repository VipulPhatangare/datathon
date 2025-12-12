import { useState, useEffect } from 'react';
import { leaderboardAPI } from '../api';
import { useAuth } from '../AuthContext';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await leaderboardAPI.getLeaderboard(50, true);
      setLeaderboard(response.data.leaderboard);
      setUserRank(response.data.userRank);
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <h1 className="card-title">Leaderboard</h1>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {userRank && (
          <div className="alert alert-info">
            <strong>Your Rank:</strong> #{userRank.rank} out of {userRank.totalUsers} participants
            <br />
            <strong>Your Best Accuracy:</strong> {(userRank.accuracy * 100).toFixed(2)}% | 
            <strong> F1:</strong> {(userRank.f1 * 100).toFixed(2)}%
          </div>
        )}

        {leaderboard.length === 0 ? (
          <div className="text-center">
            <p className="text-muted">No submissions yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team Name</th>
                  <th>Accuracy</th>
                  <th>F1 Score</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>Submission Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const isCurrentUser = user && entry.userId === user.id;
                  return (
                    <tr 
                      key={entry.userId} 
                      style={{
                        backgroundColor: isCurrentUser ? '#fff3cd' : 'transparent',
                        fontWeight: isCurrentUser ? 'bold' : 'normal'
                      }}
                    >
                      <td>
                        {entry.rank === 1 && '🥇'}
                        {entry.rank === 2 && '🥈'}
                        {entry.rank === 3 && '🥉'}
                        {entry.rank > 3 && `#${entry.rank}`}
                      </td>
                      <td>
                        {entry.teamName}
                        {isCurrentUser && ' (You)'}
                      </td>
                      <td>
                        <strong style={{ color: '#27ae60' }}>
                          {(entry.accuracy * 100).toFixed(2)}%
                        </strong>
                      </td>
                      <td>{(entry.f1 * 100).toFixed(2)}%</td>
                      <td>{(entry.precision * 100).toFixed(2)}%</td>
                      <td>{(entry.recall * 100).toFixed(2)}%</td>
                      <td>{new Date(entry.submissionDate).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
