import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../assets/logo.png';
import './VibrantColors.css';
import './Enhanced3D.css';
import './LandingPage.css';

const features = [
  {
    title: 'Personalized Career Roadmaps',
    desc: 'Get AI-powered, step-by-step guidance tailored to your unique background and goals.'
  },
  {
    title: 'Skill Gap Analysis',
    desc: 'Identify your strengths and areas for growth with advanced analytics.'
  },
  {
    title: 'Mentor Chat',
    desc: 'Ask questions and get instant advice from your AI career mentor.'
  },
  {
    title: 'Portfolio & Interview Boost',
    desc: 'Receive actionable tips to enhance your portfolio and ace interviews.'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing-bg">
      {/* Background Video */}
      <video className="landing-video-bg" autoPlay loop muted playsInline poster="/vite.svg">
        <source src="/landing-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Overlay for readability */}
      <div className="landing-video-overlay"></div>
      <div className="landing-hero glass-card-glow fade-in">
        <img src={logoIcon} alt="Career Path Builder Logo" className="landing-logo" />
        <h1 className="neon-text">Unlock Your Future</h1>
        <p className="landing-tagline">AI-Powered Career Intelligence</p>
        <p className="typing-text landing-subtitle">Personalized roadmaps, skill gap analysis, and real mentor chat—built for ambitious professionals and students.</p>
        <button className="btn btn-primary landing-cta" onClick={() => navigate('/start')}>
          Start Your Journey
        </button>
      </div>
      <div className="landing-features">
        {features.map((f, i) => (
          <div className="feature glass-card slide-in" key={i} style={{ animationDelay: `${i * 0.2 + 0.2}s` }}>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Career Path Builder. All rights reserved.</span>
      </footer>
    </div>
  );
}
