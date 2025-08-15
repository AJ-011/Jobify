// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';

// --- Mock Data & Placeholders ---
const mockUser = { name: 'Jane Doe', email: 'jane.doe@example.com' };
const mockSavedApplications = [
  { id: 1, jobTitle: 'Frontend Developer', company: 'Vercel', date: '2025-08-10', score: 85 },
  { id: 2, jobTitle: 'Full-Stack Engineer', company: 'Stripe', date: '2025-08-08', score: 72 },
  { id: 3, jobTitle: 'Backend Engineer', company: 'Render', date: '2025-08-05', score: 65 },
  { id: 4, jobTitle: 'UI/UX Designer', company: 'Figma', date: '2025-08-02', score: 92 },
];

// --- SVG Icons ---
const PlusIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);

const LogoutIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
);


// --- Main App Component ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsAuthenticated(true); 
      setIsLoading(false);
    }, 1500);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-container">
      {isAuthenticated ? <DashboardPage onLogout={() => setIsAuthenticated(false)} /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />}
    </div>
  );
}


// --- Page Components ---

const LoadingScreen = () => (
  <div className="loading-screen">
    <div>
        <h1>Jobify</h1>
        <div className="loader-bar"></div>
    </div>
  </div>
);


const LoginPage = ({ onLogin }) => (
  <div className="login-page">
    <div className="login-card">
      <div className="header">
        <h1>Welcome Back</h1>
        <p>Sign in to unlock your potential.</p>
      </div>
      <form className="login-form">
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" required placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" required placeholder="••••••••" />
        </div>
        <button
          type="button"
          onClick={onLogin}
          className="submit-btn"
        >
          Sign In
        </button>
      </form>
    </div>
  </div>
);


const DashboardPage = ({ onLogout }) => {
  // Helper function to return a CSS class name based on the score
  const getScoreColorClass = (score) => {
    if (score > 80) return 'score-high';
    if (score > 60) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
          <div>
              <h1>Welcome, {mockUser.name}</h1>
              <p>Here's a summary of your tracked applications.</p>
          </div>
          <div className="header-actions">
               <button className="new-analysis-btn">
                   <PlusIcon />
                   <span>New Analysis</span>
              </button>
              <button onClick={onLogout} className="logout-btn">
                  <LogoutIcon />
              </button>
          </div>
      </header>

      <main className="dashboard-main">
          <h2>Tracked Applications</h2>
          <div className="applications-list-container">
              <ul className="applications-list">
                  {mockSavedApplications.map((app, index) => (
                      <li 
                        key={app.id} 
                        className="application-item" 
                        style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}
                      >
                          <div>
                              <p className="job-title">{app.jobTitle}</p>
                              <p className="company-info">{app.company} - Applied on {app.date}</p>
                          </div>
                          <div className="details">
                               <div className="score-container">
                                   <p className="score-label">Match Score</p>
                                   <p className={`score-value ${getScoreColorClass(app.score)}`}>{app.score}%</p>
                               </div>
                               <button className="view-details-btn">View Details</button>
                          </div>
                      </li>
                  ))}
              </ul>
          </div>
      </main>
    </div>
  );
};
