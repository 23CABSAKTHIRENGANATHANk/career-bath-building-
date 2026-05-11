"""
Enhanced Flask Backend with Health Monitoring
"""

import os
from pathlib import Path

# CRITICAL: Set environment variables BEFORE importing modules
if os.environ.get('VERCEL') or os.environ.get('RENDER'):
    os.environ['NLTK_DATA'] = '/tmp/nltk_data'
    os.environ['HOME'] = '/tmp'  # Force HOME to /tmp for serverless
    os.makedirs('/tmp/nltk_data', exist_ok=True)
    os.makedirs('/tmp/uploads', exist_ok=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
import random
from datetime import datetime

from resume_analyzer import ResumeAnalyzer
from career_engine import CareerEngine
from skill_analyzer import SkillAnalyzer
from roadmap_generator import RoadmapGenerator
from mentor_engine import MentorEngine

app = Flask(__name__)
# Allow CORS from environment variable or default to all origins
CORS_ORIGIN = os.getenv('CORS_ORIGIN', '*')
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGIN}})

# Initialize AI modules with error handling
try:
    resume_analyzer = ResumeAnalyzer()
    career_engine = CareerEngine()
    skill_analyzer = SkillAnalyzer()
    roadmap_generator = RoadmapGenerator()
    mentor_engine = MentorEngine()
    print("✅ All AI modules initialized successfully")
except Exception as e:
    print(f"⚠️ Error initializing AI modules: {e}")
    resume_analyzer = None
    career_engine = None
    skill_analyzer = None
    roadmap_generator = None
    mentor_engine = None

# Configure upload folder for read-only environments
if os.environ.get('VERCEL') or os.environ.get('RENDER'):
    UPLOAD_FOLDER = Path('/tmp/uploads')
else:
    UPLOAD_FOLDER = Path(__file__).parent / 'uploads'

UPLOAD_FOLDER.mkdir(exist_ok=True, parents=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Server statistics
server_stats = {
    'start_time': datetime.now(),
    'requests_processed': 0,
    'resumes_analyzed': 0,
    'profiles_analyzed': 0
}

# Error handlers - ensure all responses are JSON
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'code': 'NOT_FOUND'
    }), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({
        'success': False,
        'error': 'Method not allowed',
        'code': 'METHOD_NOT_ALLOWED'
    }), 405

@app.errorhandler(500)
def internal_error(e):
    print(f"❌ Internal server error: {e}")
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'code': 'INTERNAL_ERROR'
    }), 500

