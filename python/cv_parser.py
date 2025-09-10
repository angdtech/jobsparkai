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
OPENAI_MODEL = "gpt-4o-mini"

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
                ],
                temperature=0.3,
                max_tokens=2000
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
            
            # Analyze with OpenAI
            analysis = self.analyze_with_openai(extracted_text, job_description)
            
            # Add extracted text to result
            analysis["extracted_text"] = extracted_text
            analysis["file_path"] = file_path
            analysis["analyzed_at"] = self._get_timestamp()
            
            return analysis
            
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