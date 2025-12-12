import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Result from './pages/Result';
import Submissions from './pages/Submissions';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />

        {/* Protected user routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <Navigate to="/admin" /> : <Upload />}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/result" 
          element={
            <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/submissions" 
          element={
            <ProtectedRoute>
              <Submissions />
            </ProtectedRoute>
          } 
        />

        {/* Leaderboard - accessible to all authenticated users */}
        <Route 
          path="/leaderboard" 
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
