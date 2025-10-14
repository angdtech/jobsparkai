import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const template = searchParams.get('template') || 'modern'

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    console.log('📄 Generating CV for session:', sessionId, 'with template:', template)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database admin access not configured' }, { status: 500 })
    }

    // Get the extracted CV content from database
    const { data: cvContent, error: contentError } = await supabaseAdmin
      .from('cv_content_nw')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (contentError || !cvContent) {
      return NextResponse.json({ error: 'CV content not found - please extract content first' }, { status: 404 })
    }

    console.log('✅ Found CV content for:', cvContent.full_name)

    // Generate HTML CV based on template
    const htmlCV = generateCVHTML(cvContent, template)

    return new Response(htmlCV, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${cvContent.full_name || 'CV'}_${template}.html"`
      }
    })

  } catch (error) {
    console.error('CV generation error:', error)
    return NextResponse.json({ 
      error: 'CV generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateCVHTML(cvData: any, template: string): string {
  const {
    full_name,
    email,
    phone,
    location,
    linkedin_url,
    website_url,
    professional_summary,
    work_experience,
    education,
    skills,
    certifications,
    languages,
    projects,
    achievements
  } = cvData

  // Parse skills if it's stored as an object with categories
  let skillsList = []
  if (skills && typeof skills === 'object') {
    if (Array.isArray(skills)) {
      skillsList = skills
    } else {
      // Flatten skill categories
      skillsList = [
        ...(skills.technical || []),
        ...(skills.programming || []),
        ...(skills.tools || []),
        ...(skills.soft_skills || [])
      ]
    }
  }

  if (template === 'modern') {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${full_name || 'CV'} - Professional Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .cv-container { max-width: 800px; margin: 20px auto; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .cv-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .cv-name { font-size: 2.5em; font-weight: 300; margin-bottom: 10px; }
        .cv-contact { display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; margin-top: 20px; }
        .cv-contact span { font-size: 0.9em; opacity: 0.9; }
        .cv-body { padding: 30px; }
        .cv-section { margin-bottom: 30px; }
        .section-title { font-size: 1.4em; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 5px; margin-bottom: 20px; }
        .summary { font-size: 1.1em; line-height: 1.7; color: #555; }
        .experience-item, .education-item { margin-bottom: 25px; }
        .item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .item-title { font-size: 1.2em; font-weight: 600; color: #333; }
        .item-company { font-size: 1em; color: #667eea; margin-top: 3px; }
        .item-date { font-size: 0.9em; color: #888; font-weight: 500; }
        .item-description { color: #555; line-height: 1.6; }
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .skill-category { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .skill-category h4 { color: #667eea; margin-bottom: 8px; }
        .skill-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-tag { background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; }
        .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .certification-item { background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
        .cert-name { font-weight: 600; color: #333; }
        .cert-issuer { color: #667eea; font-size: 0.9em; }
        .print-button { position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 12px 24px; border: none; border-radius: 25px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 15px rgba(102,126,234,0.3); }
        @media print { .print-button { display: none; } .cv-container { box-shadow: none; margin: 0; } }
        @media (max-width: 768px) { .cv-contact { flex-direction: column; gap: 10px; } .two-column { grid-template-columns: 1fr; gap: 20px; } .item-header { flex-direction: column; align-items: flex-start; } }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">📄 Print/Save PDF</button>
    
    <div class="cv-container">
        <header class="cv-header">
            <h1 class="cv-name">${full_name || 'Professional Name'}</h1>
            <div class="cv-contact">
                ${email ? `<span>📧 ${email}</span>` : ''}
                ${phone ? `<span>📞 ${phone}</span>` : ''}
                ${location ? `<span>📍 ${location}</span>` : ''}
                ${linkedin_url ? `<span>🔗 <a href="${linkedin_url}" style="color: inherit;">LinkedIn</a></span>` : ''}
                ${website_url ? `<span>🌐 <a href="${website_url}" style="color: inherit;">Portfolio</a></span>` : ''}
            </div>
        </header>

        <div class="cv-body">
            ${professional_summary ? `
            <section class="cv-section">
                <h2 class="section-title">Professional Summary</h2>
                <p class="summary">${professional_summary}</p>
            </section>
            ` : ''}

            ${work_experience && work_experience.length > 0 ? `
            <section class="cv-section">
                <h2 class="section-title">Professional Experience</h2>
                ${work_experience.map((job: any) => `
                <div class="experience-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${job.title || 'Position Title'}</div>
                            <div class="item-company">${job.company || 'Company Name'}${job.location ? ` • ${job.location}` : ''}</div>
                        </div>
                        <div class="item-date">${job.start_date || 'Start'} - ${job.end_date || 'Present'}</div>
                    </div>
                    <div class="item-description">${job.description || ''}</div>
                    ${job.achievements && job.achievements.length > 0 ? `
                    <ul style="margin-top: 10px; margin-left: 20px;">
                        ${job.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
                    </ul>
                    ` : ''}
                </div>
                `).join('')}
            </section>
            ` : ''}

            <div class="two-column">
                ${education && education.length > 0 ? `
                <section class="cv-section">
                    <h2 class="section-title">Education</h2>
                    ${education.map((edu: any) => `
                    <div class="education-item">
                        <div class="item-header">
                            <div>
                                <div class="item-title">${edu.degree || 'Degree'}</div>
                                <div class="item-company">${edu.institution || 'Institution'}</div>
                            </div>
                            <div class="item-date">${edu.graduation_date || 'Year'}</div>
                        </div>
                    </div>
                    `).join('')}
                </section>
                ` : ''}

                ${skillsList.length > 0 ? `
                <section class="cv-section">
                    <h2 class="section-title">Skills & Technologies</h2>
                    <div class="skill-tags">
                        ${skillsList.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </section>
                ` : ''}
            </div>

            ${certifications && certifications.length > 0 ? `
            <section class="cv-section">
                <h2 class="section-title">Certifications</h2>
                ${certifications.map((cert: any) => `
                <div class="certification-item">
                    <div class="cert-name">${cert.name || 'Certification Name'}</div>
                    <div class="cert-issuer">${cert.issuer || 'Issuing Organization'} • ${cert.date || 'Date'}</div>
                </div>
                `).join('')}
            </section>
            ` : ''}

            ${projects && projects.length > 0 ? `
            <section class="cv-section">
                <h2 class="section-title">Projects</h2>
                ${projects.map((project: any) => `
                <div class="experience-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${project.name || 'Project Name'}</div>
                            ${project.url ? `<div class="item-company"><a href="${project.url}" style="color: #667eea;">${project.url}</a></div>` : ''}
                        </div>
                        <div class="item-date">${project.date || ''}</div>
                    </div>
                    <div class="item-description">${project.description || ''}</div>
                </div>
                `).join('')}
            </section>
            ` : ''}
        </div>
    </div>

    <div style="text-align: center; padding: 20px; color: #888; font-size: 0.9em;">
        Generated by JobSpark AI • <a href="https://jobspark.ai" style="color: #667eea;">jobspark.ai</a>
    </div>
</body>
</html>
    `
  }

  // Default/fallback template
  return `
    <html>
      <head><title>CV - ${full_name}</title></head>
      <body>
        <h1>${full_name || 'CV'}</h1>
        <p>Contact: ${email} | ${phone}</p>
        <h2>Summary</h2>
        <p>${professional_summary || 'No summary available'}</p>
        <!-- Add more sections here -->
      </body>
    </html>
  `
}