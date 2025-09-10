'use client'

import React, { useState } from 'react'
import { FileText, Eye, Download } from 'lucide-react'

interface CVViewerProps {
  fileName: string
  fileUrl: string
  fileType: string
  extractedText?: string
}

export default function CVViewer({ fileName, fileUrl, fileType, extractedText }: CVViewerProps) {
  const [showRawText, setShowRawText] = useState(false)

  const isPDF = fileType === 'application/pdf'
  const isImage = fileType.startsWith('image/')
  const isText = fileType === 'text/plain'

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">CV Preview</h2>
            <p className="text-sm text-gray-600">{fileName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {extractedText && (
            <button
              onClick={() => setShowRawText(!showRawText)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                showRawText 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-1" />
              {showRawText ? 'Hide Text' : 'Show Text'}
            </button>
          )}
          <a
            href={fileUrl}
            download={fileName}
            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4 inline mr-1" />
            Download
          </a>
        </div>
      </div>

      {/* File Preview */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {isPDF && (
          <div className="bg-gray-50 p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">PDF File</h3>
            <p className="text-gray-600 mb-4">PDF preview not available. Use the download button to view the file.</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              Open PDF
            </a>
          </div>
        )}

        {isImage && (
          <div className="p-4">
            <img 
              src={fileUrl} 
              alt={fileName}
              className="max-w-full h-auto mx-auto"
            />
          </div>
        )}

        {isText && !showRawText && (
          <div className="bg-gray-50 p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Text File</h3>
            <p className="text-gray-600 mb-4">Click "Show Text" to view the content</p>
          </div>
        )}

        {/* Raw Text Display */}
        {showRawText && extractedText && (
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-800">Extracted Text Content</h4>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                {extractedText}
              </pre>
            </div>
          </div>
        )}

        {/* Default fallback */}
        {!isPDF && !isImage && !isText && !showRawText && (
          <div className="bg-gray-50 p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">File Preview</h3>
            <p className="text-gray-600 mb-2">Preview not available for this file type</p>
            <p className="text-sm text-gray-500">File type: {fileType}</p>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">File Name:</span>
            <p className="font-medium text-gray-800 truncate">{fileName}</p>
          </div>
          <div>
            <span className="text-gray-600">File Type:</span>
            <p className="font-medium text-gray-800">{fileType}</p>
          </div>
          {extractedText && (
            <>
              <div>
                <span className="text-gray-600">Text Length:</span>
                <p className="font-medium text-gray-800">{extractedText.length} chars</p>
              </div>
              <div>
                <span className="text-gray-600">Word Count:</span>
                <p className="font-medium text-gray-800">{extractedText.split(/\s+/).length} words</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}