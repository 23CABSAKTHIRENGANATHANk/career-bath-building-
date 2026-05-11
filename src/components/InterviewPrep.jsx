import { useState, useEffect } from 'react';
import axios from 'axios';
import './InterviewPrep.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function InterviewPrep({ career }) {
    const [prepData, setPrepData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [reviewedQuestions, setReviewedQuestions] = useState(() => {
        try {
            const saved = localStorage.getItem('interviewReviewedQuestions');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem('interviewReviewedQuestions', JSON.stringify(reviewedQuestions));
    }, [reviewedQuestions]);

    const toggleReviewed = (e, index) => {
        e.stopPropagation();
        setReviewedQuestions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    useEffect(() => {
        fetchPrepData();
    }, [career]);

    const fetchPrepData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/interview-prep`, { career });
            if (response.data.success) {
                setPrepData(response.data);
            }
        } catch (error) {
            console.error('Error fetching interview prep:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="prep-loading">
                <div className="loader"></div>
                <p>Generating custom interview prep for {career}...</p>
            </div>
        );
    }

    if (!prepData) return null;

    return (
        <div className="interview-prep-container fade-in">
            <div className="prep-header">
                <h3>📝 Interview Preparation Guide</h3>
                <p>Top questions and strategies for <strong>{career}</strong> roles.</p>
            </div>

            <div className="prep-layout">
                <div className="questions-section">
                    <h4>Common Interview Questions</h4>
                    <div className="questions-list">
                        {prepData.questions.map((q, index) => (
                            <div
                                key={index}
                                className={`question-item glass-card ${selectedQuestion === index ? 'selected' : ''} ${reviewedQuestions[index] ? 'reviewed' : ''}`}
                                onClick={() => setSelectedQuestion(index)}
                            >
                                <div className="q-header">
                                    <div className="q-type-badge">{q.type}</div>
                                    <button
                                        className={`review-badge ${reviewedQuestions[index] ? 'active' : ''}`}
                                        onClick={(e) => toggleReviewed(e, index)}
                                        title={reviewedQuestions[index] ? "Mark as unprepared" : "Mark as prepared"}
                                    >
                                        {reviewedQuestions[index] ? 'Prepared ✓' : 'Mark Prepared'}
                                    </button>
                                </div>
                                <p className="q-text">{q.q}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="tips-section">
                    <div className="glass-card-glow prep-tips-card">
                        <h4>💡 Pro Preparation Tips</h4>
                        <ul>
                            {prepData.tips.map((tip, index) => (
                                <li key={index}>{tip}</li>
                            ))}
                        </ul>
                    </div>

                    {selectedQuestion !== null && (
                        <div className="glass-card-glow answer-strategy-card animate-slide-in">
                            <h4>🎯 Answer Strategy</h4>
                            <p className="strategy-text">
                                For this <strong>{prepData.questions[selectedQuestion].type}</strong> question,
                                focus on specific examples from your past projects.
                                Mention the tools you used and the measurable impact you had.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InterviewPrep;
