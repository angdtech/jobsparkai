#!/usr/bin/env python3
"""
JobSpark AI CV Parser
OpenAI-powered resume analysis and optimization
"""

import os
import sys
import json
import fitz  # PyMuPDF
import docx
import nltk
from typing import Dict, List, Any, Optional
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "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")
OPENAI_MODEL = "gpt-4.1-mini"

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

class CVParser:
    def __init__(self):
        self.client = client
        
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file using PyMuPDF"""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting PDF: {str(e)}")

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting DOCX: {str(e)}")

    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except Exception as e:
            raise Exception(f"Error extracting TXT: {str(e)}")

    def extract_text(self, file_path: str) -> str:
        """Extract text based on file extension"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_ext == '.docx':
            return self.extract_text_from_docx(file_path)
        elif file_ext == '.txt':
            return self.extract_text_from_txt(file_path)
        else:
            raise Exception(f"Unsupported file format: {file_ext}")

    def extract_structured_data(self, cv_text: str) -> Dict[str, Any]:
        """Extract structured data from CV text using OpenAI"""
        
        system_prompt = (
            "You are a CV parser. Format the CV into clean, readable sections. "
            "Return the output as a JSON object with the following keys: "
            "Name, Tagline, Contact, Summary, Achievements, Experience, Education, Skills, Tools, Interests. "
            "Preserve original descriptions and bullet points exactly. Do not use markdown formatting. "
            "For bullet points, use simple hyphens (-) at the start of lines, not asterisks (*). "
            "Do not create double bullet points like '* -' or '• -'. "
            "Order the experience by date (most recent first). "
            "Return **raw JSON** (not a string, not markdown). Do not escape characters. Do not wrap with backticks. "
            "Make sure the output is valid JSON and ends with a complete closing } and ]. "
            "IMPORTANT: For Skills and Tools, return them as arrays of individual items, not as comma-separated strings. "
            "Each skill and tool should be a separate array element. "
            "Use the following structure exactly:\n\n"
            "{\n"
            "  \"Name\": \"Full name\",\n"
            "  \"Tagline\": \"Professional tagline\",\n"
            "  \"Contact\": {\n"
            "    \"Phone\": \"\",\n"
            "    \"Email\": \"\",\n"
            "    \"LinkedIn\": \"\",\n"
            "    \"GitHub\": \"\",\n"
            "    \"Website\": \"\",\n"
            "    \"Portfolio\": \"\",\n"
            "    \"Locations\": [\"City1\", \"City2\"],\n"
            "    \"OtherURLs\": [\"url1\", \"url2\"]\n"
            "  },\n"
            "  \"Summary\": \"A paragraph summary of the candidate's profile.\",\n"
            "  \"Achievements\": [\n"
            "    \"Achievement 1\",\n"
            "    \"Achievement 2\"\n"
            "  ],\n"
            "  \"Experience\": [\n"
            "    {\n"
            "      \"Title\": \"Job Title\",\n"
            "      \"Company\": \"Company Name\",\n"
            "      \"StartDate\": \"MM/YYYY\",\n"
            "      \"EndDate\": \"MM/YYYY\",\n"
            "      \"Description\": \"One or more paragraphs or bullet points. You may include short narrative descriptions followed by hyphen-based bullet points on new lines.\"\n"
            "    },\n"
            "    {\n"
            "      \"Title\": \"Another Title\",\n"
            "      \"Company\": \"Another Company\",\n"
            "      \"StartDate\": \"MM/YYYY\",\n"
            "      \"EndDate\": \"MM/YYYY\",\n"
            "      \"Description\": \"Brief description of role and key responsibilities:\\n\\n- Bullet one\\n- Bullet two\\n- Bullet three\"\n"
            "    }\n"
            "  ],\n"
            "  \"Education\": [\n"
            "    {\n"
            "      \"Degree\": \"Degree title\",\n"
            "      \"Institution\": \"Institution name\",\n"
            "      \"StartDate\": \"YYYY\",\n"
            "      \"EndDate\": \"YYYY\",\n"
            "      \"Notes\": \"Optional notes (or leave blank)\"\n"
            "    }\n"
            "  ],\n"
            "  \"Skills\": [\"Python\", \"JavaScript\", \"Project Management\", \"Data Analysis\", \"Machine Learning\"],\n"
            "  \"Tools\": [\"Git\", \"Docker\", \"AWS\", \"Jira\", \"Tableau\"],\n"
            "  \"Interests\": [\"Photography\", \"Hiking\", \"Reading\"]\n"
            "}\n\n"
            "You must follow this structure exactly. Do not return extra commentary, markdown, or any headers. "
            "Each skill and tool must be a separate, clean array element without extra formatting."
        )

        user_prompt = f"""
        Extract structured data from this CV:
        
        {cv_text}
        
        Return only valid JSON with the exact structure requested. If information is missing, use null for that field.
        """

        try:
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            result = response.choices[0].message.content
            parsed_result = json.loads(result)
            
            # Convert the new format to match the database and display expectations
            # Combine skills and tools into a single skills array with levels
            all_skills = []
            
            # Add skills from Skills array
            for skill in parsed_result.get("Skills", []):
                if isinstance(skill, str):
                    all_skills.append({
                        "name": skill,
                        "level": 70 + len(all_skills) * 3  # Assign varied levels
                    })
                else:
                    all_skills.append(skill)  # If already object format
            
            # Add tools from Tools array
            for tool in parsed_result.get("Tools", []):
                if isinstance(tool, str):
                    all_skills.append({
                        "name": tool,
                        "level": 80 + len(all_skills) * 2  # Assign varied levels for tools
                    })
                else:
                    all_skills.append(tool)
            
            # Extract contact information with multiple URLs support
            contact_info = parsed_result.get("Contact", {})
            
            converted_result = {
                "personal_info": {
                    "name": parsed_result.get("Name", ""),
                    "email": contact_info.get("Email", ""),
                    "phone": contact_info.get("Phone", ""),
                    "address": ", ".join(contact_info.get("Locations", [])),
                    "linkedin": contact_info.get("LinkedIn", ""),
                    "github": contact_info.get("GitHub", ""),
                    "website": contact_info.get("Website", ""),
                    "portfolio": contact_info.get("Portfolio", ""),
                    "other_urls": contact_info.get("OtherURLs", [])
                },
                "professional_summary": parsed_result.get("Summary", ""),
                "work_experience": [{
                    "title": exp.get("Title", ""),
                    "company": exp.get("Company", ""),
                    "start_date": exp.get("StartDate", ""),
                    "end_date": exp.get("EndDate", ""),
                    "description": exp.get("Description", "")
                } for exp in parsed_result.get("Experience", [])],
                "education": [{
                    "degree": edu.get("Degree", ""),
                    "institution": edu.get("Institution", ""),
                    "start_date": edu.get("StartDate", ""),
                    "end_date": edu.get("EndDate", ""),
                    "description": edu.get("Notes", "")
                } for edu in parsed_result.get("Education", [])],
                "skills": all_skills,  # Combined skills and tools with levels
                "certifications": [],  # Not in the new format, can be added later
                "languages": [],  # Not in the new format, can be added later
                "achievements": parsed_result.get("Achievements", []),
                "interests": parsed_result.get("Interests", []),
                "tagline": parsed_result.get("Tagline", "")
            }
            
            return converted_result
            
        except Exception as e:
            print(f"Structured extraction failed: {str(e)}")
            return self._create_fallback_structured_data(cv_text)

    def _create_fallback_structured_data(self, cv_text: str) -> Dict[str, Any]:
        """Create basic structured data if OpenAI extraction fails"""
        lines = cv_text.split('\n')
        name = "Unknown"
        email = None
        phone = None
        location = None
        
        # Basic extraction from first few lines
        for line in lines[:10]:
            line = line.strip()
            if '@' in line and not email:
                email = line
            elif any(char.isdigit() for char in line) and len(line.replace(' ', '')) > 8 and not phone:
                phone = line
            elif any(word in line.lower() for word in ['location:', 'london', 'uk', 'usa', 'city']) and not location:
                location = line
            elif len(line) > 5 and len(line) < 50 and not any(char.isdigit() for char in line) and not name != "Unknown":
                if not any(word in line.lower() for word in ['email', 'phone', 'mobile', 'linkedin']):
                    name = line
        
        return {
            "personal_info": {
                "name": name,
                "email": email,
                "phone": phone, 
                "address": location,
                "linkedin": None,
                "website": None
            },
            "professional_summary": cv_text[:500],
            "work_experience": [],
            "education": [],
            "skills": [],
            "certifications": [],
            "languages": [],
            "tools": [],
            "achievements": [],
            "interests": [],
            "tagline": ""
        }

    def analyze_with_openai(self, cv_text: str, job_description: str = "") -> Dict[str, Any]:
        """Analyze CV using OpenAI GPT-4"""
        
        system_prompt = """You are an expert ATS (Applicant Tracking System) analyst and career coach. 
        Analyze the provided resume and give detailed feedback for optimization.
        
        Provide your analysis in this exact JSON format:
        {
            "overall_score": 85,
            "readability_score": 90,
            "keyword_score": 80,
            "format_score": 85,
            "content_structure_score": 88,
            "rating": "Excellent",
            "rating_color": "#22c55e",
            "keywords_found": ["python", "javascript", "react", "aws"],
            "total_words": 450,
            "sections_found": ["summary", "experience", "education", "skills"],
            "issues": [
                {
                    "type": "warning",
                    "severity": "medium",
                    "message": "Consider adding more quantifiable achievements"
                }
            ],
            "recommendations": [
                {
                    "type": "improvement",
                    "priority": "high",
                    "text": "Add specific metrics to your achievements",
                    "category": "content"
                }
            ],
            "strengths": [
                {
                    "category": "format",
                    "message": "Clean, professional layout that's ATS-friendly"
                }
            ],
            "detailed_analysis": {
                "ats_compatibility": "High - uses standard section headers and clean formatting",
                "content_quality": "Good technical skills representation",
                "improvement_areas": ["quantifiable results", "keyword optimization"]
            }
        }"""

        user_prompt = f"""
        Please analyze this resume for ATS optimization and career advancement:
        
        RESUME TEXT:
        {cv_text}
        
        {f"JOB DESCRIPTION TO MATCH: {job_description}" if job_description else ""}
        
        Focus on:
        1. ATS compatibility and keyword optimization
        2. Content structure and readability
        3. Professional presentation
        4. Specific, actionable improvements
        5. Quantifiable scoring (0-100 for each category)
        
        Return only valid JSON with no additional text.
        """

        try:
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            result = response.choices[0].message.content
            return json.loads(result)
            
        except json.JSONDecodeError as e:
            # Fallback if JSON parsing fails
            return self._create_fallback_analysis(cv_text)
        except Exception as e:
            raise Exception(f"OpenAI analysis failed: {str(e)}")

    def _create_fallback_analysis(self, cv_text: str) -> Dict[str, Any]:
        """Create basic analysis if OpenAI fails"""
        word_count = len(cv_text.split())
        
        return {
            "overall_score": 75,
            "readability_score": 80,
            "keyword_score": 70,
            "format_score": 75,
            "content_structure_score": 75,
            "rating": "Good",
            "rating_color": "#3b82f6",
            "keywords_found": [],
            "total_words": word_count,
            "sections_found": [],
            "issues": [{"type": "info", "severity": "low", "message": "Analysis completed with basic scoring"}],
            "recommendations": [{"type": "general", "priority": "medium", "text": "Consider professional review", "category": "general"}],
            "strengths": [{"category": "general", "message": "Resume processed successfully"}],
            "detailed_analysis": {
                "ats_compatibility": "Standard analysis applied",
                "content_quality": "Basic content review completed",
                "improvement_areas": ["detailed analysis pending"]
            }
        }

    def process_cv(self, file_path: str, job_description: str = "") -> Dict[str, Any]:
        """Main processing function"""
        try:
            # Extract text from file
            extracted_text = self.extract_text(file_path)
            
            if not extracted_text.strip():
                raise Exception("No text could be extracted from the file")
            
            # Extract structured data first
            structured_data = self.extract_structured_data(extracted_text)
            
            # Analyze with OpenAI
            analysis = self.analyze_with_openai(extracted_text, job_description)
            
            # Combine structured data with analysis, ensuring proper structure for database
            result = {
                **analysis,  # Include all analysis data
                "personal_info": structured_data.get("personal_info", {}),
                "professional_summary": structured_data.get("professional_summary", extracted_text[:500]),
                "work_experience": structured_data.get("work_experience", []),
                "education": structured_data.get("education", []),
                "skills": structured_data.get("skills", []),
                "certifications": structured_data.get("certifications", []),
                "languages": structured_data.get("languages", []),
                "tools": structured_data.get("tools", []),
                "achievements": structured_data.get("achievements", []),
                "interests": structured_data.get("interests", []),
                "tagline": structured_data.get("tagline", ""),
                "extracted_text": extracted_text,
                "file_path": file_path,
                "analyzed_at": self._get_timestamp()
            }
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "extracted_text": "",
                "overall_score": 0,
                "analyzed_at": self._get_timestamp()
            }

    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

def main():
    """Command line interface"""
    if len(sys.argv) < 2:
        print("Usage: python cv_parser.py <file_path> [job_description]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    job_description = sys.argv[2] if len(sys.argv) > 2 else ""
    
    parser = CVParser()
    result = parser.process_cv(file_path, job_description)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()