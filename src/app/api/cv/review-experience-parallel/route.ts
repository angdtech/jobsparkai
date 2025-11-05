import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client only when needed to avoid build-time errors
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Parallel functions for experience analysis
async function detectDuplicatesWithEmbeddings(openai: OpenAI, experienceData: any[]) {
  try {
    console.log('🔍 Starting parallel duplicate detection with embeddings...')
    
    // Collect all bullet points with their context
    const allBulletPoints: any[] = []
    experienceData.forEach((exp, expIndex) => {
      const items = exp.description_items || (exp.description ? exp.description.split('\n').filter((line: string) => line.trim()) : [])
      items.forEach((item: string, itemIndex: number) => {
        allBulletPoints.push({
          text: item.trim(),
          expIndex,
          itemIndex,
          role: exp.position,
          company: exp.company
        })
      })
    })

    // Get embeddings for all bullet points in parallel
    const embeddingPromises = allBulletPoints.map(async (bullet) => {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: bullet.text
      })
      return {
        ...bullet,
        embedding: embedding.data[0].embedding
      }
    })

    const bulletPointsWithEmbeddings = await Promise.all(embeddingPromises)

    // Calculate cosine similarity between all pairs
    function cosineSimilarity(a: number[], b: number[]) {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
      return dotProduct / (magnitudeA * magnitudeB)
    }

    // Find potential duplicates using embeddings
    const potentialDuplicates: any[] = []
    for (let i = 0; i < bulletPointsWithEmbeddings.length; i++) {
      for (let j = i + 1; j < bulletPointsWithEmbeddings.length; j++) {
        const bullet1 = bulletPointsWithEmbeddings[i]
        const bullet2 = bulletPointsWithEmbeddings[j]
        
        // Skip if same role (we want cross-role duplicates)
        if (bullet1.expIndex === bullet2.expIndex) continue
        
        const similarity = cosineSimilarity(bullet1.embedding, bullet2.embedding)
        
        // Flag as potential duplicate if similarity > 0.75
        if (similarity > 0.75) {
          potentialDuplicates.push({
            bullet1,
            bullet2,
            similarity: similarity.toFixed(3)
          })
        }
      }
    }

    console.log(`🎯 Found ${potentialDuplicates.length} potential duplicates using parallel embeddings`)
    return potentialDuplicates
  } catch (error) {
    console.error('❌ Parallel embeddings failed:', error)
    return []
  }
}

async function analyzeLengthAndStructure(experienceData: any[]) {
  console.log('📏 Analyzing CV length and structure...')
  
  const allBulletPoints: any[] = []
  experienceData.forEach((exp, expIndex) => {
    const items = exp.description_items || (exp.description ? exp.description.split('\n').filter((line: string) => line.trim()) : [])
    items.forEach((item: string) => {
      allBulletPoints.push({
        text: item.trim(),
        expIndex
      })
    })
  })
  
  const totalBulletPoints = allBulletPoints.length
  const totalCharacters = allBulletPoints.reduce((sum, bullet) => sum + bullet.text.length, 0)
  const averageWordsPerBullet = allBulletPoints.reduce((sum, bullet) => sum + bullet.text.split(' ').length, 0) / totalBulletPoints
  
  // Rough page estimation (assuming ~4000 chars per page for CV format)
  const estimatedPages = Math.ceil(totalCharacters / 4000)
  const recommendedBulletCount = estimatedPages > 2 ? Math.ceil(totalBulletPoints * 0.4) : totalBulletPoints
  
  return {
    totalBulletPoints,
    totalCharacters,
    averageWordsPerBullet,
    estimatedPages,
    recommendedBulletCount,
    reductionNeeded: totalBulletPoints - recommendedBulletCount
  }
}

