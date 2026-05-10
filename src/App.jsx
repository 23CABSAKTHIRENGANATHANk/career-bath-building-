import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ProfileForm from './components/ProfileForm';
import CareerDashboard from './components/CareerDashboard';
import CareerReport from './components/CareerReport';
import ErrorBoundary from './components/ErrorBoundary';
import ChatMentor from './components/ChatMentor';
import LandingPage from './components/LandingPage';

function App() {
    // Initialize state from localStorage if available
    const [analysisData, setAnalysisData] = useState(() => {
        try {
            const savedData = localStorage.getItem('careerAnalysisData');
            return savedData ? JSON.parse(savedData) : null;
        } catch (e) {
            console.error('Error loading data from localStorage', e);
            return null;
        }
    });
    const [loading, setLoading] = useState(false);

    const handleAnalysisComplete = (data) => {
        setAnalysisData(data);
        // Persist to localStorage
        try {
            localStorage.setItem('careerAnalysisData', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage', e);
        }
    };

    const handleReset = () => {
        setAnalysisData(null);
        setLoading(false);
        // Clear from localStorage
        try {
            localStorage.removeItem('careerAnalysisData');
        } catch (e) {
            console.error('Error clearing localStorage', e);
        }
    };

    return (
        <ErrorBoundary>
            <Router>
                <div className="app">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route
                            path="/start"
                            element={
                                <ProfileForm
                                    onAnalysisComplete={handleAnalysisComplete}
                                    setLoading={setLoading}
                                />
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                analysisData ? (
                                    <CareerDashboard data={analysisData} onReset={handleReset} />
                                ) : (
                                    <Navigate to="/start" replace />
                                )
                            }
                        />
                        <Route
                            path="/report"
                            element={<CareerReport data={analysisData} />}
                        />
                    </Routes>
                    <ChatMentor userData={analysisData} />
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