@app.before_request
def before_request():
    """Log incoming requests for debugging"""
    if os.environ.get('DEBUG'):
        print(f"📨 {request.method} {request.path}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Enhanced health check endpoint with server statistics"""
    uptime = datetime.now() - server_stats['start_time']
    return jsonify({
        'status': 'healthy',
        'message': 'AI Career Intelligence System is running',
        'uptime_seconds': int(uptime.total_seconds()),
        'statistics': {
            'requests_processed': server_stats['requests_processed'],
            'resumes_analyzed': server_stats['resumes_analyzed'],
            'profiles_analyzed': server_stats['profiles_analyzed']
        }
    })

@app.route("/")
def home():
    return "Backend Running"

@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    """Handle resume file upload and analysis"""
    import traceback
    import logging
    
    try:
        server_stats['requests_processed'] += 1
        
        # Validate file exists
        if 'resume' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No resume file provided',
                'code': 'NO_FILE'
            }), 400
        
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected',
                'code': 'EMPTY_FILE'
            }), 400
        
        # Check file extension
        allowed_extensions = {'.pdf', '.docx', '.doc'}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            return jsonify({
                'success': False,
                'error': f'Invalid file format. Allowed: PDF, DOCX. Got: {file_ext}',
                'code': 'INVALID_FORMAT'
            }), 400
        
        # Validate file size (max 16MB)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 16 * 1024 * 1024:
            return jsonify({
                'success': False,
                'error': 'File too large. Maximum size: 16MB',
                'code': 'FILE_TOO_LARGE'
            }), 413
        
        if file_size == 0:
            return jsonify({
                'success': False,
                'error': 'File is empty',
                'code': 'EMPTY_FILE'
            }), 400
        
        # Save file
        filename = f"resume_{os.urandom(8).hex()}{file_ext}"
        filepath = app.config['UPLOAD_FOLDER'] / filename
        
        try:
            file.save(str(filepath))
        except Exception as save_error:
            return jsonify({
                'success': False,
                'error': f'Failed to save file: {str(save_error)}',
                'code': 'SAVE_ERROR'
            }), 500
        
        try:
            # Analyze resume with timeout protection
            try:
                resume_data = resume_analyzer.analyze(file_path=str(filepath))
            except Exception as analysis_error:
                # Log error but don't crash
                error_msg = str(analysis_error)
                print(f"Resume analysis error: {error_msg}")
                raise

            # Check for essential extracted data
            has_skills = resume_data.get('skills', {}).get('technical') or resume_data.get('skills', {}).get('soft')
            has_education = resume_data.get('education', {}).get('degrees')
            has_contact = resume_data.get('contact', {}).get('name') or resume_data.get('contact', {}).get('email')
            
            if not (has_skills or has_education or has_contact):
                return jsonify({
                    'success': False,
                    'error': 'Could not extract useful information from resume. Ensure it is a text-based PDF or DOCX.',
                    'code': 'NO_DATA_EXTRACTED'
                }), 400

            server_stats['resumes_analyzed'] += 1

            return jsonify({
                'success': True,
                'data': resume_data,
                'message': 'Resume analyzed successfully!'
            }), 200
            
        except ValueError as ve:
            # Expected errors like unsupported format
            return jsonify({
                'success': False,
                'error': str(ve),
                'code': 'ANALYSIS_ERROR'
            }), 400
        except TimeoutError as te:
            return jsonify({
                'success': False,
                'error': 'Resume analysis took too long. Please try with a simpler resume.',
                'code': 'TIMEOUT_ERROR'
            }), 504
        except Exception as analysis_error:
            error_msg = str(analysis_error) if str(analysis_error) else type(analysis_error).__name__
            print(f"❌ Resume analysis error: {error_msg}")
            return jsonify({
                'success': False,
                'error': f'Resume analysis failed: {error_msg}',
                'code': 'ANALYSIS_ERROR'
            }), 500
        finally:
            # Always clean up file after analysis attempt
            try:
                if filepath.exists():
                    os.remove(filepath)
                    print(f"✓ Cleaned up temporary file {filepath}")
            except Exception as cleanup_error:
                print(f"⚠️ Could not remove temporary file {filepath}: {cleanup_error}")
    
    except Exception as e:
        try:
            error_msg = str(e) if str(e) else 'Unknown error occurred'
            print(f"❌ Error processing resume: {error_msg}")
            return jsonify({
                'success': False,
                'error': error_msg,
                'code': 'UNKNOWN_ERROR'
            }), 500
        except:
            return jsonify({
                'success': False,
                'error': 'An unexpected error occurred during resume processing',
                'code': 'UNKNOWN_ERROR'
            }), 500

