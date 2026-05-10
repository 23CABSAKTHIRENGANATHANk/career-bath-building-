
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Report.css';
import './ReportStable.css';
import './ReportGridFix.css';
import logoIcon from '../assets/logo.png';

function CareerReport({ data: propData }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Get data from multiple sources
    useEffect(() => {
        try {
            let dataToUse = propData || location.state?.data;

            // Fallback to localStorage if no data passed
            if (!dataToUse) {
                const savedData = localStorage.getItem('careerAnalysisData');
                if (savedData) {
                    dataToUse = JSON.parse(savedData);
                    console.log('Loaded data from localStorage');
                }
            }

            if (dataToUse) {
                setReportData(dataToUse);
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading report data:', error);
            setIsLoading(false);
        }
    }, [propData, location.state?.data]);

    const data = reportData;

    // Verify data integrity
    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-text">
                    <h2>Loading Your Career Report...</h2>
                    <div className="loading-spinner">⏳</div>
                </div>
            </div>
        );
    }

    if (!data || !data.career_recommendation || !data.skill_analysis || !data.learning_roadmap) {
        console.warn('CareerReport: Data missing or incomplete', data);
        return (
            <div className="error-container">
                <div className="error-card glass-card">
                    <h2>📄 No Report Data Found</h2>
                    <p style={{ marginBottom: '30px', color: '#cbd5e1' }}>
                        The report data is missing. Please go back and generate a new report.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="action-btn back-btn"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    >
                        🏠 Create New Report
                    </button>
                </div>
            </div>
        );
    }

    const { user_profile, career_recommendation, skill_analysis, learning_roadmap } = data;

    // Safe data extraction with fallbacks
    const getCareerData = () => {
        return {
            career: career_recommendation?.career || 'Career Path',
            description: career_recommendation?.description || 'Description not available',
            confidence_score: career_recommendation?.confidence_score || 0,
            salary_range: career_recommendation?.salary_range || 'Not specified',
            growth_potential: career_recommendation?.growth_potential || 'Medium',
            reasoning: career_recommendation?.reasoning || 'Reasoning not available',
            companies: Array.isArray(career_recommendation?.companies) ? career_recommendation.companies : []
        };
    };

    const getSkillData = () => {
        try {
            const strong = skill_analysis?.gap_analysis?.strong_matches || [];
            const missing = skill_analysis?.gap_analysis?.missing_critical_skills || [];
            return {
                strong_matches: Array.isArray(strong) ? strong : [],
                missing_critical_skills: Array.isArray(missing) ? missing : []
            };
        } catch (e) {
            console.error('Error parsing skill data:', e);
            return {
                strong_matches: [],
                missing_critical_skills: []
            };
        }
    };

    const getRoadmapData = () => {
        try {
            const phases = learning_roadmap?.phases || [];
            return {
                phases: Array.isArray(phases) ? phases : []
            };
        } catch (e) {
            console.error('Error parsing roadmap data:', e);
            return {
                phases: []
            };
        }
    };

    // Calculate skill match percentage
    const calculateSkillMatch = (strong) => {
        return strong.length > 0 ? Math.min(90 + (strong.length * 2), 99) : 60;
    };

    // Generate detailed recommendations
    const getRecommendations = (career, skills) => [
        `Master ${skills.missing_critical_skills.slice(0, 2).join(' and ')} - Dedicate 4-6 weeks per skill using structured courses + hands-on projects`,
        `Build portfolio: Create 2-3 production-ready projects using your ${skills.strong_matches.slice(0, 2).join(', ')} strengths to showcase real-world application`,
        `Network strategically: Join 3-5 ${career} communities, attend 2+ industry meetups monthly, connect with 10+ professionals on LinkedIn`,
        `Contribute meaningfully: Start with small open-source contributions, aim for 20+ commits within 3 months to gain real experience`,
        `Earn certifications: Pursue industry-recognized cert in ${skills.missing_critical_skills[0] || 'cloud technologies'} within 6 months to validate expertise`
    ];

    // Generate skill enhancement strategies
    const getSkillEnhancementStrategy = (career, skills) => ({
        title: `Personalized Skill Enhancement Strategy for ${career}`,
        phases: [
            {
                phase: 1,
                title: 'Foundation Phase (Months 1-2)',
                focus: 'Master Core Fundamentals',
                actions: [
                    `Complete structured course in ${skills.missing_critical_skills[0] || 'primary technology'} (20-30 hours)`,
                    `Daily practice: Solve 10-15 coding challenges or hands-on exercises (1-2 hours/day)`,
                    `Build mini-project using 1 missing skill to understand practical application`,
                    `Read industry documentation and best practices (5-10 hours)`
                ],
                expectedOutcome: 'Solid foundation in critical skills, basic project completion capability'
            },
            {
                phase: 2,
                title: 'Intermediate Phase (Months 3-4)',
                focus: 'Apply & Strengthen Skills',
                actions: [
                    `Build 2 mid-size portfolio projects combining ${skills.missing_critical_skills.slice(0, 2).join(' and ')}`,
                    `Start contributing to open-source projects (4-8 hours/week)`,
                    `Join community: Attend 2 meetups, participate in 3 online discussions weekly`,
                    `Mentor junior developers in your strong areas (${skills.strong_matches.slice(0, 2).join(', ')})`
                ],
                expectedOutcome: 'Intermediate proficiency, portfolio growth, community presence'
            },
            {
                phase: 3,
                title: 'Advanced Phase (Months 5-6)',
                focus: 'Expert Proficiency & Specialization',
                actions: [
                    `Complete professional certification in ${skills.missing_critical_skills[0] || 'specialized domain'}`,
                    `Build 1 complex, production-ready project showcasing all skills`,
                    `Write 3-5 technical blog posts sharing your expertise and learnings`,
                    `Lead workshops or mentoring sessions in your strong skills`
                ],
                expectedOutcome: 'Near-expert level, recognized expertise, interview-ready portfolio'
            }
        ]
    });

    const careerData = getCareerData();
    const skillData = getSkillData();
    const roadmapData = getRoadmapData();
    const skillMatch = calculateSkillMatch(skillData.strong_matches);
    const recommendations = getRecommendations(careerData.career, skillData);

    // Generate dynamic resource links
    const getResourceLinks = (career) => {
        const query = encodeURIComponent(career);
        return {
            udemy: `https://www.udemy.com/courses/search/?q=${query}`,
            linkedin: `https://www.linkedin.com/jobs/search/?keywords=${query}`,
            youtube: `https://www.youtube.com/results?search_query=${query}+tutorial`,
            coursera: `https://www.coursera.org/search?query=${query}`,
            google: `https://www.google.com/search?q=best+certifications+for+${query}`
        };
    };

    const resourceLinks = getResourceLinks(careerData.career);

    const handleDownload = () => {
        try {
            const element = document.querySelector('.report-container');
            if (!element) {
                console.error('Report container not found');
                alert('Error: Could not find report to download.');
                return;
            }

            const opt = {
                margin: 10,
                filename: `Career_Report_${careerData.career.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, allowTaint: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            if (window.html2pdf) {
                window.html2pdf().set(opt).from(element).save();
            } else {
                console.error('html2pdf library not loaded');
                alert('PDF download library is loading. Please wait a moment and try again.');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const scrollToRoadmap = () => {
        const roadmapSection = document.getElementById('roadmap-section');
        if (roadmapSection) {
            roadmapSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="report-viewer">
            {/* Top Navigation Bar */}
            <div className="report-header-nav">
                <div className="nav-btn-group">
                    <button
                        onClick={() => navigate('/')}
                        className="nav-back-btn"
                        title="Return to home page"
                    >
                        🏠 Home
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="nav-back-btn dashboard-btn"
                        title="Return to interactive dashboard"
                    >
                        📊 Dashboard
                    </button>
                </div>
                <div className="nav-title">Career Report</div>
                <div className="nav-spacer"></div>
            </div>

            <div className="report-container">
                {/* Hero Header */}
                <div className="report-header-enhanced">
                    <div className="header-gradient"></div>
                    <div className="header-content">
                        <img src={logoIcon} alt="Career Path Builder Logo" className="report-logo" />
                        <h1>🚀 Your Career Path Builder Report</h1>
                        <p className="header-subtitle">Personalized Career Analysis & Growth Roadmap</p>
                        <div className="header-meta">
                            <span>📅 Generated: {new Date().toLocaleDateString()}</span>
                            <span>✨ Match Score: {skillMatch}%</span>
                        </div>
                    </div>
                </div>

                {/* User Profile Summary */}
                {user_profile && (
                    <div className="report-section glass-card profile-summary-card">
                        <h2 className="profile-section-title">👤 Professional Profile</h2>
                        <div className="profile-details-grid">
                            {user_profile.education && user_profile.education.degrees && user_profile.education.degrees.length > 0 && (
                                <div className="profile-detail-item">
                                    <div className="profile-detail-label">🎓 Education</div>
                                    <div className="profile-detail-value">
                                        {user_profile.education.degrees.map((d, i) => {
                                            const showField = d.field && d.field !== 'General' && !d.degree.toLowerCase().includes(d.field.toLowerCase()) && !d.field.toLowerCase().includes(d.degree.toLowerCase());
                                            return (
                                                <div key={i} style={{ marginBottom: '4px' }}>
                                                    {d.degree} {showField ? `in ${d.field}` : ''}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {user_profile.city && (
                                <div className="profile-detail-item">
                                    <div className="profile-detail-label">📍 Location</div>
                                    <div className="profile-detail-value">{user_profile.city}</div>
                                </div>
                            )}
                            {user_profile.experience && user_profile.experience.years !== undefined && user_profile.experience.years > 0 && (
                                <div className="profile-detail-item">
                                    <div className="profile-detail-label">💼 Experience</div>
                                    <div className="profile-detail-value">{user_profile.experience.years}+ Years</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Confidence Score Card */}
                <div className="report-section premium-card">
                    <div className="score-display">
                        <div className="score-circle">
                            <div className="score-value">{careerData.confidence_score}%</div>
                            <div className="score-label">Career Match</div>
                        </div>
                        <div className="score-details">
                            <h2>{careerData.career}</h2>
                            <p className="score-description">{careerData.description}</p>
                            <div className="metrics-grid">
                                <div className="metric">
                                    <span className="metric-label">💰 Salary Range</span>
                                    <span className="metric-value">{careerData.salary_range}</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">📈 Growth Potential</span>
                                    <span className="metric-value">{careerData.growth_potential}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Why This Career */}
                <div className="report-section insight-card">
                    <h2>💡 Why This Career Path?</h2>
                    <p className="reasoning-text">{careerData.reasoning}</p>
                </div>

                {/* Skills Analysis */}
                <div className="report-section">
                    <h2>📊 Skills Assessment</h2>

                    <div className="skills-container">
                        <div className="skills-column">
                            <h3 className="skills-title">✅ Your Strengths ({skillData.strong_matches.length})</h3>
                            <p className="skills-subtitle">These skills give you a competitive advantage</p>
                            <div className="skill-badges-grid">
                                {skillData.strong_matches && skillData.strong_matches.length > 0 ? (
                                    skillData.strong_matches.map((skill, index) => (
                                        <div key={index} className="skill-badge-enhanced strong">
                                            <span className="badge-icon">⭐</span>
                                            <span>{skill}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: '#64748b' }}>No strength data available</p>
                                )}
                            </div>
                        </div>

                        <div className="skills-column">
                            <h3 className="skills-title">📚 Skills to Master ({skillData.missing_critical_skills.length})</h3>
                            <p className="skills-subtitle">Focus on these to accelerate your career</p>
                            <div className="skill-badges-grid">
                                {skillData.missing_critical_skills && skillData.missing_critical_skills.length > 0 ? (
                                    skillData.missing_critical_skills.map((skill, index) => (
                                        <div key={index} className="skill-badge-enhanced weak">
                                            <span className="badge-icon">🎯</span>
                                            <span>{skill}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: '#64748b' }}>No gaps identified</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Companies */}
                <div className="report-section">
                    <h2>🏢 Top Companies Hiring for This Role</h2>
                    <p className="companies-intro">These industry leaders are actively hiring professionals in this field</p>

                    <div className="companies-grid">
                        {careerData.companies && careerData.companies.length > 0 ? (
                            careerData.companies.map((company, index) => (
                                <div key={index} className="company-card">
                                    <div className="company-icon">🚀</div>
                                    <div className="company-name">{company}</div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#64748b' }}>Company information not available</p>
                        )}
                    </div>
                </div>

                {/* Personalized Recommendations */}
                <div className="report-section recommendations-section" >
                    <h2>🎯 Personalized Action Items</h2>
                    <p className="recommendations-intro">Here's what you should do next to accelerate your career growth</p>

                    <div className="recommendations-list">
                        {recommendations.map((rec, index) => (
                            <div key={index} className="recommendation-item">
                                <div className="rec-number">{index + 1}</div>
                                <div className="rec-content">
                                    <h4>Action {index + 1}</h4>
                                    <p>{rec}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skill Enhancement Strategy */}
                <div className="report-section strategy-section" >
                    <h2>📈 Skill Enhancement Strategy (6-Month Roadmap)</h2>
                    <p className="strategy-intro">A detailed plan to maximize your growth and reach expert proficiency</p>

                    <div className="strategy-phases">
                        {getSkillEnhancementStrategy(careerData.career, skillData).phases.map((phase, index) => (
                            <div key={index} className="strategy-phase">
                                <div className="phase-badge">Phase {phase.phase}</div>
                                <div className="strategy-content">
                                    <h3>{phase.title}</h3>
                                    <div className="focus-tag">🎯 {phase.focus}</div>

                                    <div className="actions-box">
                                        <h4>Key Actions:</h4>
                                        <ul className="strategy-actions">
                                            {phase.actions.map((action, i) => (
                                                <li key={i}>
                                                    <span className="action-bullet">✓</span>
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="outcome-box">
                                        <h4>Expected Outcome:</h4>
                                        <p>{phase.expectedOutcome}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tips for Success */}
                    <div className="success-tips">
                        <h3>💡 Pro Tips for Maximum Growth</h3>
                        <div className="tips-grid">
                            <div className="tip-card">
                                <div className="tip-icon">⏰</div>
                                <h4>Consistency Over Intensity</h4>
                                <p>Study 1-2 hours daily instead of cramming on weekends. Building habits is key to long-term success.</p>
                            </div>
                            <div className="tip-card">
                                <div className="tip-icon">🔄</div>
                                <h4>Learn by Doing</h4>
                                <p>70% of your time should be hands-on projects, 30% theory. Build real projects to solidify learning.</p>
                            </div>
                            <div className="tip-card">
                                <div className="tip-icon">👥</div>
                                <h4>Network Actively</h4>
                                <p>Build genuine relationships in your industry. 70% of jobs are filled through networking, not applications.</p>
                            </div>
                            <div className="tip-card">
                                <div className="tip-icon">📊</div>
                                <h4>Track Your Progress</h4>
                                <p>Maintain a learning journal. Document what you learn, challenges faced, and solutions found weekly.</p>
                            </div>
                            <div className="tip-card">
                                <div className="tip-icon">🎓</div>
                                <h4>Share Your Knowledge</h4>
                                <p>Write blogs, give talks, or mentor others. Teaching reinforces learning and builds your professional brand.</p>
                            </div>
                            <div className="tip-card">
                                <div className="tip-icon">🚀</div>
                                <h4>Stay Updated</h4>
                                <p>Follow industry trends, read news, join podcasts. Spend 30 mins/week staying current in your field.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resources Section */}
                <div className="report-section resources-section" >
                    <h2>📚 Recommended Resources for {careerData.career}</h2>
                    <div className="resources-grid">
                        <a href={resourceLinks.udemy} target="_blank" rel="noopener noreferrer" className="resource-card link-card">
                            <div className="resource-icon" style={{ color: '#A435F0' }}>🎓</div>
                            <h4>Udemy Courses</h4>
                            <p>Deep dive courses for {careerData.career}</p>
                            <span className="link-arrow">↗</span>
                        </a>
                        <a href={resourceLinks.coursera} target="_blank" rel="noopener noreferrer" className="resource-card link-card">
                            <div className="resource-icon" style={{ color: '#0056D2' }}>📘</div>
                            <h4>Coursera Specializations</h4>
                            <p>University-grade {careerData.career} programs</p>
                            <span className="link-arrow">↗</span>
                        </a>
                        <a href={resourceLinks.linkedin} target="_blank" rel="noopener noreferrer" className="resource-card link-card">
                            <div className="resource-icon" style={{ color: '#0077b5' }}>💼</div>
                            <h4>LinkedIn Jobs</h4>
                            <p>Find open {careerData.career} positions</p>
                            <span className="link-arrow">↗</span>
                        </a>
                        <a href={resourceLinks.youtube} target="_blank" rel="noopener noreferrer" className="resource-card link-card">
                            <div className="resource-icon" style={{ color: '#FF0000' }}>📺</div>
                            <h4>YouTube Tutorials</h4>
                            <p>Free video guides & tutorials</p>
                            <span className="link-arrow">↗</span>
                        </a>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="report-section cta-section" >
                    <h2>Ready to Get Started?</h2>
                    <p>Start your learning journey today and track your progress toward your dream career.</p>
                    <div className="cta-actions">
                        <button onClick={scrollToRoadmap} className="cta-button primary" title="Jump to learning roadmap">
                            <span style={{ fontSize: '2.5rem', marginBottom: '10px', display: 'block' }}>🚀</span>
                            Start Learning
                        </button>
                        <button onClick={handleDownload} className="cta-button secondary" title="Download report as PDF">
                            <span style={{ fontSize: '2.5rem', marginBottom: '10px', display: 'block' }}>⬇️</span>
                            Download PDF
                        </button>
                        <button onClick={handlePrint} className="cta-button secondary" title="Print this report">
                            <span style={{ fontSize: '2.5rem', marginBottom: '10px', display: 'block' }}>🖨️</span>
                            Print Report
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="cta-button secondary" title="Return to dashboard">
                            <span style={{ fontSize: '2.5rem', marginBottom: '10px', display: 'block' }}>⬅️</span>
                            Dashboard
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure? This will start a new analysis.')) {
                                    navigate('/');
                                }
                            }}
                            className="cta-button secondary"
                            title="Start new analysis"
                        >
                            <span style={{ fontSize: '2.5rem', marginBottom: '10px', display: 'block' }}>↻</span>
                            New Analysis
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="report-footer no-print">
                    <p>🤖 Generated by Career Path Builder System</p>
                    <p className="footer-author-sig">Designed & Developed by <span className="sig-name">SAKTHI RENGANATHAN K.</span></p>
                    <p className="footer-disclaimer">This report is based on your profile analysis. Career paths are flexible and can change based on market trends and personal preferences.</p>
                </div>
            </div>

            {/* Floating Actions removed - moved to CTA section */}

        </div>
    );
}

export default CareerReport;
