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
    
    // If no file_path provided, look it up from the session
    if (!filePath) {
      const { CVSessionManager } = await import('@/lib/database')
      const session = await CVSessionManager.getSession(session_id)
      
      if (!session || !session.file_name) {
        return NextResponse.json({ error: 'Session not found or no file uploaded' }, { status: 404 })
      }
      
      // Use stored file_path from session, or construct it if not available
      if (session.file_path) {
        filePath = session.file_path
      } else {
        // Fallback: construct file path from session data
        const timestamp = session.created_at ? new Date(session.created_at).getTime() : Date.now()
        const fileExtension = path.extname(session.file_name)
        const fileName = `${session_id}-${timestamp}${fileExtension}`
        filePath = path.join(process.cwd(), 'public', 'uploads', 'cvs', fileName)
      }
    }

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