async function performDetailedReview(openai: OpenAI, experienceText: string, lengthAnalysis: any, duplicateContext: string, jobTitle: string) {
  const lengthContext = lengthAnalysis.estimatedPages > 2 ? `
🚨 CV LENGTH ALERT: This CV is ${lengthAnalysis.estimatedPages} pages long (${lengthAnalysis.totalBulletPoints} bullet points)!
IDEAL: 1 page | MAXIMUM: 2 pages | CURRENT: ${lengthAnalysis.estimatedPages} pages

CRITICAL MISSION: REDUCE BY ${lengthAnalysis.reductionNeeded} BULLET POINTS (${Math.round((lengthAnalysis.reductionNeeded / lengthAnalysis.totalBulletPoints) * 100)}% reduction needed)

AGGRESSIVE REDUCTION STRATEGY:
- DELETE weak, generic, or vague bullet points  
- REMOVE exact duplicates (same content appearing multiple times)
- REMOVE older/less relevant experience details
- EVALUATE each role independently (career paths can be diverse)
- KEEP the strongest, most impactful content from each unique role
- Target ${lengthAnalysis.recommendedBulletCount} total bullet points maximum

BE RUTHLESS - this CV will be rejected due to length alone!
` : ''

  const prompt = `You are a senior recruiter with 15+ years of experience reviewing CVs for top-tier companies. You have seen thousands of CVs and know exactly what makes candidates stand out versus get rejected.${duplicateContext}${lengthContext}

Your job is to provide STRICT, HONEST feedback on this professional experience section. Be ruthless - this person wants to get hired, not have their feelings spared.

CONTEXT:
- Target role: ${jobTitle}
- You're looking for: impact, metrics, specific achievements, strong action verbs
- You HATE: fluff, vague language, passive voice, generic responsibilities, REPETITION

REVIEW CRITERIA:
✓ Does each bullet point show IMPACT and RESULTS?
✓ Are there specific numbers, percentages, or measurable outcomes?
✓ Do they use strong action verbs (Led, Delivered, Achieved, Increased)?
✓ Is the language concise and powerful?
✓ Would this impress a hiring manager in 6 seconds?

PRIMARY TASKS: REDUCE CV LENGTH & FIND DUPLICATES
Your main job is to drastically reduce this CV's length while maintaining impact:

✓ PRIORITIZE DELETION - this CV is too long and needs aggressive cutting
✓ SCAN EVERY bullet point for weak, generic, or vague content
✓ REMOVE exact duplicates and weak/generic content
✓ EVALUATE each role independently - different roles may have completely different responsibilities
✓ DELETE weak/generic statements regardless of role
✓ KEEP the strongest, most impactful content from each unique role
✓ TARGET maximum bullet points as specified above

CRITICAL INSTRUCTIONS FOR IMPROVEMENTS:
- NEVER invent specific numbers, percentages, or metrics that aren't in the original text
- Use descriptive brackets for metrics the user should customize with their real data:
  * Performance: "[percentage increase]" (e.g., 25%), "[percentage decrease]" (e.g., 15%), "[percentage improvement]" (e.g., 40%), "[percentage growth]" (e.g., 120%)
  * Numbers: "[number]" (e.g., 50), "[number of team members]" (e.g., 12), "[number of projects]" (e.g., 8), "[number of clients]" (e.g., 200), "[number of campaigns]" (e.g., 15)
  * Financial: "[revenue amount]" (e.g., $2.5M), "[cost savings]" (e.g., $500K), "[budget amount]" (e.g., $1.2M), "[profit increase]" (e.g., $300K), "[sales volume]" (e.g., $5M)
  * Time: "[time period]" (e.g., 6 months), "[number of months]" (e.g., 18), "[project duration]" (e.g., 3 months), "[delivery timeline]" (e.g., 2 weeks)
  * Results: "[efficiency gain]" (e.g., 30% faster), "[quality improvement]" (e.g., 99.5% accuracy), "[customer satisfaction score]" (e.g., 4.8/5), "[conversion rate]" (e.g., 12%)
- Focus on structural improvements and stronger language
- Only suggest specific numbers if they're already mentioned in the original text
- Provide template-style improvements that the user can customize with their real data

For each bullet point that needs improvement, provide:
1. The exact original text
2. Specific issue: "delete-weak", "delete-generic", "delete-exact-duplicate", "improve-weak", "strengthen"
3. Improved version OR explanation of why to delete
4. Severity: "critical" (delete immediately) or "minor" (consider keeping)
5. duplicateOf: experience index if this is an EXACT duplicate

PRIORITIZE DELETION AND LENGTH REDUCTION OVER MINOR IMPROVEMENTS!

EXPERIENCE TO REVIEW:
${experienceText}

Respond in this JSON format:
{
  "overallScore": 1-10,
  "summary": "Brief overall assessment",
  "improvements": [
    {
      "experienceIndex": 0,
      "originalText": "exact text",
      "issue": "what's wrong with it",
      "improvedText": "better version with descriptive brackets like [percentage increase], [revenue amount], [number of team members], [time period]",
      "severity": "critical|minor",
      "reason": "why this change matters",
      "actionType": "improve|remove|consolidate",
      "duplicateOf": "experience index if this is a duplicate (optional)"
    }
  ]
}`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a strict, experienced recruiter who gives honest feedback to help candidates succeed. Respond only in valid JSON format."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 2000
  })

  return completion.choices[0]?.message?.content
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🚀 Parallel Experience Review API called')
    
    const { experienceData, jobTitle = "Professional" } = body

    if (!experienceData || !Array.isArray(experienceData)) {
      console.error('❌ Invalid experience data:', { experienceData, type: typeof experienceData })
      return NextResponse.json(
        { error: 'Invalid experience data provided' },
        { status: 400 }
      )
    }

    if (experienceData.length === 0) {
      console.error('❌ Empty experience data array')
      return NextResponse.json(
        { error: 'No experience data to review' },
        { status: 400 }
      )
    }

    // Format experience data for AI review
    console.log('🔍 Processing experience data for parallel AI review...')
    const experienceText = experienceData.map((exp, index) => {
      const items = exp.description_items || (exp.description ? exp.description.split('\n').filter((line: string) => line.trim()) : [])
      return `
ROLE ${index + 1}: ${exp.position} at ${exp.company} (${exp.duration})
${items.map((item, i) => `• ${item.trim()}`).join('\n')}
      `.trim()
    }).join('\n\n')

    const startTime = Date.now()
    const openai = getOpenAIClient()

    try {
      console.log('🚀 Starting parallel analysis tasks...')

      // Execute duplicate detection, length analysis, and detailed review in parallel
      const [
        potentialDuplicates,
        lengthAnalysis
      ] = await Promise.all([
        detectDuplicatesWithEmbeddings(openai, experienceData),
        analyzeLengthAndStructure(experienceData)
      ])

      // Create duplicate context
      const duplicateContext = potentialDuplicates.length > 0 ? `

EMBEDDING ANALYSIS FOUND ${potentialDuplicates.length} POTENTIAL DUPLICATES:
${potentialDuplicates.map((dup, i) => `
${i+1}. SIMILARITY: ${dup.similarity}
   Role 1: "${dup.bullet1.text}" (${dup.bullet1.role})
   Role 2: "${dup.bullet2.text}" (${dup.bullet2.role})
`).join('')}

PRIORITIZE REVIEWING THESE HIGH-SIMILARITY PAIRS FIRST!
` : ''

      console.log('📊 Parallel analysis results:', {
        duplicatesFound: potentialDuplicates.length,
        totalBulletPoints: lengthAnalysis.totalBulletPoints,
        estimatedPages: lengthAnalysis.estimatedPages,
        reductionNeeded: lengthAnalysis.reductionNeeded
      })

      // Perform detailed review with all context
      const responseText = await performDetailedReview(
        openai, 
        experienceText, 
        lengthAnalysis, 
        duplicateContext, 
        jobTitle
      )

      if (!responseText) {
        throw new Error('No response from OpenAI')
      }

      let aiReview
      try {
        console.log('🤖 Raw AI Response:', responseText)
        aiReview = JSON.parse(responseText)
        
        if (!aiReview.improvements || !Array.isArray(aiReview.improvements)) {
          console.error('❌ AI response missing improvements array:', aiReview)
          throw new Error('AI response missing required improvements array')
        }
        
        console.log('✅ Successfully parsed AI response with', aiReview.improvements.length, 'improvements')
        
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:')
        console.error('Parse error:', parseError instanceof Error ? parseError.message : String(parseError))
        console.error('Raw response (first 1000 chars):', responseText.substring(0, 1000))
        throw new Error(`Invalid AI response format: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
      }

      const totalTime = Date.now() - startTime
      console.log(`🎯 Total parallel experience review time: ${totalTime}ms`)

      return NextResponse.json({
        success: true,
        review: aiReview,
        processing_time_ms: totalTime,
        parallel_analysis: {
          duplicates_found: potentialDuplicates.length,
          total_bullet_points: lengthAnalysis.totalBulletPoints,
          estimated_pages: lengthAnalysis.estimatedPages,
          reduction_needed: lengthAnalysis.reductionNeeded
        }
      })

    } catch (embeddingError) {
      console.error('❌ Parallel analysis failed, falling back to basic review:', embeddingError)
      
      // Fallback to basic analysis without embeddings
      const lengthAnalysis = await analyzeLengthAndStructure(experienceData)
      const responseText = await performDetailedReview(openai, experienceText, lengthAnalysis, '', jobTitle)
      
      if (!responseText) {
        throw new Error('No response from OpenAI')
      }

      const aiReview = JSON.parse(responseText)
      const totalTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        review: aiReview,
        processing_time_ms: totalTime,
        fallback_mode: true
      })
    }

  } catch (error) {
    console.error('Parallel experience review error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to review experience',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}