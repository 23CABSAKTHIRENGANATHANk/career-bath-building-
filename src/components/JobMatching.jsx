import { useState, useEffect } from 'react';
import axios from 'axios';
import './JobMatching.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function JobMatching({ career, city }) {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [applyingId, setApplyingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [appliedJobs, setAppliedJobs] = useState(() => {
        try {
            const saved = localStorage.getItem('careerAppliedJobs');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        fetchJobs();
    }, [career, city]);

    useEffect(() => {
        localStorage.setItem('careerAppliedJobs', JSON.stringify(appliedJobs));
    }, [appliedJobs]);

    const fetchJobs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/api/jobs`, { career, city });
            if (response.data.success) {
                setJobs(response.data.jobs);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Could not load job matches. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = (jobId) => {
        setApplyingId(jobId);

        // Simulate API call
        setTimeout(() => {
            setAppliedJobs(prev => ({
                ...prev,
                [jobId]: true
            }));
            setApplyingId(null);
            setShowSuccess(true);
        }, 1200);
    };

    if (isLoading) {
        return (
            <div className="jobs-loading">
                <div className="loader"></div>
                <p>Finding the best job matches for you in {city}...</p>
            </div>
        );
    }

    if (error) {
        return <div className="jobs-error">{error}</div>;
    }

    return (
        <div className="job-matching-container fade-in">
            {showSuccess && (
                <div className="success-modal-overlay" onClick={() => setShowSuccess(false)}>
                    <div className="success-modal glass-card" onClick={e => e.stopPropagation()}>
                        <div className="success-icon" style={{ fontSize: '3rem', marginBottom: '15px' }}>🎉</div>
                        <h3>Application Submitted!</h3>
                        <p>Your profile has been sent to the recruiter. We'll notify you if there's a match.</p>
                        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowSuccess(false)}>
                            Great!
                        </button>
                    </div>
                </div>
            )}

            <div className="jobs-header">
                <h3>💼 Live Opportunities for {career}</h3>
                <p>Curated matches based on your profile and location in <strong>{city}</strong></p>
            </div>

            <div className="jobs-grid">
                {jobs.map((job) => (
                    <div key={job.id} className="job-card glass-card">
                        <div className="job-match-badge">{job.match_score}% Match</div>
                        <div className="job-main-info">
                            <h4>{job.title}</h4>
                            <p className="job-company">{job.company}</p>
                        </div>
                        <div className="job-details">
                            <div className="job-detail-item">📍 {job.location}</div>
                            <div className="job-detail-item">🕒 {job.type}</div>
                            <div className="job-detail-item">💰 {job.salary}</div>
                        </div>
                        <div className="job-footer">
                            <span className="posted-date">Posted {job.posted}</span>
                            <button
                                className={`apply-btn ${appliedJobs[job.id] ? 'applied' : ''} ${applyingId === job.id ? 'applying' : ''}`}
                                onClick={() => handleApply(job.id)}
                                disabled={appliedJobs[job.id] || applyingId === job.id}
                            >
                                {applyingId === job.id ? 'Applying...' :
                                    appliedJobs[job.id] ? 'Applied ✓' : 'Apply Now ↗'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="jobs-disclaimer">
                <p>Showing simulated matches for demonstration. In production, this would connect to LinkedIn/Indeed APIs.</p>
            </div>
        </div>
    );
}

export default JobMatching;
