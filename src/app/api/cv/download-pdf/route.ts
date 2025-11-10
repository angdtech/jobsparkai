import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  let browser = null
  
  try {
    const { html, name } = await request.json()

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    const isLocal = process.env.NODE_ENV === 'development'

    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: isLocal
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()
    
    // Set viewport to match A4 aspect ratio with proper scaling
    await page.setViewport({
      width: 794, // A4 width at 96 DPI
      height: 1123, // A4 height at 96 DPI
      deviceScaleFactor: 2, // High resolution for crisp text
    })
    
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm',
      },
      preferCSSPageSize: false,
      scale: 0.8, // Scale down to fit more content and make fonts smaller
    })

    await browser.close()

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name || 'CV'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    
    if (browser) {
      await browser.close()
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
