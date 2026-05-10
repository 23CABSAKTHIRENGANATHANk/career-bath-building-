import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../assets/logo.png';
import './LandingPage.css';

const features = [
    {
        icon: '🧭',
        title: 'Personalized Career Roadmaps',
        desc: 'AI-powered, step-by-step guidance tailored to your unique background, skills, and goals.',
        color: '#8B5CF6'
    },
    {
        icon: '📊',
        title: 'Skill Gap Analysis',
        desc: 'Instantly identify your strengths and growth areas with deep industry-standard analytics.',
        color: '#6366F1'
    },
    {
        icon: '🤖',
        title: 'AI Mentor Chat',
        desc: 'Ask questions and get real-time advice from your personal AI career mentor 24/7.',
        color: '#A78BFA'
    },
    {
        icon: '🚀',
        title: 'Portfolio & Interview Boost',
        desc: 'Actionable tips to perfect your portfolio, nail interviews, and land your dream job.',
        color: '#C084FC'
    }
];

const stats = [
    { number: '50+', label: 'Career Paths' },
    { number: '95%', label: 'Accuracy Rate' },
    { number: '10K+', label: 'Profiles Analyzed' },
    { number: '4.9★', label: 'User Rating' }
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [videoLoaded, setVideoLoaded] = useState(false);

    useEffect(() => {
        // Smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => { document.documentElement.style.scrollBehavior = ''; };
    }, []);

    return (
        <div className="lp-root">
            {/* ── HERO SECTION ── */}
            <section className="lp-hero">
                {/* Background Video */}
                <video
                    className={`lp-video-bg ${videoLoaded ? 'lp-video-loaded' : ''}`}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster="/landing_video_poster.png"
                    onCanPlay={() => setVideoLoaded(true)}
                >
                    <source src="/landing-video.mp4" type="video/mp4" />
                </video>

                {/* Multi-layer Overlay */}
                <div className="lp-video-overlay" />

                {/* Hero Content */}
                <div className="lp-hero-content fade-in">
                    <div className="lp-hero-badge">
                        <span className="lp-badge-dot" />
                        ✨ AI-Powered Career Intelligence Platform
                    </div>

                    <img src={logoIcon} alt="Career Path Builder" className="lp-logo" />

                    <h1 className="lp-hero-title">
                        Build Your <span className="lp-gradient-text">Dream Career</span>
                        <br />Path with AI
                    </h1>

                    <p className="lp-hero-subtitle">
                        Upload your resume or fill your profile — get personalized career recommendations,
                        skill gap analysis, and a complete learning roadmap in seconds.
                    </p>

                    {/* Stats Row */}
                    <div className="lp-stats-row">
                        {stats.map((s, i) => (
                            <div className="lp-stat" key={i}>
                                <span className="lp-stat-number">{s.number}</span>
                                <span className="lp-stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="lp-cta-group">
                        <button
                            className="lp-btn-primary"
                            onClick={() => navigate('/start')}
                        >
                            🚀 Start My Career Analysis
                        </button>
                        <button
                            className="lp-btn-secondary"
                            onClick={() => document.getElementById('lp-features').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Learn More ↓
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="lp-scroll-indicator">
                    <div className="lp-scroll-line" />
                    <span className="lp-scroll-text">Scroll</span>
                </div>
            </section>

            {/* ── FEATURES SECTION ── */}
            <section className="lp-features-section" id="lp-features">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <span className="lp-section-badge">What We Offer</span>
                        <h2 className="lp-section-title">Everything You Need to <span className="lp-gradient-text">Succeed</span></h2>
                        <p className="lp-section-sub">Our AI analyses your profile and gives you a complete career intelligence report</p>
                    </div>

                    <div className="lp-features-grid">
                        {features.map((f, i) => (
                            <div
                                className="lp-feature-card"
                                key={i}
                                style={{ '--card-accent': f.color, animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="lp-feature-icon">{f.icon}</div>
                                <h3 className="lp-feature-title">{f.title}</h3>
                                <p className="lp-feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="lp-how-section">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <span className="lp-section-badge">Simple Process</span>
                        <h2 className="lp-section-title">Get Started in <span className="lp-gradient-text">3 Steps</span></h2>
                    </div>
                    <div className="lp-steps-row">
                        {[
                            { step: '01', icon: '📄', title: 'Upload Resume', desc: 'Upload your PDF/DOCX or fill in your profile manually' },
                            { step: '02', icon: '⚙️', title: 'AI Analysis', desc: 'Our engine analyses your skills, education, and interests' },
                            { step: '03', icon: '🎯', title: 'Get Your Roadmap', desc: 'Receive personalised career paths and action plans' }
                        ].map((s, i) => (
                            <div className="lp-step" key={i}>
                                <div className="lp-step-num">{s.step}</div>
                                <div className="lp-step-icon">{s.icon}</div>
                                <h3 className="lp-step-title">{s.title}</h3>
                                <p className="lp-step-desc">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ── */}
            <section className="lp-final-cta">
                <div className="lp-cta-glow" />
                <h2 className="lp-cta-title">Ready to <span className="lp-gradient-text">Transform</span> Your Career?</h2>
                <p className="lp-cta-sub">Join thousands of professionals who have already unlocked their potential.</p>
                <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate('/start')}>
                    🚀 Analyze My Career Path — It's Free
                </button>
            </section>

            {/* ── FOOTER ── */}
            <footer className="lp-footer">
                <img src={logoIcon} alt="logo" className="lp-footer-logo" />
                <div className="footer-credits">
                    <span>© {new Date().getFullYear()} Career Path Builder. All rights reserved.</span>
                    <span className="footer-author">Designed & Developed by <span className="author-name">SAKTHI RENGANATHAN K.</span></span>
                </div>
            </footer>
        </div>
    );
}
