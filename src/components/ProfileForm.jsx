import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfileForm.css';
import './VibrantColors.css';
import './Enhanced3D.css';
import logoIcon from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function ProfileForm({ onAnalysisComplete, setLoading }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [skills, setSkills] = useState([]);
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeData, setResumeData] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});

    // Initial state with string values for array fields to allow typing
    const [formData, setFormData] = useState({
        // Location
        city: 'Bangalore',

        // Education
        degrees: '',
        gpa: '',

        // Skills
        technical_skills: '',
        soft_skills: '',

        // Interests
        interests: '',

        // Experience
        experience: {
            years: 0,
            positions: []
        },

        // Certifications
        certifications: '',

        // Social Links
        linkedin: '',
        github: '',
        portfolio: '',

        // Experience level
        experience_level: 'beginner',

        // Skill Ratings (1-10)
        skill_ratings: {}
    });

    const handleSkillRatingChange = (skill, rating) => {
        setFormData(prev => ({
            ...prev,
            skill_ratings: {
                ...prev.skill_ratings,
                [skill]: parseInt(rating)
            }
        }));
    };

    // Validation helper
    const validateStep = (currentStep) => {
        const errors = {};

        if (currentStep === 3) {
            // Skills validation
            const hasTechnical = formData.technical_skills.trim().length > 0;
            const hasSoft = formData.soft_skills.trim().length > 0;

            if (!hasTechnical && !hasSoft) {
                errors.skills = 'Please add at least one technical or soft skill';
            }
        }

        if (currentStep === 4) {
            // Interests validation
            if (formData.interests.trim().length === 0) {
                errors.interests = 'Please describe your career interests';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Fetch available skills from backend
    useEffect(() => {
        axios.get(`${API_URL}/skills`)
            .then(response => {
                if (response.data.success) {
                    setSkills(response.data.skills);
                }
            })
            .catch(error => console.error('Error fetching skills:', error));
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setResumeFile(file);
        setUploadProgress(10);

        const formDataUpload = new FormData();
        formDataUpload.append('resume', file);

        try {
            const response = await axios.post(`${API_URL}/upload-resume`, formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            if (response.data.success) {
                setResumeData(response.data.data);
                setUploadProgress(100);

                // Auto-fill form with resume data
                const data = response.data.data;
                setFormData(prev => ({
                    ...prev,
                    technical_skills: [...new Set([...(prev.technical_skills ? prev.technical_skills.split(',').map(s => s.trim()).filter(s => s) : []), ...data.skills.technical])].join(', '),
                    soft_skills: [...new Set([...(prev.soft_skills ? prev.soft_skills.split(',').map(s => s.trim()).filter(s => s) : []), ...data.skills.soft])].join(', '),
                    certifications: (data.certifications || []).join(', '),
                    degrees: data.education?.degrees ? [...new Set(data.education.degrees.map(d => {
                        return (d.field && d.field !== 'General') ? `${d.degree} in ${d.field}` : d.degree;
                    }))].join(', ') : '',
                    experience: data.experience || prev.experience,
                    city: data.contact?.location && ['Bangalore', 'Mumbai', 'Delhi/NCR', 'Pune', 'Hyderabad', 'Chennai'].includes(data.contact.location) ? data.contact.location : prev.city,
                    linkedin: data.contact?.social?.linkedin || prev.linkedin,
                    github: data.contact?.social?.github || prev.github,
                    portfolio: data.contact?.social?.portfolio || prev.portfolio
                }));
            }
        } catch (error) {
            console.error('Error uploading resume:', error);
            let errorMessage = 'Failed to upload resume. Please try again.';
            if (error.response) {
                // Try to parse error message from backend
                if (error.response.data) {
                    if (typeof error.response.data === 'string') {
                        try {
                            const parsed = JSON.parse(error.response.data);
                            errorMessage = parsed.error || parsed.message || errorMessage;
                        } catch (e) {
                            errorMessage = error.response.data;
                        }
                    } else {
                        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
                    }
                } else {
                    errorMessage = error.response.statusText || errorMessage;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            alert(`Upload Failed: ${errorMessage}`);
            setUploadProgress(0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Convert comma-separated strings back to arrays for API
            const degreeStrings = formData.degrees.split(',').map(item => item.trim()).filter(item => item);
            const degreesArray = degreeStrings.map(degreeStr => ({
                degree: 'Bachelor',  // Default degree type
                field: degreeStr
            }));

            const payload = {
                degrees: degreesArray,
                gpa: formData.gpa,
                technical_skills: formData.technical_skills.split(',').map(item => item.trim()).filter(item => item),
                soft_skills: formData.soft_skills.split(',').map(item => item.trim()).filter(item => item),
                interests: formData.interests.split(',').map(item => item.trim()).filter(item => item),
                certifications: formData.certifications.split(',').map(item => item.trim()).filter(item => item),
                linkedin: formData.linkedin,
                github: formData.github,
                portfolio: formData.portfolio,
                experience_level: formData.experience_level,
                experience: formData.experience,
                resume_data: resumeData,
                skill_ratings: formData.skill_ratings,
                city: formData.city
            };

            const response = await axios.post(`${API_URL}/analyze-profile`, payload);

            if (response.data.success) {
                onAnalysisComplete(response.data.data);
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error analyzing profile:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to analyze profile. Please try again.';
            alert(`Analysis Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 4));
        }
    };
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="profile-form-container">
            {/* Particle Effects Background */}
            <div className="particles-container">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>

            <div className="container">
                {/* Back to Home */}
                <div style={{ marginBottom: '1rem' }}>
                    <a href="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        color: '#A78BFA', textDecoration: 'none', fontSize: '0.9rem',
                        fontWeight: 600, opacity: 0.85, transition: 'opacity 0.2s'
                    }}
                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                        onMouseOut={e => e.currentTarget.style.opacity = 0.85}
                    >
                        ← Back to Home
                    </a>
                </div>

                <div className="form-header fade-in holographic-card">
                    <img src={logoIcon} alt="Career Path Builder Logo" className="app-logo-header" />
                    <h1 className="neon-text">Career Path Builder</h1>
                    <p className="typing-text">Your Personalized Career Mentor</p>
                </div>

                <div className="progress-indicator">
                    <div className="progress-steps">
                        {[1, 2, 3, 4].map(num => (
                            <div key={num} className={`progress-step ${step >= num ? 'active' : ''}`}>
                                <div className="step-number">{num}</div>
                                <div className="step-label">
                                    {num === 1 && 'Resume'}
                                    {num === 2 && 'Education'}
                                    {num === 3 && 'Skills'}
                                    {num === 4 && 'Interests'}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }}></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="glass-card scale-in">
                    {/* Step 1: Resume Upload */}
                    {step === 1 && (
                        <div className="form-step">
                            {/* City Selector Section */}
                            <div className="city-selector-section">
                                <h3>📍 Your Location</h3>
                                <p>Select your city for accurate salary estimates</p>
                                <select
                                    name="city"
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className="city-selector"
                                >
                                    <option value="Bangalore">🌆 Bangalore (Tech Hub - Highest Salaries)</option>
                                    <option value="Mumbai">🏙️ Mumbai (Finance + Tech)</option>
                                    <option value="Delhi/NCR">🏛️ Delhi/NCR (Startups + Government)</option>
                                    <option value="Pune">🎓 Pune (IT Services)</option>
                                    <option value="Hyderabad">💼 Hyderabad (Tech Giants)</option>
                                    <option value="Chennai">🏭 Chennai (Automotive + IT)</option>
                                </select>
                                <div className="salary-preview">
                                    <p><strong>💡 Tip:</strong> Salaries vary by location. Bangalore typically offers 10-20% higher salaries than other cities.</p>
                                </div>
                            </div>

                            {/* Social Links Section */}
                            <div className="social-links-section card-glass-dark mb-4">
                                <h3 className="neon-text-small">🌐 Professionals Connections</h3>
                                <p className="step-description">Extracted from resume. Verify your digital presence.</p>
                                <div className="social-inputs-grid">
                                    <div className="form-group-minimal">
                                        <label>LinkedIn</label>
                                        <input
                                            type="text"
                                            placeholder="linkedin.com/in/username"
                                            value={formData.linkedin}
                                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                                            className="input-minimal"
                                        />
                                    </div>
                                    <div className="form-group-minimal">
                                        <label>GitHub</label>
                                        <input
                                            type="text"
                                            placeholder="github.com/username"
                                            value={formData.github}
                                            onChange={(e) => handleInputChange('github', e.target.value)}
                                            className="input-minimal"
                                        />
                                    </div>
                                    <div className="form-group-minimal">
                                        <label>Portfolio</label>
                                        <input
                                            type="text"
                                            placeholder="https://yourportfolio.com"
                                            value={formData.portfolio}
                                            onChange={(e) => handleInputChange('portfolio', e.target.value)}
                                            className="input-minimal"
                                        />
                                    </div>
                                </div>
                            </div>

                            <h2>Upload Your Resume (Optional)</h2>
                            <p className="step-description">
                                Upload your resume to auto-fill your profile and get more accurate recommendations
                            </p>

                            <div className="resume-upload-area">
                                <input
                                    type="file"
                                    id="resume-upload"
                                    accept=".pdf,.docx,.doc"
                                    onChange={handleResumeUpload}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="resume-upload" className="upload-label">
                                    <div className="upload-icon">📄</div>
                                    <div className="upload-text">
                                        {resumeFile ? resumeFile.name : 'Click to upload or drag and drop'}
                                    </div>
                                    <div className="upload-hint">PDF or DOCX (Max 16MB)</div>
                                </label>

                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="upload-progress">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                        <p>Analyzing resume... {uploadProgress}%</p>
                                    </div>
                                )}

                                {uploadProgress === 100 && (
                                    <div className="upload-success">
                                        <span className="success-icon">✓</span>
                                        Resume analyzed successfully!
                                    </div>
                                )}
                            </div>

                            <button type="button" onClick={nextStep} className="btn btn-primary">
                                Continue →
                            </button>
                        </div>
                    )}

                    {/* Step 2: Education */}
                    {step === 2 && (
                        <div className="form-step">
                            <h2>Education Background</h2>

                            <div className="form-group">
                                <label className="form-label">
                                    Degree(s)
                                    <span style={{
                                        marginLeft: '0.5rem',
                                        fontSize: '0.875rem',
                                        color: '#7c88b1',
                                        cursor: 'help'
                                    }} title="Enter your degree and field of study. For example: Bachelor of Science in Computer Science">
                                        ℹ️
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Bachelor of Science in Computer Science"
                                    value={formData.degrees}
                                    onChange={(e) => handleInputChange('degrees', e.target.value)}
                                />
                                <small className="form-hint">Separate multiple degrees with commas</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">GPA / Percentage (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., 3.8 or 85%"
                                    value={formData.gpa}
                                    onChange={(e) => handleInputChange('gpa', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Experience Level</label>
                                <select
                                    className="form-select"
                                    value={formData.experience_level}
                                    onChange={(e) => handleInputChange('experience_level', e.target.value)}
                                >
                                    <option value="beginner">Beginner (0-1 years)</option>
                                    <option value="intermediate">Intermediate (1-3 years)</option>
                                    <option value="advanced">Advanced (3+ years)</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={prevStep} className="btn btn-secondary">
                                    ← Back
                                </button>
                                <button type="button" onClick={nextStep} className="btn btn-primary">
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Skills */}
                    {step === 3 && (
                        <div className="form-step">
                            <h2>Your Skills</h2>

                            <div className="form-group">
                                <label className="form-label">Technical Skills</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Python, JavaScript, React, SQL, Machine Learning"
                                    value={formData.technical_skills}
                                    onChange={(e) => handleInputChange('technical_skills', e.target.value)}
                                />
                                <small className="form-hint">Separate skills with commas</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Soft Skills</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Communication, Problem Solving, Teamwork, Leadership"
                                    value={formData.soft_skills}
                                    onChange={(e) => handleInputChange('soft_skills', e.target.value)}
                                />
                            </div>

                            {validationErrors.skills && (
                                <div style={{
                                    color: '#f5576c',
                                    fontSize: '0.875rem',
                                    marginTop: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(245, 87, 108, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(245, 87, 108, 0.3)'
                                }}>
                                    ⚠️ {validationErrors.skills}
                                </div>
                            )}

                            {/* Skill Proficiency Ratings */}
                            {(formData.technical_skills.trim() || formData.soft_skills.trim()) && (
                                <div className="skill-ratings-container fade-in" style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#fff' }}>⭐ Rate Your Proficiency</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '15px' }}>Adjust the sliders to indicate your expertise level (1 = Beginner, 10 = Expert)</p>

                                    <div className="skills-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                        {[
                                            ...formData.technical_skills.split(',').map(s => ({ name: s.trim(), type: 'tech' })),
                                            ...formData.soft_skills.split(',').map(s => ({ name: s.trim(), type: 'soft' }))
                                        ].filter(item => item.name).map((item, idx) => (
                                            <div key={idx} className="skill-rating-item" style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <span style={{ fontWeight: '500', color: item.type === 'tech' ? '#60A5FA' : '#F472B6' }}>{item.name}</span>
                                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{formData.skill_ratings[item.name] || 5}/10</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={formData.skill_ratings[item.name] || 5}
                                                    onChange={(e) => handleSkillRatingChange(item.name, e.target.value)}
                                                    style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Certifications (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., AWS Certified Developer, Google Analytics"
                                    value={formData.certifications}
                                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={prevStep} className="btn btn-secondary">
                                    ← Back
                                </button>
                                <button type="button" onClick={nextStep} className="btn btn-primary">
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Interests */}
                    {step === 4 && (
                        <div className="form-step">
                            <h2>Your Interests & Goals</h2>

                            <div className="form-group">
                                <label className="form-label">Career Interests</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="What excites you? What kind of work do you enjoy? (e.g., web development, data analysis, design, automation)"
                                    value={formData.interests}
                                    onChange={(e) => handleInputChange('interests', e.target.value)}
                                />
                            </div>

                            {validationErrors.interests && (
                                <div style={{
                                    color: '#f5576c',
                                    fontSize: '0.875rem',
                                    marginTop: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(245, 87, 108, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(245, 87, 108, 0.3)'
                                }}>
                                    ⚠️ {validationErrors.interests}
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="button" onClick={prevStep} className="btn btn-secondary">
                                    ← Back
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Analyze My Career Path 🚀
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div >
        </div >
    );
}

export default ProfileForm;
