'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface CVUploadProps {
  onFileUploaded: (file: File, extractedData: any) => void
  sessionId: string
}

export default function CVUpload({ onFileUploaded, sessionId }: CVUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('cv_file', file)
      formData.append('session_id', sessionId)

      // Upload file to our API
      const uploadResponse = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Upload failed:', uploadResponse.status, errorText)
        throw new Error(`Failed to upload file: ${uploadResponse.status} - ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()

      // Extract text content from the uploaded CV
      const extractResponse = await fetch('/api/cv/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: uploadResult.file_path,
          session_id: sessionId,
        }),
      })

      if (!extractResponse.ok) {
        throw new Error('Failed to extract CV content')
      }

      const extractedData = await extractResponse.json()

      setSuccess(`Successfully uploaded ${file.name}`)
      onFileUploaded(file, extractedData)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [sessionId, onFileUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Uploading and analyzing your CV...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Drop your CV here' : 'Upload your CV'}
                </p>
                <p className="text-sm text-gray-500">
                  Drag & drop your CV file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supports PDF, DOC, DOCX, TXT files (max 10MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Upload Failed</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Upload Successful</p>
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        </div>
      )}
    </div>
  )
}