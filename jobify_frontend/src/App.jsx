import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
// Note: App.css is now imported in main.jsx

// --- SVG Icons ---
const PlusIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);

const LogoutIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
);

const CheckIcon = () => <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
const XIcon = () => <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const EmptyStateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);


// --- Main App Component ---
export default function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-container">
      {session ? <DashboardPage session={session} /> : <AuthPage />}
    </div>
  );
}

// --- Reusable Components ---
const JobifyLogo = () => (
  <div className="jobify-logo">
    <span>Jobify</span>
    <div className="logo-dot"></div>
  </div>
);

// --- Page Components ---

const LoadingScreen = () => (
  <div className="loading-screen">
    <div>
        <h1>Jobify</h1>
        <div className="loader-bar"></div>
    </div>
  </div>
);

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.error_description || error.message);
    } else if (isSignUp) {
      alert('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="header" style={{marginBottom: '2rem', display: 'flex', justifyContent: 'center'}}>
          <JobifyLogo />
        </div>
        <div className="header">
          <h1>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isSignUp ? 'Start your journey with Jobify.' : 'Sign in to continue to your dashboard.'}</p>
        </div>
        <form className="login-form" onSubmit={handleAuth}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        <div className="auth-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};


const DashboardPage = ({ session }) => {
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const getApplications = async () => {
    try {
      setLoadingApps(true);
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Could not fetch your saved applications.');
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    getApplications();
  }, []);

  const saveAnalysis = async (result, jobTitle, company) => {
    try {
      const { error } = await supabase.from('analyses').insert({
        job_title: jobTitle,
        company: company,
        analysis_result: result,
        user_id: session.user.id,
      });
      if (error) throw error;
      getApplications();
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('Could not save your analysis.');
    }
  };

  const handleAnalysis = async (formData) => {
    setIsAnalyzing(true);
    setAnalysisModalOpen(false);

    const jobTitle = formData.get('jobTitle') || 'Untitled';
    const company = formData.get('company') || 'N/A';

    try {
      const response = await fetch('https://jobify-le3t.onrender.com/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'An unknown server error occurred.');
      }
      
      setAnalysisResult(result);
      if (result && !result.error) {
        await saveAnalysis(result, jobTitle, company);
      }

    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisResult({ error: true });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getScoreColorClass = (score) => {
    if (score > 80) return 'score-high';
    if (score > 60) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
          <JobifyLogo />
          <div className="header-actions">
              <button className="new-analysis-btn" onClick={() => setAnalysisModalOpen(true)}>
                  <PlusIcon />
                  <span>New Analysis</span>
              </button>
              <button onClick={handleLogout} className="logout-btn">
                  <LogoutIcon />
              </button>
          </div>
      </header>

      <main className="dashboard-main">
          <h2>Tracked Applications</h2>
          <div className="applications-list-container">
              <ul className="applications-list">
                  {loadingApps ? (
                    <li className="empty-state">Loading applications...</li>
                  ) : applications.length > 0 ? applications.map((app, index) => {
                      const score = app.analysis_result?.matchScore ?? 'N/A';
                      const date = app.created_at ? new Date(app.created_at).toLocaleDateString() : '---';
                      return (
                        <li
                          key={app.id}
                          className="application-item"
                          style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}
                        >
                            <div>
                                <p className="job-title">{app.job_title}</p>
                                <p className="company-info">{app.company} - Analyzed on {date}</p>
                            </div>
                            <div className="details">
                                <div className="score-container">
                                    <p className="score-label">Match Score</p>
                                    <p className={`score-value ${getScoreColorClass(score)}`}>{score}{score !== 'N/A' && '%'}</p>
                                </div>
                                <button className="view-details-btn" onClick={() => setAnalysisResult(app.analysis_result)}>View Details</button>
                            </div>
                        </li>
                      )
                  }) : (
                    <li className="empty-state">
                      <EmptyStateIcon />
                      <h3>No Applications Yet</h3>
                      <p>Click "New Analysis" to get started.</p>
                    </li>
                  )}
              </ul>
          </div>
      </main>

      {isAnalysisModalOpen && (
        <AnalysisFormModal
          onClose={() => setAnalysisModalOpen(false)}
          onSubmit={handleAnalysis}
        />
      )}

      {isAnalyzing && <div className="loading-overlay">Analyzing...</div>}

      {analysisResult && (
        <ResultsModal
          result={analysisResult}
          onClose={() => setAnalysisResult(null)}
        />
      )}
    </div>
  );
};

// --- Modal & UI Components ---

const AnalysisFormModal = ({ onClose, onSubmit }) => {
  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    if (!formData.get('resume').size || !formData.get('jobDescription').trim()) {
      alert("Please fill out both fields.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleFormSubmit}>
          <h2>New Analysis</h2>
          <div className="form-group">
            <label>Job Title</label>
            <input type="text" name="jobTitle" placeholder="e.g., Software Engineer" required />
          </div>
           <div className="form-group">
            <label>Company</label>
            <input type="text" name="company" placeholder="e.g., Google" required />
          </div>
          <div className="form-group">
            <label>Upload Resume (PDF)</label>
            <input type="file" name="resume" accept=".pdf" required className="file-input"/>
          </div>
          <div className="form-group">
            <label>Paste Job Description</label>
            <textarea name="jobDescription" rows="8" required></textarea>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Analyze</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ResultsModal = ({ result, onClose }) => {
  // --- FIX: Add useEffect for Escape key ---
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);


  if (!result || result.error || !result.atsAnalysis) {
    return (
       <div className="modal-overlay">
        <div className="modal-content">
          <h2>Analysis Error</h2>
          <p>The analysis could not be completed. The AI may have returned an unexpected format, or the server may be experiencing issues. Please try again.</p>
           <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-primary">Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large results-modal" onClick={e => e.stopPropagation()}>
        <div className="results-header">
          <ScoreGauge score={result.matchScore} />
          <div className="verdict">
            <h2>Analysis Complete</h2>
            <p>{result.overallVerdict}</p>
          </div>
        </div>

        <div className="results-body">
          <div className="ats-section">
            <h3>ATS Keyword Analysis</h3>
            <div className="keyword-columns">
              <KeywordList title="Keywords Found" keywords={result.atsAnalysis?.keywordsFound ?? []} type="found" />
              <KeywordList title="Keywords Missing" keywords={result.atsAnalysis?.keywordsMissing ?? []} type="missing" />
            </div>
          </div>
          
          <FeedbackSection title="Feedback on Strengths" items={result.feedbackOnStrengths ?? []} type="strength" />
          <FeedbackSection title="Critical Improvement Areas" items={result.criticalImprovementAreas ?? []} type="improvement" />
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    </div>
  );
};

const ScoreGauge = ({ score = 0 }) => {
  const getScoreColor = (s) => {
    if (s > 80) return 'var(--teal-bright)';
    if (s > 60) return '#f59e0b';
    return '#ef4444';
  };

  const strokeColor = getScoreColor(score);
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-gauge">
      <svg viewBox="0 0 120 120">
        <circle className="gauge-base" cx="60" cy="60" r={radius} />
        <circle
          className="gauge-arc"
          cx="60"
          cy="60"
          r={radius}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-text" style={{ color: strokeColor }}>
        {score}<span>%</span>
      </div>
    </div>
  );
};

const KeywordList = ({ title, keywords = [], type }) => (
  <div className="keyword-list">
    <h4>{title}</h4>
    <ul>
      {keywords.map((keyword, index) => (
        <li key={index} className={type}>
          {type === 'found' ? <CheckIcon /> : <XIcon />}
          <span>{keyword}</span>
        </li>
      ))}
    </ul>
  </div>
);

const FeedbackSection = ({ title, items = [], type }) => (
  <div className="feedback-section">
    <h3>{title}</h3>
    <div className="feedback-cards">
      {items.map((item, index) => (
        <div key={index} className={`feedback-card ${type}`}>
          <h4>{type === 'strength' ? item.skill : item.area}</h4>
          <p>{item.feedback}</p>
        </div>
      ))}
    </div>
  </div>
);
