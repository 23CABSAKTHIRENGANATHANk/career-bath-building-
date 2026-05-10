import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ProfileForm from './components/ProfileForm';
import CareerDashboard from './components/CareerDashboard';
import CareerReport from './components/CareerReport';
import ErrorBoundary from './components/ErrorBoundary';
import ChatMentor from './components/ChatMentor';

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
        try {
            localStorage.setItem('careerAnalysisData', JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage', e);
        }
    };

    const handleReset = () => {
        setAnalysisData(null);
        setLoading(false);
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
                        {/* Landing page is the root route */}
                        <Route path="/" element={<LandingPage />} />

                        {/* Profile form at /start */}
                        <Route
                            path="/start"
                            element={
                                <ProfileForm
                                    onAnalysisComplete={handleAnalysisComplete}
                                    setLoading={setLoading}
                                />
                            }
                        />

                        {/* Dashboard */}
                        <Route
                            path="/dashboard"
                            element={
                                analysisData ? (
                                    <CareerDashboard data={analysisData} onReset={handleReset} />
                                ) : (
                                    <Navigate to="/" replace />
                                )
                            }
                        />

                        {/* Report */}
                        <Route
                            path="/report"
                            element={<CareerReport data={analysisData} />}
                        />

                        {/* Catch-all redirect to landing */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>

                    {/* Chat Mentor available on all pages */}
                    <ChatMentor userData={analysisData} />
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
