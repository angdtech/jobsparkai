import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file_path, session_id, job_description = "" } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    let filePath = file_path
    
    // Always look up the session and find the actual file
    const { CVSessionManager } = await import('@/lib/database')
    const session = await CVSessionManager.getSession(session_id)
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    console.log('Session data:', session)
    
    // Always search for the file in uploads directory using session ID
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'cvs')
    console.log('Looking for files in:', uploadsDir)
    console.log('Session ID:', session_id)
    
    if (!existsSync(uploadsDir)) {
      return NextResponse.json({ error: 'Uploads directory not found' }, { status: 500 })
    }
    
    const { readdirSync } = await import('fs')
    const files = readdirSync(uploadsDir)
    console.log('All files in uploads:', files)
    
    // Try exact session match first, then partial match
    let sessionFiles = files.filter(f => f.startsWith(session_id))
    
    // If no exact match, try to find files that contain the session ID
    if (sessionFiles.length === 0) {
      console.log('No exact session match, trying partial match...')
      sessionFiles = files.filter(f => f.includes(session_id))
    }
    
    console.log('Files matching session ID:', sessionFiles)
    
    if (sessionFiles.length === 0) {
      return NextResponse.json({ 
        error: 'No file found for this session',
        session_id,
        searched_in: uploadsDir,
        available_files: files,
        debug: {
          exact_match_attempted: files.filter(f => f.startsWith(session_id)),
          partial_match_attempted: files.filter(f => f.includes(session_id))
        }
      }, { status: 404 })
    }
    
    // Use the most recent file (highest timestamp)
    const latestFile = sessionFiles.sort().pop()
    filePath = path.join(uploadsDir, latestFile)
    console.log(`Using file: ${latestFile} (full path: ${filePath})`)

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Path to Python script
    const pythonScriptPath = path.join(process.cwd(), 'python', 'cv_parser.py')
    
    if (!existsSync(pythonScriptPath)) {
      return NextResponse.json({ error: 'Python parser not found' }, { status: 500 })
    }

    console.log('Running Python CV parser...')
    console.log('File path:', filePath)
    console.log('Job description:', job_description ? 'provided' : 'not provided')

    // Run Python script
    const result = await runPythonParser(pythonScriptPath, filePath, job_description)

    if (result.error) {
      console.error('Python parser error:', result.error)
      return NextResponse.json({ 
        error: 'CV analysis failed', 
        details: result.error 
      }, { status: 500 })
    }

    console.log('Python analysis completed successfully')
    
    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('CV extraction error:', error)
    return NextResponse.json({ 
      error: 'Failed to process CV',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function runPythonParser(scriptPath: string, filePath: string, jobDescription: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python3'
    const args = [scriptPath, filePath]
    
    if (jobDescription) {
      args.push(jobDescription)
    }

    console.log('Executing:', pythonPath, args.join(' '))

    const python = spawn(pythonPath, args)
    let stdout = ''
    let stderr = ''

    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process exited with code:', code)
        console.error('Python stderr:', stderr)
        resolve({ 
          error: `Python parser failed (exit code: ${code})`,
          stderr: stderr 
        })
        return
      }

      try {
        // Parse JSON output from Python script
        const result = JSON.parse(stdout)
        resolve(result)
      } catch (parseError) {
        console.error('Failed to parse Python output:', stdout)
        console.error('Parse error:', parseError)
        resolve({ 
          error: 'Failed to parse analysis results',
          raw_output: stdout,
          stderr: stderr
        })
      }
    })

    python.on('error', (error) => {
      console.error('Python process error:', error)
      resolve({ 
        error: `Failed to start Python parser: ${error.message}` 
      })
    })

    // Set timeout (5 minutes)
    setTimeout(() => {
      python.kill('SIGTERM')
      resolve({ 
        error: 'Python parser timed out after 5 minutes' 
      })
    }, 5 * 60 * 1000)
  })
}