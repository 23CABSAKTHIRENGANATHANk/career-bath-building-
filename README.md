# 🚀 Career Path Builder
### Personalized AI-Powered Career Analysis & Mentorship Platform

**Designed & Developed by SAKTHI RENGANATHAN K.**

---

## 🌟 Overview
Career Path Builder is a premium, full-stack AI application designed to help professionals and students navigate their career journeys with precision. By analyzing resumes and market trends in real-time, the system provides personalized roadmaps, skill gap analysis, and tailored recommendations.

## 🌟 Features

### AI-Powered Analysis
- **Resume Parsing**: Upload your resume (PDF/DOCX) and automatically extract skills, experience, and education
- **Career Prediction**: AI reasoning engine predicts the best career path based on multi-factor analysis
- **Explainable AI**: Get clear explanations for why a career fits your profile
- **Skill Gap Analysis**: Compare your skills against industry standards with visual radar charts
- **Personalized Roadmap**: Step-by-step learning plan tailored to your current level
- **Alternative Paths**: Explore backup career options with match scores

### Premium UI/UX
- Modern glassmorphism design with gradient animations
- Interactive visualizations (radar charts, progress bars, timelines)
- Responsive design for all devices
- Smooth transitions and micro-animations

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. In the project root directory, install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📖 How to Use

1. **Upload Resume** (Optional): Upload your resume to auto-fill your profile
2. **Enter Education**: Add your degree, GPA, and experience level
3. **List Skills**: Enter your technical and soft skills
4. **Share Interests**: Describe your career interests and goals
5. **Get Analysis**: Click "Analyze My Career Path" to receive your personalized report

## 🎨 System Architecture

### Backend (Python/Flask)
- **Resume Analyzer**: NLP-based extraction of skills, projects, and experience
- **Career Engine**: AI reasoning with multi-factor scoring (skills, interests, academics)
- **Skill Analyzer**: Gap analysis with industry benchmarks
- **Roadmap Generator**: Personalized learning paths with resources

### Frontend (React/Vite)
- **ProfileForm**: Multi-step form with resume upload
- **CareerDashboard**: Main results page with tabs
- **SkillGapChart**: Radar chart visualization with Chart.js
- **LearningRoadmap**: Timeline-based roadmap display
- **AlternativePaths**: Alternative career suggestions

## 📊 Career Paths Supported

- Full Stack Developer
- Data Scientist
- Frontend Developer
- Backend Developer
- Mobile App Developer
- DevOps Engineer
- UI/UX Designer
- Cybersecurity Analyst

## 🛠️ Technology Stack

**Backend:**
- Flask (Web framework)
- PyPDF2 & python-docx (Resume parsing)
- NLTK (NLP processing)
- NumPy & Pandas (Data analysis)

**Frontend:**
- React 18
- Vite (Build tool)
- React Router (Navigation)
- Chart.js (Visualizations)
- Axios (API calls)

## 📁 Project Structure

```
ragavi/
├── docs/                      # Project documentation
│   ├── guides/                # Core user and development guides
│   └── reports_archive/       # Archived reports and summaries
├── backend/
│   ├── app.py                 # Flask API
│   ├── resume_analyzer.py     # Resume parsing module
│   ├── career_engine.py       # Career prediction AI
│   ├── skill_analyzer.py      # Skill gap analysis
│   ├── roadmap_generator.py   # Learning roadmap
│   ├── data/
│   │   └── career_data.json   # Career knowledge base
│   └── requirements.txt
├── src/
│   ├── components/
│   │   ├── ProfileForm.jsx
│   │   ├── CareerDashboard.jsx
│   │   ├── SkillGapChart.jsx
│   │   ├── LearningRoadmap.jsx
│   │   └── AlternativePaths.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

## 🎯 Key Algorithms

### Career Matching Algorithm
- **Skill Match** (50% weight): Weighted comparison of user skills vs required skills
- **Interest Alignment** (30% weight): Keyword matching with career domains
- **Academic Fit** (20% weight): Degree relevance to career path

### Skill Gap Prioritization
- **Critical** (Weight 9-10): Must-have skills for the role
- **Important** (Weight 7-8): Highly valuable skills
- **Nice-to-Have** (Weight <7): Differentiating skills

## 🔮 Future Enhancements

- [ ] Integration with job boards (LinkedIn, Indeed)
- [ ] Real-time salary data from APIs
- [ ] User accounts and progress tracking
- [ ] AI-powered interview preparation
- [ ] Skill assessment quizzes
- [ ] Mentor matching system

## 📝 License

This project is created for educational and career guidance purposes.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and enhance!

## 📧 Support

For questions or issues, please create an issue in the repository.

---

**Built with ❤️ using AI and modern web technologies**
