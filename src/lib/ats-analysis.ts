// ATS Analysis Engine - Ported from WordPress CV Analysis System
// Based on your existing analysis logic

export interface ATSAnalysis {
  overall_score: number
  readability_score: number
  keyword_score: number
  format_score: number
  
  // Detailed scores
  file_format_score: number
  layout_score: number
  font_score: number
  content_structure_score: number
  
  // Analysis results
  total_words: number
  keywords_found: string[]
  missing_sections: string[]
  recommendations: Recommendation[]
  issues: Issue[]
  strengths: Strength[]
  
  // Metadata
  rating: string
  rating_color: string
  analyzed_at: string
}

export interface Recommendation {
  type: 'warning' | 'info' | 'success'
  text: string
  priority: 'high' | 'medium' | 'low'
  action?: string
}

export interface Issue {
  type: 'format' | 'content' | 'structure'
  message: string
  severity: 'high' | 'medium' | 'low'
}

export interface Strength {
  type: 'format' | 'content' | 'structure'
  message: string
}

export class ATSAnalyzer {
  private static readonly REQUIRED_SECTIONS = [
    'contact', 'summary', 'experience', 'education', 'skills'
  ]
  
  private static readonly ATS_KEYWORDS = [
    // Technical skills
    'javascript', 'python', 'react', 'node.js', 'sql', 'aws', 'docker',
    'kubernetes', 'git', 'html', 'css', 'java', 'c++', 'php', 'ruby',
    
    // Business skills
    'product management', 'project management', 'agile', 'scrum', 'leadership',
    'strategy', 'analytics', 'marketing', 'sales', 'customer service',
    
    // Industry terms
    'ai', 'artificial intelligence', 'machine learning', 'data science',
    'cloud computing', 'digital transformation', 'automation', 'innovation'
  ]

  static analyzeCV(cvData: any, jobDescription?: string): ATSAnalysis {
    const extractedText = cvData.extracted_text || ''
    const parsedData = cvData.parsed_data || {}
    
    // Calculate individual scores
    const formatScore = this.calculateFormatScore(cvData)
    const contentScore = this.calculateContentScore(parsedData, extractedText)
    const keywordScore = this.calculateKeywordScore(extractedText, jobDescription)
    const structureScore = this.calculateStructureScore(parsedData)
    
    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (formatScore * 0.2) + 
      (contentScore * 0.3) + 
      (keywordScore * 0.3) + 
      (structureScore * 0.2)
    )
    
    // Generate recommendations and issues
    const recommendations = this.generateRecommendations(parsedData, extractedText, {
      formatScore,
      contentScore, 
      keywordScore,
      structureScore
    })
    
    const issues = this.identifyIssues(parsedData, extractedText, {
      formatScore,
      contentScore,
      keywordScore, 
      structureScore
    })
    
    const strengths = this.identifyStrengths(parsedData, extractedText, {
      formatScore,
      contentScore,
      keywordScore,
      structureScore  
    })
    
    // Calculate rating
    const { rating, color } = this.calculateRating(overallScore)
    