@app.route('/api/analyze-profile', methods=['POST'])
def analyze_profile():
    """
    Comprehensive profile analysis
    Accepts user profile data and returns complete career analysis
    """
    try:
        server_stats['requests_processed'] += 1
        data = request.json
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate that at least some skills or interests are provided
        has_skills = (data.get('technical_skills') and len(data.get('technical_skills', [])) > 0) or \
                     (data.get('soft_skills') and len(data.get('soft_skills', [])) > 0)
        has_interests = data.get('interests') and len(data.get('interests', [])) > 0
        
        if not has_skills and not has_interests:
            return jsonify({'error': 'Please provide at least some skills or interests to analyze'}), 400
        
        # Build user profile
        user_profile = {
            'skills': {
                'technical': data.get('technical_skills', []),
                'soft': data.get('soft_skills', [])
            },
            'interests': data.get('interests', []),
            'education': {
                'degrees': data.get('degrees', []),
                'gpa': data.get('gpa')
            },
            'experience': data.get('experience', {}),
            'certifications': data.get('certifications', []),
            'learning_behavior': data.get('learning_behavior', {}),
            'city': data.get('city', 'Bangalore'), # Default to Bangalore
            'skill_ratings': data.get('skill_ratings') or {}
        }
        
        # If resume data is provided, merge it
        resume_data = data.get('resume_data')
        if resume_data:
            # Merge skills
            user_profile['skills']['technical'].extend(
                resume_data.get('skills', {}).get('technical', [])
            )
            user_profile['skills']['soft'].extend(
                resume_data.get('skills', {}).get('soft', [])
            )
            # Remove duplicates
            user_profile['skills']['technical'] = list(set(user_profile['skills']['technical']))
            user_profile['skills']['soft'] = list(set(user_profile['skills']['soft']))
            
            # Merge other data
            if resume_data.get('education'):
                user_profile['education'] = resume_data['education']
            if resume_data.get('experience'):
                user_profile['experience'] = resume_data['experience']
            if resume_data.get('certifications'):
                user_profile['certifications'] = resume_data['certifications']
            if resume_data.get('skill_ratings'):
                user_profile['skill_ratings'].update(resume_data['skill_ratings'])
            if resume_data.get('learning_behavior'):
                user_profile['learning_behavior'] = resume_data['learning_behavior']
            
            # Merge identity and location
            if resume_data.get('contact', {}).get('location') and resume_data['contact']['location'] != "Unknown":
                user_profile['city'] = resume_data['contact']['location']
            
            # Add social links to profile for engine awareness
            user_profile['social_links'] = resume_data.get('contact', {}).get('social', {})
        
        print(f"📊 Analyzing profile for user with {len(user_profile['skills']['technical'])} technical skills...")
        
        # Predict career path
        career_prediction = career_engine.predict_career_path(user_profile)
        
        # Analyze skill gaps
        skill_gap = skill_analyzer.analyze_skill_gap(
            user_profile['skills'],
            career_prediction['recommended_career']
        )
        
        # Compare with industry standards
        industry_comparison = skill_analyzer.compare_with_industry_standards(
            user_profile['skills'],
            career_prediction['recommended_career']
        )
        
        # Generate learning roadmap
        roadmap = roadmap_generator.generate_roadmap(
            career_prediction['recommended_career'],
            skill_gap,
            user_level=data.get('experience_level', 'beginner')
        )
        
        # Get quick wins
        quick_wins = roadmap_generator.get_quick_wins(skill_gap)
        
        # Compile complete response
        response = {
            'user_profile': {
                'skills': user_profile['skills'],
                'education': user_profile['education'],
                'experience': user_profile['experience'],
                'certifications': user_profile.get('certifications', []),
                'city': user_profile.get('city', ''),
                'social_links': user_profile.get('social_links', {})
            },
            'career_recommendation': {
                'career': career_prediction['recommended_career'],
                'description': career_prediction['description'],
                'confidence_score': career_prediction['confidence_score'],
                'reasoning': career_prediction['reasoning'],
                'job_roles': career_prediction['job_roles'],
                'companies': career_prediction['companies'],
                'salary_range': career_prediction['salary_range'],
                'growth_potential': career_prediction['growth_potential']
            },
            'skill_analysis': {
                'gap_analysis': skill_gap,
                'industry_comparison': industry_comparison,
                'quick_wins': quick_wins
            },
            'learning_roadmap': roadmap,
            'alternative_careers': career_prediction['alternative_paths']
        }
        
        server_stats['profiles_analyzed'] += 1
        print(f"✅ Profile analyzed successfully! Recommended career: {career_prediction['recommended_career']}")
        
        return jsonify({
            'success': True,
            'data': response,
            'message': 'Profile analyzed successfully!'
        })
    
    except Exception as e:
        import traceback
        print(f"❌ Error analyzing profile: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'details': traceback.format_exc()}), 500

@app.route('/api/career-paths', methods=['GET'])
def get_career_paths():
    """Get list of all available career paths"""
    try:
        server_stats['requests_processed'] += 1
        data_path = Path(__file__).parent / 'data' / 'career_data.json'
        with open(data_path, 'r') as f:
            career_data = json.load(f)
        
        careers = []
        for name, info in career_data['career_paths'].items():
            careers.append({
                'name': name,
                'description': info['description']
            })
        
        return jsonify({
            'success': True,
            'careers': careers
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat_with_mentor():
    """Handle chat messages with the AI Mentor"""
    try:
        server_stats['requests_processed'] += 1
        data = request.json
        message = data.get('message', '')
        context = data.get('context', {})
        
        response = mentor_engine.get_response(message, context)
        
        return jsonify({
            'success': True,
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mentor-advice', methods=['POST'])
def get_mentor_advice():
    """Generate proactive AI mentor advice based on profile results"""
    try:
        data = request.json
        advice = mentor_engine.generate_mentor_advice(data)
        
        return jsonify({
            'success': True,
            'advice': advice
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/jobs', methods=['POST'])
def get_jobs():
    """Handle job matching for the user's career path"""
    try:
        server_stats['requests_processed'] += 1
        data = request.json
        career = data.get('career', 'Software Engineer')
        city = data.get('city', 'Bangalore')
        
        # Simulated high-quality job data
        titles = [f"Senior {career}", f"Associate {career}", f"{career} Specialist", f"Lead {career}"]
        companies = ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Zomato", "Swiggy", "PhonePe", "Razorpay"]
        types = ["Full-time", "Remote", "Hybrid", "Contract"]
        
        jobs = []
        for i in range(6):
            title = random.choice(titles)
            company = random.choice(companies)
            job_type = random.choice(types)
            salary = f"₹{random.randint(15, 60)} LPA" if i % 2 == 0 else "Competitive"
            
            jobs.append({
                'id': f"job-{i}",
                'title': title,
                'company': company,
                'location': f"{city}, India",
                'type': job_type,
                'salary': salary,
                'posted': f"{random.randint(1, 5)} days ago",
                'match_score': random.randint(85, 99)
            })
            
        return jsonify({
            'success': True,
            'jobs': jobs
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/interview-prep', methods=['POST'])
def get_interview_prep():
    """Generate role-specific interview questions and tips"""
    try:
        data = request.get_json()
        career = data.get('career', 'Software Engineer')
        
        # Role-specific question database
        question_bank = {
            "Software Engineer": [
                {"q": "How do you handle technical debt while meeting tight deadlines?", "type": "Behavioral"},
                {"q": "Explain the difference between a process and a thread.", "type": "Technical"},
                {"q": "Describe a difficult bug you fixed recently.", "type": "Experience"},
                {"q": "What is your favorite design pattern and why?", "type": "Technical"}
            ],
            "Data Scientist": [
                {"q": "How do you handle missing or noisy data in a dataset?", "type": "Technical"},
                {"q": "Explain the bias-variance tradeoff.", "type": "Technical"},
                {"q": "How would you explain a complex model to a non-technical stakeholder?", "type": "Behavioral"},
                {"q": "What is the difference between L1 and L2 regularization?", "type": "Technical"}
            ],
            "Product Manager": [
                {"q": "How do you prioritize features for a new product?", "type": "Strategic"},
                {"q": "Tell me about a time you had to say no to a stakeholder.", "type": "Behavioral"},
                {"q": "How do you define success for a feature?", "type": "Process"},
                {"q": "Describe a product you love and how you would improve it.", "type": "Creative"}
            ]
        }
        
        # Get questions for the specific career or use default
        questions = question_bank.get(career, [
            {"q": f"Tell me about your experience as a {career}.", "type": "Behavioral"},
            {"q": f"What are the most important skills for a {career}?", "type": "Technical"},
            {"q": "How do you stay updated with industry trends?", "type": "Behavioral"},
            {"q": "Describe a successful project you led.", "type": "Experience"}
        ])
        
        return jsonify({
            'success': True,
            'career': career,
            'questions': questions,
            'tips': [
                "Research the company's culture and values.",
                "Use the STAR method for behavioral questions.",
                "Prepare 2-3 specific project examples in detail.",
                "Don't be afraid to ask clarifying questions."
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/skills', methods=['GET'])
def get_skills():
    """Get list of all available skills by category"""
    try:
        server_stats['requests_processed'] += 1
        data_path = Path(__file__).parent / 'data' / 'career_data.json'
        with open(data_path, 'r') as f:
            career_data = json.load(f)
        
        return jsonify({
            'success': True,
            'skills': career_data['skill_categories']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Use PORT from environment variable (common in deployment platforms)
    port = int(os.environ.get("PORT", 5000))
    # Disable debug mode in production for security
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    
    print("=" * 60)
    print(f"🚀 AI Career Intelligence System Backend Starting on port {port}...")
    print("=" * 60)
    print("📊 Modules loaded:")
    print("   ✓ Resume Analyzer")
    print("   ✓ Career Engine")
    print("   ✓ Skill Analyzer")
    print("   ✓ Roadmap Generator")
    print("=" * 60)
    print(f"🌐 Server running on http://0.0.0.0:{port}")
    print("📝 API Documentation:")
    print("   • GET  /api/health          - Health check")
    print("   • POST /api/upload-resume   - Upload resume")
    print("   • POST /api/analyze-profile - Analyze profile")
    print("   • GET  /api/career-paths    - List careers")
    print("   • GET  /api/skills          - List skills")
    print("=" * 60)
    print("💡 Tip: Keep this terminal open while using the application")
    print("=" * 60)
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
