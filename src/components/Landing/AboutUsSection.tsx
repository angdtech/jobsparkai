'use client'

import React from 'react'

export default function AboutUsSection() {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About Us
          </h2>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/20">
            <p className="text-lg text-white leading-relaxed mb-6">
              The job industry is very bad at the moment, and we decided to shake up the industry by offering low-cost access to CV editing functionality, giving you the help you want.
            </p>
            
            <p className="text-lg text-white leading-relaxed mb-6">
              We're a bespoke, family-run platform dedicated to helping job seekers stand out in a competitive market. Our mission is to make professional CV optimization accessible to everyone, not just those who can afford expensive career coaching services.
            </p>

            <p className="text-lg text-white leading-relaxed">
              We're working on adding more templates and features soon. Watch this space!
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
