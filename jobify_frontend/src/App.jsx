import React, { useState, useEffect } from 'react';

// --- Mock Data & Placeholders ---
// We will replace these with real API calls and database interactions later.
const mockUser = { name: 'Jane Doe', email: 'jane.doe@example.com' };
const mockSavedApplications = [
  { id: 1, jobTitle: 'Frontend Developer', company: 'Vercel', date: '2025-08-10', score: 85 },
  { id: 2, jobTitle: 'Full-Stack Engineer', company: 'Stripe', date: '2025-08-08', score: 72 },
  { id: 3, jobTitle: 'Backend Engineer', company: 'Render', date: '2025-08-05', score: 65 },
];

// --- SVG Icons ---
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);

const LogoutIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
);


// --- Main App Component ---
export default function App() {
  // This state will control everything. Later, it will be powered by Supabase Auth.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate checking for a logged-in user when the app first loads.
  useEffect(() => {
    setTimeout(() => {
      // In the future, we'll check for a real user session here.
      setIsAuthenticated(true); // Set to `true` to see the dashboard, `false` for the login page.
      setIsLoading(false);
    }, 1500);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {isAuthenticated ? <DashboardPage onLogout={() => setIsAuthenticated(false)} /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />}
    </div>
  );
}


// --- Page Components ---

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-slate-900">
    <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Jobify</h1>
        <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full"></div>
    </div>
  </div>
);


const LoginPage = ({ onLogin }) => (
  <div className="flex items-center justify-center min-h-screen bg-slate-100">
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
        <p className="mt-2 text-slate-600">Sign in to continue to your dashboard.</p>
      </div>
      <form className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700">Email Address</label>
          <input type="email" required className="w-full px-3 py-2 mt-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input type="password" required className="w-full px-3 py-2 mt-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••" />
        </div>
        <button
          type="button" // Change to 'submit' when we have a real form
          onClick={onLogin}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign In
        </button>
      </form>
    </div>
  </div>
);


const DashboardPage = ({ onLogout }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <header className="flex items-center justify-between mb-10">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome, {mockUser.name}</h1>
            <p className="text-slate-600 mt-1">Here's a summary of your tracked applications.</p>
        </div>
        <div className="flex items-center space-x-4">
             <button className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm space-x-2">
                <PlusIcon />
                <span>New Analysis</span>
            </button>
            <button onClick={onLogout} className="p-2 rounded-md hover:bg-slate-200">
                <LogoutIcon />
            </button>
        </div>
    </header>

    <main>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Tracked Applications</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <ul className="divide-y divide-slate-200">
                {mockSavedApplications.map(app => (
                    <li key={app.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                        <div>
                            <p className="font-semibold text-slate-800">{app.jobTitle}</p>
                            <p className="text-sm text-slate-600">{app.company} - Applied on {app.date}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                             <div className="text-right">
                                <p className="text-sm text-slate-500">Match Score</p>
                                <p className={`font-bold text-lg ${app.score > 80 ? 'text-green-500' : app.score > 60 ? 'text-amber-500' : 'text-red-500'}`}>{app.score}%</p>
                             </div>
                             <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">View Details</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </main>
  </div>
);