    return {
      overall_score: overallScore,
      readability_score: contentScore,
      keyword_score: keywordScore,
      format_score: formatScore,
      
      file_format_score: formatScore,
      layout_score: structureScore,
      font_score: 85, // Default for digital formats
      content_structure_score: structureScore,
      
      total_words: extractedText.split(/\s+/).length,
      keywords_found: this.extractFoundKeywords(extractedText),
      missing_sections: this.findMissingSections(parsedData),
      recommendations,
      issues,
      strengths,
      
      rating,
      rating_color: color,
      analyzed_at: new Date().toISOString()
    }
  }

  private static calculateFormatScore(cvData: any): number {
    let score = 100
    
    // File type scoring
    const fileType = cvData.file_type?.toLowerCase() || ''
    if (fileType.includes('pdf')) {
      score += 0 // PDF is good
    } else if (fileType.includes('word') || fileType.includes('docx')) {
      score -= 5 // Word docs can have formatting issues
    } else if (fileType.includes('txt')) {
      score -= 15 // Plain text lacks formatting
    } else {
      score -= 20 // Unknown format
    }
    
    // File size scoring (too large might have issues)
    const fileSize = cvData.file_size || 0
    const fileSizeMB = fileSize / (1024 * 1024)
    if (fileSizeMB > 5) {
      score -= 10 // File too large
    }
    
    return Math.max(0, Math.min(100, score))
  }

  private static calculateContentScore(parsedData: any, text: string): number {
    let score = 0
    const wordCount = text.split(/\s+/).length
    
    // Word count scoring
    if (wordCount >= 300 && wordCount <= 800) {
      score += 40 // Optimal length
    } else if (wordCount >= 200 && wordCount <= 1000) {
      score += 30 // Good length
    } else if (wordCount >= 100) {
      score += 20 // Acceptable
    } else {
      score += 10 // Too short
    }
    
    // Contact information
    if (parsedData.contact?.email) score += 15
    if (parsedData.contact?.phone) score += 10
    if (parsedData.contact?.linkedin) score += 5
    
    // Content quality
    if (parsedData.summary && parsedData.summary.length > 50) score += 20
    if (parsedData.experience && parsedData.experience.length > 0) score += 20
    if (parsedData.education && parsedData.education.length > 0) score += 15
    
    return Math.min(100, score)
  }

  private static calculateKeywordScore(text: string, jobDescription?: string): number {
    const textLower = text.toLowerCase()
    const foundKeywords = this.ATS_KEYWORDS.filter(keyword => 
      textLower.includes(keyword.toLowerCase())
    )
    
    let score = (foundKeywords.length / this.ATS_KEYWORDS.length) * 100
    
    // Bonus for job-specific keywords
    if (jobDescription) {
      const jobWords = jobDescription.toLowerCase().split(/\s+/)
      const commonWords = jobWords.filter(word => 
        word.length > 3 && textLower.includes(word)
      )
      
      // Add bonus based on job-specific keyword matches
      const bonus = Math.min(20, (commonWords.length / jobWords.length) * 100)
      score += bonus
    }
    
    return Math.min(100, score)
  }

  private static calculateStructureScore(parsedData: any): number {
    let score = 0
    
    // Check for required sections
    const sectionsFound = this.REQUIRED_SECTIONS.filter(section => {
      switch (section) {
        case 'contact':
          return parsedData.contact && (parsedData.contact.email || parsedData.contact.phone)
        case 'summary':
          return parsedData.summary && parsedData.summary.length > 20
        case 'experience':
          return parsedData.experience && parsedData.experience.length > 0
        case 'education':
          return parsedData.education && parsedData.education.length > 0
        case 'skills':
          return parsedData.skills && parsedData.skills.length > 0
        default:
          return false
      }
    })
    
    score = (sectionsFound.length / this.REQUIRED_SECTIONS.length) * 100
    
    return Math.max(0, score)
  }

  private static generateRecommendations(parsedData: any, text: string, scores: any): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // Format recommendations
    if (scores.formatScore < 80) {
      recommendations.push({
        type: 'warning',
        text: 'Consider using PDF format for better ATS compatibility',
        priority: 'high',
        action: 'format'
      })
    }
    
    // Content recommendations
    if (scores.contentScore < 70) {
      if (!parsedData.summary || parsedData.summary.length < 50) {
        recommendations.push({
          type: 'warning',
          text: 'Add a professional summary section to highlight your key qualifications',
          priority: 'high'
        })
      }
      
      if (!parsedData.contact?.email) {
        recommendations.push({
          type: 'warning',
          text: 'Include a professional email address in your contact information',
          priority: 'high'
        })
      }
    }
    
    // Keyword recommendations
    if (scores.keywordScore < 60) {
      recommendations.push({
        type: 'warning',
        text: 'Include more industry-relevant keywords and technical skills',
        priority: 'medium'
      })
    }
    
    // Structure recommendations
    if (scores.structureScore < 80) {
      const missingSections = this.findMissingSections(parsedData)
      if (missingSections.length > 0) {
        recommendations.push({
          type: 'info',
          text: `Consider adding these sections: ${missingSections.join(', ')}`,
          priority: 'medium'
        })
      }
    }
    
    return recommendations
  }

  private static identifyIssues(parsedData: any, text: string, scores: any): Issue[] {
    const issues: Issue[] = []
    
    if (scores.formatScore < 60) {
      issues.push({
        type: 'format',
        message: 'File format may not be ATS-friendly',
        severity: 'high'
      })
    }
    
    if (text.split(/\s+/).length < 200) {
      issues.push({
        type: 'content',
        message: 'CV appears too short - consider adding more detail',
        severity: 'medium'
      })
    }
    
    if (!parsedData.contact?.email) {
      issues.push({
        type: 'structure',
        message: 'Missing contact email address',
        severity: 'high'
      })
    }
    
    return issues
  }

  private static identifyStrengths(parsedData: any, text: string, scores: any): Strength[] {
    const strengths: Strength[] = []
    
    if (scores.formatScore >= 90) {
      strengths.push({
        type: 'format',
        message: 'Excellent file format for ATS processing'
      })
    }
    
    if (parsedData.contact?.linkedin) {
      strengths.push({
        type: 'content', 
        message: 'LinkedIn profile included for additional verification'
      })
    }
    
    if (scores.keywordScore >= 80) {
      strengths.push({
        type: 'content',
        message: 'Strong keyword optimization for ATS systems'
      })
    }
    
    return strengths
  }

  private static extractFoundKeywords(text: string): string[] {
    const textLower = text.toLowerCase()
    return this.ATS_KEYWORDS.filter(keyword => 
      textLower.includes(keyword.toLowerCase())
    )
  }

  private static findMissingSections(parsedData: any): string[] {
    return this.REQUIRED_SECTIONS.filter(section => {
      switch (section) {
        case 'contact':
          return !(parsedData.contact && (parsedData.contact.email || parsedData.contact.phone))
        case 'summary':
          return !(parsedData.summary && parsedData.summary.length > 20)
        case 'experience':
          return !(parsedData.experience && parsedData.experience.length > 0)
        case 'education':
          return !(parsedData.education && parsedData.education.length > 0)
        case 'skills':
          return !(parsedData.skills && parsedData.skills.length > 0)
        default:
          return true
      }
    })
  }

  private static calculateRating(score: number): { rating: string; color: string } {
    if (score >= 90) return { rating: 'Excellent', color: 'green' }
    if (score >= 80) return { rating: 'Very Good', color: 'blue' }
    if (score >= 70) return { rating: 'Good', color: 'yellow' }
    if (score >= 60) return { rating: 'Fair', color: 'orange' }
    return { rating: 'Needs Improvement', color: 'red' }
  }
}