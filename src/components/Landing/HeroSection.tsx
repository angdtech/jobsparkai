'use client'

import React, { useState } from 'react'
import { ArrowRight, Zap, Star, Users, Upload, FileText, CheckCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

interface HeroSectionProps {
  onGetStarted: () => void
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState(0)
  const router = useRouter()

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setUploadStep(1)

    try {
      // Step 1: Create session in database first
      setUploadStep(1)
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      
      // Create session in database
      const createSessionResponse = await fetch('/api/cv/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          file_name: file.name
        })
      })
      
      if (!createSessionResponse.ok) {
        throw new Error('Failed to create session')
      }
      
      // Create form data with correct field names
      const formData = new FormData()
      formData.append('cv_file', file)
      formData.append('session_id', sessionId)
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Visual delay
      
      const uploadResponse = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()

      // Step 2: Extract content using real Python extraction
      setUploadStep(2)
      const extractResponse = await fetch('/api/cv/extract-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      })

      if (!extractResponse.ok) {
        throw new Error('Failed to extract CV content')
      }

      const extractResult = await extractResponse.json()
      console.log('Extraction completed:', extractResult.success)
      
      // Step 3: Analyze 
      setUploadStep(3)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Redirect to analysis results
      router.push(`/cv/${sessionId}`)
      
    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      setUploadStep(0)
      alert('Upload failed. Please try again.')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isUploading
  })
  if (isUploading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
        
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/20">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                {uploadStep === 1 && <Upload className="h-8 w-8 text-white animate-bounce" />}
                {uploadStep === 2 && <FileText className="h-8 w-8 text-white animate-pulse" />}
                {uploadStep === 3 && <Zap className="h-8 w-8 text-white animate-spin" />}
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                {uploadStep === 1 && "Uploading Your Resume..."}
                {uploadStep === 2 && "Reading Your Resume..."}
                {uploadStep === 3 && "Analyzing for Issues..."}
              </h2>
              
              <p className="text-white/80 mb-8">
                {uploadStep === 1 && "Securely uploading your file"}
                {uploadStep === 2 && "Extracting text and formatting details"}
                {uploadStep === 3 && "AI is finding critical issues that cost you interviews"}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(uploadStep / 3) * 100}%` }}
              ></div>
            </div>
            
            <p className="text-white/60 text-sm">
              Step {uploadStep} of 3 • Please don't close this page
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-400 rounded-full filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Trust Indicators */}
        <div className="flex items-center justify-center space-x-6 mb-8 text-white/80">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">10,000+ users</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm">5X more interviews</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm">2-minute analysis</span>
          </div>
        </div>

        {/* Main Heading - NEW VALUE-FOCUSED */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Get 5X More Job Interviews
        </h1>

        {/* Subheading - CLEARER PROCESS */}
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
          Upload your resume → See what's wrong → Fix it in 2 minutes
        </p>

        {/* UPLOAD ZONE - MAIN CTA */}
        <div className="max-w-2xl mx-auto mb-12">
          <div 
            {...getRootProps()}
            className={`border-2 border-dashed border-white/30 rounded-3xl p-12 transition-all duration-300 cursor-pointer hover:border-white/50 hover:bg-white/5 ${
              isDragActive ? 'border-orange-400 bg-orange-400/10' : ''
            }`}
          >
            <input {...getInputProps()} />
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                {isDragActive ? 'Drop your resume here!' : 'Drop Your Resume Here'}
              </h3>
              
              <p className="text-white/80 mb-6">
                PDF or Word document • Free analysis in 2 minutes
              </p>
              
              <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105">
                Choose File
              </button>
              
              <p className="text-white/60 text-sm mt-4">
                ✓ No signup required ✓ Secure & private ✓ Instant results
              </p>
            </div>
          </div>
        </div>

        {/* Quick Preview of Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-white/80">
          <div className="text-center">
            <div className="text-3xl mb-2">📄</div>
            <div className="font-semibold">Upload Resume</div>
            <div className="text-sm">Takes 30 seconds</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-semibold">See Critical Issues</div>
            <div className="text-sm">AI finds problems in 2 minutes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-semibold">Get Fixes & Templates</div>
            <div className="text-sm">Download improved version</div>
          </div>
        </div>
      </div>
    </section>
  )
}