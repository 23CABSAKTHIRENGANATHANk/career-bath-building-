"""
Resume Analyzer Module
Enhanced with robust PDF extraction, PyPDF2 fallback, and improved NLTK handling.
"""

import re
import json
import datetime
import os
from pathlib import Path
import docx

try:
    import fitz  # PyMuPDF
    FITZ_AVAILABLE = True
except ImportError:
    FITZ_AVAILABLE = False
    print("⚠️ PyMuPDF (fitz) not available. Falling back to other PDF extractors.")

import PyPDF2  # Fallback
from pdfminer.high_level import extract_text as extract_text_pdf

import ssl
import logging

# Configure local logging for module errors
logger = logging.getLogger(__name__)

# Set NLTK path before attempting any NLTK operations
os.environ['NLTK_DATA'] = '/tmp/nltk_data'
os.environ['HOME'] = '/tmp'  # Force HOME to /tmp to prevent write attempts to system home

class ResumeAnalyzer:
    # Pre-defined stopwords to avoid NLTK downloads
    DEFAULT_STOPWORDS = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
        'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
        'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our',
        'their', 'if', 'which', 'who', 'whom', 'where', 'when', 'why', 'how',
        'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some', 'such',
        'no', 'nor', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just'
    }

    def __init__(self):
        # Don't use lazy NLTK setup - skip it entirely on Vercel
        self._nltk_setup = True  # Mark as already done to skip _setup_nltk()

        # Load career data for skill matching
        try:
            data_path = Path(__file__).parent / 'data' / 'career_data.json'
            with open(data_path, 'r') as f:
                self.career_data = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load career data: {e}")
            self.career_data = {'career_paths': {}, 'skill_categories': {'soft_skills': []}}

        # Use pre-defined stopwords to avoid NLTK downloads
        self.stop_words = self.DEFAULT_STOPWORDS
        
        # Build comprehensive skill list
        self.all_skills = set()
        for career in self.career_data.get('career_paths', {}).values():
            self.all_skills.update(career.get('required_skills', {}).get('technical', []))
            self.all_skills.update(career.get('required_skills', {}).get('soft', []))
        
        for category_skills in self.career_data.get('skill_categories', {}).values():
            self.all_skills.update(category_skills)

    def _setup_nltk(self):
        """Lazy NLTK setup - DISABLED on Vercel to prevent filesystem access"""
        # Skip NLTK setup entirely on Vercel/RENDER
        if os.environ.get('VERCEL') or os.environ.get('RENDER'):
            return  # Skip completely on serverless
        
        if self._nltk_setup:
            return
        
        # This code only runs on local development
        try:
            _create_unverified_https_context = ssl._create_unverified_context
        except AttributeError:
            pass
        else:
            ssl._create_default_https_context = _create_unverified_https_context

        # Try to find NLTK data, but don't error if it fails
        try:
            import nltk
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except:
            pass  # Silently fail - we have fallback stopwords
            
        self._nltk_setup = True

    def extract_text(self, file_path):
        """Robust text extraction from PDF or DOCX with fallbacks"""
        file_path = Path(file_path)
        ext = file_path.suffix.lower()
        
        if ext == '.pdf':
            return self._extract_pdf_with_fallback(file_path)
        elif ext == '.docx':
            return self._extract_docx(file_path)
        elif ext == '.doc':
            # Legacy .doc is not directly supported by python-docx
            raise ValueError("Legacy .doc format is not supported. Please save as .docx or .pdf.")
        else:
            raise ValueError(f"Unsupported file format: {ext}. Please use PDF or DOCX.")

    def _extract_pdf_with_fallback(self, file_path):
        """Extract PDF text using fitz (PyMuPDF), fallback to pdfminer/PyPDF2 on error"""
        content = ""
        # 1. Try fitz (PyMuPDF) - Generally the most robust and fastest
        try:
            doc = fitz.open(str(file_path))
            pages = []
            for page in doc:
                text = page.get_text()
                if text:
                    pages.append(text)
            content = "\n".join(pages)
            doc.close()
            if content.strip():
                return content
        except Exception as e:
            logger.warning(f"fitz failed on {file_path}: {e}")

        # 2. Try pdfminer
        try:
            content = extract_text_pdf(str(file_path))
            if content.strip():
                return content
        except Exception as e:
            logger.warning(f"pdfminer.six failed on {file_path}: {e}")

        # 3. Try PyPDF2 as fallback
        try:
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                pages = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        pages.append(text)
                fallback_content = "\n".join(pages)
                if fallback_content.strip():
                    return fallback_content
        except Exception as e:
            logger.error(f"PyPDF2 fallback also failed on {file_path}: {e}")

        if not content.strip():
            raise ValueError("Could not extract any readable text from the PDF file. This usually happens if the PDF is a scanned image. Please provide a machine-readable PDF or DOCX file.")
        
        return content

    def _extract_docx(self, file_path):
        """Extract text from DOCX file using python-docx"""
        try:
            doc = docx.Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs])
        except Exception as e:
            logger.error(f"Failed to read DOCX {file_path}: {e}")
            raise ValueError(f"Failed to read Word document: {e}")

    # --- Rest of the analysis logic remains improved as before ---
    
    def _get_sections(self, text):
        sections = {'education': '', 'experience': '', 'skills': '', 'projects': '', 'contact': ''}
        headers = {
            'education': ['education', 'academic', 'qualifications', 'schooling', 'academic background', 'scholastic'],
            'experience': ['experience', 'employment', 'work history', 'professional background', 'career history', 'work experience'],
            'skills': ['skills', 'technical skills', 'core competencies', 'expertise', 'technologies', 'skillset'],
            'projects': ['projects', 'portfolio', 'key projects', 'academic projects', 'personal projects'],
            'contact': ['contact', 'personal info', 'address', 'communication', 'profile', 'summary', 'about me']
        }
        lines = text.split('\n')
        current_section = 'contact'
        for line in lines:
            cl = line.strip().lower()
            if not cl: continue
            found_header = False
            for sec, keywords in headers.items():
                if any(k == cl or k + ':' == cl for k in keywords):
                    current_section = sec
                    found_header = True
                    break
            if not found_header:
                sections[current_section] += line + '\n'
        return sections

    def extract_contact_info(self, text):
        name = self._extract_name_robustly(text)
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        phone_pattern = r'\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'
        phones = re.findall(phone_pattern, text)
        
        # Social links
        linkedin = re.search(r'linkedin\.com/in/[a-zA-Z0-9_-]+', text, re.IGNORECASE)
        github = re.search(r'github\.com/[a-zA-Z0-9_-]+', text, re.IGNORECASE)
        portfolio = re.search(r'(?:portfolio|website|site):\s*(https?://[^\s,]+)', text, re.IGNORECASE)
        
        # Location (City, State/Country - more robust, ignore short all-caps)
        location_pattern = r'\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*|[A-Z]{2,})\b'
        location_match = re.search(location_pattern, text)
        location = "Unknown"
        
        if location_match:
            # Basic validation: ensure it's not a short skill like "React, SQL"
            extracted = location_match.group(0)
            if not any(skill.lower() == extracted.split(',')[0].strip().lower() for skill in ['react', 'python', 'java', 'aws']):
                location = extracted
        
        if location == "Unknown":
            # Try a simpler city-only check for common tech hubs
            hubs = ['Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Mumbai', 'Delhi', 'San Francisco', 'London', 'Berlin', 'Singapore']
            for hub in hubs:
                if hub.lower() in text.lower():
                    location = hub
                    break
        
        return {
            'name': name,
            'email': emails[0] if emails else None,
            'phone': phones[0] if phones else None,
            'social': {
                'linkedin': linkedin.group(0) if linkedin else None,
                'github': github.group(0) if github else None,
                'portfolio': portfolio.group(1) if portfolio else None
            },
            'location': location
        }

    def _extract_name_robustly(self, text):
        """Extract name by looking for the first line that is likely a name"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        # More comprehensive noise list
        noise_keywords = [
            'resume', 'cv', 'curriculum vitae', 'page', 'email', 'phone', 
            'contact', 'address', 'profile', 'summary', 'about me', 'experience', 'objective'
        ]
        
        # Look for names in the first 10 lines for perfection
        for line in lines[:10]:
            # Perfection: Handle "CV of [Name]" or "Resume: [Name]"
            clean_line = re.sub(r'^(?:Curriculum\s+Vitae\s+of|Resume\s+of|CV\s+of|Resume:?)\s*', '', line, flags=re.IGNORECASE)
            
            # Skip if any noise keyword is found as a whole word in the remaining part
            if any(re.search(r'\b' + re.escape(k) + r'\b', clean_line.lower()) for k in noise_keywords):
                continue
            
            # Simple check: at least 2 words, mostly alphabetical
            words = clean_line.split()
            if len(words) >= 2 and sum(1 for w in words if any(c.isalpha() for c in w)) / len(words) >= 0.8:
                # If it's a known non-name section header, skip it
                headers_to_skip = ['contact info', 'profile summary', 'academic qualifications', 'work experience', 'experience', 'projects', 'skills', 'objective']
                if clean_line.lower() in headers_to_skip:
                    continue
                return clean_line
            
            # Perfection: If single word is capitalized and looks like a name (only if it's the very first line)
            if len(words) == 1 and words[0].isupper() and len(words[0]) > 2 and line == lines[0]:
                 return words[0]
                 
        return lines[0].split(',')[0].strip() if lines else "Unknown"

    def extract_skills(self, text):
        text_lower = text.lower()
        found_skills = {'technical': [], 'soft': []}
        skill_ratings = {}
        proficiency_map = {
            'expert': 9, 'advanced': 8, 'proficient': 7, 
            'intermediate': 5, 'beginner': 3, 'familiar': 3, 'knowledge': 4
        }
        for skill in self.all_skills:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            match = re.search(pattern, text_lower)
            if match:
                is_soft_skill = skill in self.career_data.get('skill_categories', {}).get('soft_skills', [])
                if is_soft_skill:
                    found_skills['soft'].append(skill)
                else:
                    found_skills['technical'].append(skill)
                context = text_lower[max(0, match.start()-30) : min(len(text_lower), match.end()+30)]
                rating = 5
                for p_word, p_val in proficiency_map.items():
                    if p_word in context:
                        rating = p_val
                        break
                skill_ratings[skill] = rating
        return found_skills, skill_ratings

    def calculate_experience_years(self, text):
        year_pattern = r'\b(19|20)\d{2}\b'
        range_pattern = r'([A-Za-z]+\s+\d{4}|\d{2}/\d{4})\s*[-–—to ]+\s*([A-Za-z]+\s+\d{4}|\d{2}/\d{4}|Present|Current)'
        total_months = 0
        matches = re.finditer(range_pattern, text, re.IGNORECASE)
        for match in matches:
            start_str, end_str = match.groups()
            try:
                start_match = re.search(r'(\d{4})', start_str)
                start_year = int(start_match.group(1)) if start_match else 2000
                if 'present' in end_str.lower() or 'current' in end_str.lower():
                    end_year = datetime.datetime.now().year
                else:
                    end_match = re.search(r'(\d{4})', end_str)
                    end_year = int(end_match.group(1)) if end_match else datetime.datetime.now().year
                total_months += (end_year - start_year) * 12
            except: continue
        if total_months == 0:
            years = sorted([int(y) for y in re.findall(year_pattern, text)])
            if len(years) >= 2: return years[-1] - years[0]
            return 0
        return round(total_months / 12, 1)

    def analyze(self, file_path=None, text=None):
        try:
            self._setup_nltk()
        except Exception as e:
            logger.warning(f"NLTK setup failed, continuing without it: {e}")
        
        if file_path:
            text = self.extract_text(file_path)
        elif not text:
            raise ValueError("Either file_path or text must be provided")
        
        sections = self._get_sections(text)
        # Use contact section or first bit of text for contact info
        contact_text = sections['contact'] if sections['contact'].strip() else text[:500]
        contact = self.extract_contact_info(contact_text)
        skills, skill_ratings = self.extract_skills(text)
        edu_data = self.extract_education(sections['education'] if sections['education'] else text)
        exp_years = self.calculate_experience_years(sections['experience'] if sections['experience'] else text)
        projects = self.extract_projects(sections['projects'] if sections['projects'] else text)
        # For certifications, search in skills, experience, and whole text for perfection
        certs_text = (sections['skills'] + "\n" + sections['experience']).strip()
        certs = self.extract_certifications(certs_text if certs_text else text)
        
        # If no projects found in projects section, try experience section
        if not projects and sections['experience']:
            projects = self.extract_projects(sections['experience'])
        
        # Perfection: Intelligent hierarchy for highest degree
        highest = "N/A"
        dept = "N/A"
        if edu_data['degrees']:
            priority = {'phd': 5, 'doctor': 5, 'master': 4, 'mca': 4, 'mba': 4, 'graduate': 4, 'bachelor': 3, 'btech': 3, 'be': 3, 'diploma': 2, 'hsc': 1, 'ssc': 1}
            best_edu = edu_data['degrees'][0]
            max_p = 0
            for edu in edu_data['degrees']:
                p = 0
                deg_lower = edu['degree'].lower()
                for key, val in priority.items():
                    if key in deg_lower:
                        p = val
                        break
                if p > max_p:
                    max_p = p
                    best_edu = edu
            highest = best_edu['degree']
            dept = best_edu['field']

        resume_data = {
            'basic_identity': {
                'name': contact['name'],
                'highest_degree': highest,
                'department': dept,
                'location': contact['location']
            },
            'contact': contact,
            'skills': skills,
            'skill_ratings': skill_ratings,
            'education': edu_data,
            'projects': projects,
            'certifications': certs,
            'experience': {
                'years': exp_years,
                'positions': self._extract_job_titles(sections['experience'] if sections['experience'] else text)
            },
            'learning_behavior': {}
        }
        resume_data['learning_behavior'] = self._analyze_behavior(resume_data)
        return resume_data

    def extract_education(self, text):
        education = []
        # Perfection: Expanded degree patterns including PhD, B.Sc, SSC/HSC
        degree_patterns = [
            # PhD / Doctorate
            r'(PhD|Ph\.D|Doctor\s+of\s+Philosophy|Doctorate)\b(?:\s+(?:in\s+)?([^\n,]+))?',
            # Master / Bachelor with "of" (e.g. Master of Technology, Bachelor of Computer Applications)
            # Typo resilience for OCR issues (e.g. helor, chelor)
            r'((?:Master|Bachelor|helor|chelor|Doctor|Post\s+Graduate)\s+of\s+[A-Za-z\s]+?)(?=\s+in\s+|\s*,|\s*$|\n)(?:\s+in\s+([^\n,]+))?',
            # Post Grad
            r'(Master|M\.?S\.?|M\.?Tech|M\.?E\.?|MCA|MBA|M\.?Sc|M\.?Com|PGDM|Post\s+Graduate)\b(?:\s+(?:of\s+)?(?:Science\s+)?(?:in\s+)?([^\n,]+))?',
            # Under Grad
            r'(Bachelor|helor|chelor|B\.?S\.?|B\.?Tech|B\.?E\.?|B\.?Sc|B\.?Com|BBA|BCA|B\.?A\.?)\b(?:\s+(?:of\s+)?(?:Science\s+)?(?:in\s+)?([^\n,]+))?',
            # Diplomas
            r'(Diploma|PG\s+Diploma)\b(?:\s+(?:in\s+)?([^\n,]+))?',
            # Schooling
            r'(SSC|HSC|Class\s+X|Class\s+XII|Higher\s+Secondary|Standard\s+12|Standard\s+10|Matriculation)\b'
        ]
        
        for pattern in degree_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                degree = match.group(1).strip()
                field = match.group(2).strip() if (len(match.groups()) > 1 and match.group(2)) else "General"
                
                # Perfection: Comprehensive field cleaning
                field = re.sub(r'^(?:in|of|from|at|branch|field|major)\s+', '', field, flags=re.IGNORECASE)
                field = re.sub(r'^(?:Science\s+in|Science\s+and\s+Engineering\s+in)\s+', '', field, flags=re.IGNORECASE)
                
                # Additional noise removal
                field = re.sub(r'^(?:Department\s+of|Field\s+of|Branch\s+of|Major\s+in|Standard|Class|Grade)\s+', '', field, flags=re.IGNORECASE)
                
                # Avoid capturing multi-line non-degree text
                field = field.split('\n')[0].strip().strip(':').strip()
                if not field or len(field) < 2 or field.lower() in ['me', 'it', 'cs', 'of', 'in', 'and']: field = "General"
                if len(field) > 100: field = field[:100]
                
                # Deduplicate degree/field (e.g. Master of Technology, Technology)
                if field.lower() in degree.lower() or degree.lower() in field.lower():
                    field = "General"
                    
                # Normalize common abbreviations so we can deduplicate them later
                deg_lower = degree.lower()
                normalized_degree = degree
                if 'higher secondary' in deg_lower or '12' in deg_lower:
                    normalized_degree = "Higher Secondary"
                elif 'secondary' in deg_lower and 'higher' not in deg_lower or '10' in deg_lower or 'matriculation' in deg_lower:
                    normalized_degree = "High School"
                elif 'b.sc' in deg_lower or 'bsc' in deg_lower or 'bachelor of science' in deg_lower:
                    normalized_degree = "Bachelor of Science"
                elif 'm.sc' in deg_lower or 'msc' in deg_lower or 'master of science' in deg_lower:
                    normalized_degree = "Master of Science"
                elif 'b.tech' in deg_lower or 'btech' in deg_lower or 'bachelor of technology' in deg_lower:
                    normalized_degree = "Bachelor of Technology"
                elif 'm.tech' in deg_lower or 'mtech' in deg_lower or 'master of technology' in deg_lower:
                    normalized_degree = "Master of Technology"
                elif 'bca' in deg_lower or 'bachelor of computer application' in deg_lower:
                    normalized_degree = "Bachelor of Computer Applications"
                elif 'phd' in deg_lower or 'ph.d' in deg_lower or 'doctorate' in deg_lower:
                    normalized_degree = "PhD"
                
                # Typo cleanup for fragments
                if normalized_degree.lower() in ['helor', 'chelor']:
                    normalized_degree = "Bachelor"
                elif 'helor of' in normalized_degree.lower():
                    normalized_degree = normalized_degree.lower().replace('helor', 'Bachelor').title()
                
                education.append({'degree': normalized_degree, 'field': field, 'original_degree': degree})
                
        # Final cleanup pass to remove subset degrees and specific noise names
        cleaned_education = []
        seen_degrees = set()
        for edu in education:
            if edu['degree'].lower() in ['me', 'my', 'resume', 'cv', 'academic', 'qualification']:
                continue
                
            deg_key = f"{edu['degree'].lower()}_{edu['field'].lower()}"
            if deg_key not in seen_degrees:
                seen_degrees.add(deg_key)
                # Omit 'original_degree' from final output to keep schema identical
                cleaned_education.append({'degree': edu['degree'], 'field': edu['field']})
        
        # Additional duplicate resolution (if we have "B.Sc" and "Bachelor of Science", we already normalized to "Bachelor of Science", deduplication handled by the key)
        # Final pass: remove any degree that is purely a substring of another extracted degree
        final_education = []
        for i, edu1 in enumerate(cleaned_education):
            is_subset = False
            # Normalize for comparison: remove filler words and lowercase
            str1 = f"{edu1['degree']} {edu1['field']}".lower()
            str1 = re.sub(r'\b(general|in|of|and|applications|application)\b', '', str1).strip()
            # Special case for Diploma vs Diploma in ...
            if edu1['degree'].lower() == 'diploma' and edu1['field'].lower() == 'general':
                str1 = 'diploma'
                
            for j, edu2 in enumerate(cleaned_education):
                if i != j:
                    str2 = f"{edu2['degree']} {edu2['field']}".lower()
                    str2 = re.sub(r'\b(general|in|of|and|applications|application)\b', '', str2).strip()
                    if str1 == str2 or (str1 in str2 and len(str1) < len(str2)):
                        # If field matches but one is slightly longer (e.g. Diploma vs Diploma - CSC)
                        is_subset = True
                        break
                    # Catch the "Bachelor Computer" vs "Bachelor Computer Applications"
                    if edu1['degree'].lower() == 'bachelor' and edu2['degree'].lower().startswith('bachelor'):
                        if edu1['field'].lower() in edu2['degree'].lower() or edu1['field'].lower() in edu2['field'].lower():
                            is_subset = True
                            break

            if not is_subset:
                final_education.append(edu1)
                
        gpa = re.search(r'(?:GPA|CGPA|Percentage|Aggregate)[\s:]+(\d+\.?\d*/?\d*)', text, re.IGNORECASE)
        return {'degrees': final_education, 'gpa': gpa.group(1) if gpa else None}

    def _extract_job_titles(self, text):
        job_titles = [
            'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
            'Data Scientist', 'Data Analyst', 'DevOps Engineer', 'Cloud Architect',
            'Systems Administrator', 'Network Engineer', 'Cybersecurity Specialist',
            'Project Manager', 'Product Manager', 'UX Designer', 'UI Designer',
            'Machine Learning Engineer', 'AI Specialist', 'Mobile Developer',
            'Quality Assurance', 'Test Engineer', 'Technical Lead'
        ]
        found = []
        for title in job_titles:
            # Handle cases like "Senior Full Stack" by relaxing word boundary
            if re.search(re.escape(title), text, re.IGNORECASE):
                found.append(title)
        
        # Regex for unique ones (captures things like "Lead Developer", "Python Analyst")
        regex_pattern = r'([A-Z][A-Za-z\s]+(?:Engineer|Developer|Designer|Analyst|Manager|Specialist|Lead|Consultant))'
        regex_found = re.findall(regex_pattern, text)
        found.extend(regex_found)
        
        return list(set(found))[:10]

    def extract_projects(self, text):
        items = re.split(r'\n[\•\-\*]|\n\n', text)
        return [i.strip()[:200] for i in items if len(i.strip()) > 20][:5]

    def _analyze_behavior(self, data):
        behavior = {'self_learner': False, 'project_oriented': False, 'academic_focused': False}
        if len(data['projects']) >= 2: behavior['project_oriented'] = True; behavior['self_learner'] = True
        if data['education']['degrees']: behavior['academic_focused'] = True
        return behavior

    def extract_certifications(self, text):
        cert_list = [
            'AWS Certified Solutions Architect', 'AWS Certified Developer', 'AWS Certified SysOps',
            'Google Professional Cloud Architect', 'Google Professional Data Engineer',
            'Microsoft Certified: Azure Solutions Architect', 'CompTIA Security+', 'CompTIA A+', 'CompTIA Network+',
            'CISSP', 'CEH', 'PMP', 'Scrum Master', 'ITIL', 'Cisco CCNA', 'Cisco CCNP',
            'Oracle Certified Professional', 'Red Hat Certified Engineer', 'Salesforce Administrator',
            'TensorFlow Developer', 'Meta Front-End Developer', 'IBM Data Science'
        ]
        certs = []
        for cert in cert_list:
            if re.search(r'\b' + re.escape(cert) + r'\b', text, re.IGNORECASE):
                certs.append(cert)
        
        # Generic keywords
        cert_keywords = ['certified', 'certification', 'certificate', 'diploma']
        for kw in cert_keywords:
            matches = re.findall(r'([A-Z][A-Za-z\s]*' + kw + r'[A-Za-z\s]*)', text, re.IGNORECASE)
            certs.extend([m.strip() for m in matches])
            
        return list(set(certs))[:10]
