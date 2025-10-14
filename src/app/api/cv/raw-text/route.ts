import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

// Same extraction function as upload route
async function extractTextFromFile(filePath: string, fileName: string): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase()
  
  try {
    if (fileExtension === '.pdf') {
      const pdfParse = (await import('pdf-parse')).default
      const fs = await import('fs')
      
      const dataBuffer = await fs.promises.readFile(filePath)
      const options = {
        normalizeWhitespace: false,
        max: 0, // No page limit
        version: 'v1.10.1'
      }
      
      const pdfData = await pdfParse(dataBuffer, options)
      
      console.log('📄 PDF extraction:', {
        totalPages: pdfData.numpages,
        textLength: pdfData.text.length,
        infoTitle: pdfData.info?.Title
      })
      
      return pdfData.text
    } 
    else if (fileExtension === '.docx') {
      const mammoth = await import('mammoth')
      const rawResult = await mammoth.extractRawText({ path: filePath })
      return rawResult.value
    }
    else {
      throw new Error(`Unsupported file type: ${fileExtension}`)
    }
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error(`Failed to extract text: ${error.message}`)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get the file path from database
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data: session, error } = await supabaseAdmin
      .from('auth_cv_sessions_nw')
      .select('file_path, file_name')
      .eq('session_id', sessionId)
      .single()
    
    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!session.file_path) {
      return NextResponse.json({ error: 'No file uploaded for this session' }, { status: 404 })
    }

    console.log('🔍 Extracting raw text from:', session.file_path)
    
    // Extract the raw text
    const rawText = await extractTextFromFile(session.file_path, session.file_name || 'unknown.pdf')
    
    // Save to a text file for inspection
    const outputPath = path.join(process.cwd(), 'public', 'extracted-cv-text.txt')
    await writeFile(outputPath, rawText, 'utf-8')
    
    console.log('📝 Raw text saved to:', outputPath)
    
    // Count lines and characters
    const lines = rawText.split('\n')
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)
    const bulletLines = lines.filter(line => {
      const trimmed = line.trim()
      return trimmed.startsWith('●') || trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')
    })
    
    // Look for job titles and sections
    const hasDigitalProductManager = rawText.includes('Digital Product Manager')
    const hasEmploymentHistory = rawText.includes('Employment History') || rawText.includes('PROFESSIONAL EXPERIENCE')
    const hasEducation = rawText.includes('Education') || rawText.includes('EDUCATION')
    
    return NextResponse.json({
      success: true,
      file_saved: '/extracted-cv-text.txt',
      statistics: {
        total_characters: rawText.length,
        total_lines: lines.length,
        non_empty_lines: nonEmptyLines.length,
        bullet_points_found: bulletLines.length,
        has_digital_product_manager: hasDigitalProductManager,
        has_employment_section: hasEmploymentHistory,
        has_education_section: hasEducation
      },
      first_500_chars: rawText.substring(0, 500),
      sample_bullet_points: bulletLines.slice(0, 5),
      text_file_url: 'http://localhost:3001/extracted-cv-text.txt'
    })
    
  } catch (error) {
    console.error('Raw text extraction error:', error)
    return NextResponse.json({ 
      error: 'Failed to extract raw text',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}