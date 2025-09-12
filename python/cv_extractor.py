#!/usr/bin/env python3
"""
CV Content Extractor
Extracts structured content from CV files using OpenAI GPT
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional

# Import CV parsing libraries
import fitz  # PyMuPDF for PDF
import docx  # python-docx for Word documents
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class CVExtractor:
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
    def extract_text_from_file(self, file_path: str) -> str:
        """Extract raw text from PDF or Word document"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        text = ""
        
        try:
            if file_path.suffix.lower() == '.pdf':
                # Extract from PDF using PyMuPDF
                with fitz.open(str(file_path)) as doc:
                    for page in doc:
                        text += page.get_text() + "\\n"
                        
            elif file_path.suffix.lower() in ['.docx', '.doc']:
                # Extract from Word document
                doc = docx.Document(str(file_path))
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\\n"
                    
            elif file_path.suffix.lower() == '.txt':
                # Plain text file
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()
            else:
                raise ValueError(f"Unsupported file format: {file_path.suffix}")
                
        except Exception as e:
            raise Exception(f"Failed to extract text from {file_path}: {str(e)}")
        
        return text.strip()
    
    def extract_structured_content(self, raw_text: str, filename: str = "") -> Dict[str, Any]:
        """Use OpenAI to extract structured content from CV text"""
        
        system_prompt = """
You are an expert CV parser. Extract structured information from the provided CV text.

Return a JSON object with the following structure:
{
  "personal_info": {
    "name": "Full name",
    "email": "email@example.com", 
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "https://linkedin.com/in/username",
    "website": "https://portfolio.com"
  },
  "professional_summary": "Brief professional summary or objective",
  "work_experience": [
    {
      "title": "Job Title",
      "company": "Company Name", 
      "location": "City, Country",
      "start_date": "MM/YYYY",
      "end_date": "MM/YYYY or Present",
      "duration": "2 years 3 months",
      "description": "Detailed description of responsibilities and achievements",
      "achievements": ["Specific achievement 1", "Achievement 2"],
      "technologies": ["Tech1", "Tech2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University/School Name",
      "location": "City, Country", 
      "graduation_date": "MM/YYYY",
      "gpa": "3.8/4.0",
      "relevant_courses": ["Course 1", "Course 2"]
    }
  ],
  "skills": {
    "technical": ["Skill1", "Skill2"],
    "programming": ["Language1", "Language2"],
    "tools": ["Tool1", "Tool2"],
    "soft_skills": ["Communication", "Leadership"]
  },
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "MM/YYYY",
      "expiry": "MM/YYYY",
      "credential_id": "ID123"
    }
  ],
  "languages": [
    {
      "language": "English",
      "proficiency": "Native/Fluent/Intermediate/Basic"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["Tech1", "Tech2"],
      "url": "https://project-url.com",
      "date": "MM/YYYY"
    }
  ],
  "achievements": [
    {
      "title": "Achievement Title",
      "description": "Achievement description",
      "date": "MM/YYYY"
    }
  ]
}

IMPORTANT:
- Extract only information that is explicitly present in the CV
- Use null for missing information
- Be accurate with dates, names, and details
- Maintain original formatting and terminology where possible
- If a section is completely missing, return an empty array []
"""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Using 4.1 mini as requested
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract structured information from this CV:\\n\\n{raw_text}"}
                ],
                temperature=0.1,  # Low temperature for consistent extraction
                max_tokens=4000
            )
            
            extracted_content = response.choices[0].message.content
            
            # Parse the JSON response with improved error handling
            try:
                structured_data = json.loads(extracted_content)
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract JSON from the response
                import re
                
                # Clean the response text first
                cleaned_content = extracted_content.strip()
                
                # Multiple regex patterns to handle different OpenAI response formats
                json_patterns = [
                    # JSON wrapped in markdown code blocks
                    r'```json\s*(\{.*?\})\s*```',
                    r'```\s*(\{.*?\})\s*```', 
                    # JSON in the response (greedy match for complete object)
                    r'(\{(?:[^{}]|{[^}]*})*\})',
                    # Look for the start of JSON and capture everything until the end
                    r'\{.*',
                ]
                
                structured_data = None
                for pattern in json_patterns:
                    json_match = re.search(pattern, cleaned_content, re.DOTALL)
                    if json_match:
                        try:
                            json_text = json_match.group(1) if len(json_match.groups()) > 0 else json_match.group(0)
                            # Clean up the extracted JSON text
                            json_text = json_text.strip()
                            structured_data = json.loads(json_text)
                            print(f"✅ Successfully parsed JSON using pattern: {pattern[:30]}...")
                            break
                        except json.JSONDecodeError as parse_error:
                            print(f"❌ Pattern {pattern[:30]}... failed: {str(parse_error)}")
                            continue
                
                if structured_data is None:
                    # Log the full response for debugging
                    print(f"🔍 Raw OpenAI response: {extracted_content[:1000]}...")
                    # Return the raw response for debugging
                    raise Exception(f"Could not extract valid JSON from OpenAI response. Raw response: {extracted_content[:500]}...")
            
            # Add metadata
            structured_data['_metadata'] = {
                'extraction_method': 'openai_gpt4',
                'source_file': filename,
                'text_length': len(raw_text),
                'extraction_date': str(pd.Timestamp.now()) if 'pd' in globals() else None
            }
            
            return structured_data
            
        except Exception as e:
            raise Exception(f"OpenAI extraction failed: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Extract structured content from CV files')
    parser.add_argument('file_path', help='Path to CV file (PDF, DOCX, or TXT)')
    parser.add_argument('--extract-structured', action='store_true', help='Extract structured content using OpenAI')
    parser.add_argument('--output', help='Output file path (optional)')
    
    args = parser.parse_args()
    
    try:
        extractor = CVExtractor()
        
        # Extract raw text
        raw_text = extractor.extract_text_from_file(args.file_path)
        
        if args.extract_structured:
            # Extract structured content using OpenAI
            result = extractor.extract_structured_content(raw_text, os.path.basename(args.file_path))
        else:
            # Return just the raw text
            result = {
                "raw_text": raw_text,
                "file_path": args.file_path,
                "text_length": len(raw_text)
            }
        
        # Output results
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"Results saved to {args.output}")
        else:
            # Print JSON to stdout for API consumption
            print(json.dumps(result, ensure_ascii=False))
            
    except Exception as e:
        error_result = {
            "error": str(e),
            "file_path": args.file_path if 'args' in locals() else "unknown"
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()