import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Enhanced text extraction function (same as upload route)
async function extractTextFromFile(filePath: string, fileName: string): Promise<string> {
  const fileExtension = path.extname(fileName).toLowerCase()
  
  try {
    if (fileExtension === '.pdf') {
      // Use pdf-parse with enhanced options for better extraction
      const pdfParse = (await import('pdf-parse')).default
      const fs = await import('fs')
      
      const dataBuffer = await fs.promises.readFile(filePath)
      
      // Enhanced PDF parsing options
      const options = {
        // Normalize whitespace and page breaks
        normalizeWhitespace: false,
        // Disable max pages limit to ensure all pages are processed
        max: 0,
        // Include more verbose parsing
        version: 'v1.10.1'
      }
      
      const pdfData = await pdfParse(dataBuffer, options)
      
      console.log('📄 PDF extraction results:', {
        totalPages: pdfData.numpages,
        textLength: pdfData.text.length,
        infoTitle: pdfData.info?.Title,
        firstPageSample: pdfData.text.substring(0, 500) + '...'
      })
      
      return pdfData.text
    } 
    else if (fileExtension === '.docx') {
      // Enhanced DOCX extraction
      const mammoth = await import('mammoth')
      
      const rawResult = await mammoth.extractRawText({ path: filePath })
      
      console.log('📄 DOCX extraction results:', {
        rawTextLength: rawResult.value.length,
        sample: rawResult.value.substring(0, 500) + '...'
      })
      
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
    // Test with the most recent uploaded file
    const filePath = '/Users/angelinadyer/Development/jobsparkai-main/public/uploads/cvs/session_1758208434996_klkimm0dw-1758208439326.pdf'
    
    console.log('🧪 Testing extraction with file:', filePath)
    
    const extractedText = await extractTextFromFile(filePath, 'test.pdf')
    
    // Analyze the extracted text
    const lines = extractedText.split('\n')
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)
    
    // Look for bullet points and job roles
    const bulletLines = lines.filter(line => line.trim().startsWith('●') || line.trim().startsWith('•') || line.trim().startsWith('-'))
    const digitalProductManagerSection = extractedText.indexOf('Digital Product Manager')
    
    let digitalProductManagerText = ''
    if (digitalProductManagerSection > -1) {
      // Extract 3000 characters from where Digital Product Manager appears
      digitalProductManagerText = extractedText.substring(digitalProductManagerSection, digitalProductManagerSection + 3000)
    }
    
    return NextResponse.json({
      success: true,
      extraction_stats: {
        total_length: extractedText.length,
        total_lines: lines.length,
        non_empty_lines: nonEmptyLines.length,
        bullet_lines: bulletLines.length,
        has_digital_product_manager: digitalProductManagerSection > -1
      },
      digital_product_manager_section: digitalProductManagerText,
      first_500_chars: extractedText.substring(0, 500),
      sample_bullet_lines: bulletLines.slice(0, 10),
      raw_text_preview: extractedText.substring(0, 2000) // First 2000 chars for debugging
    })
    
  } catch (error) {
    console.error('Test extraction error:', error)
    return NextResponse.json({ 
      error: 'Test extraction failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}