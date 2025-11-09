'use client'

import React from 'react'
import { Heart, Users, Sparkles, TrendingUp } from 'lucide-react'

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
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4 text-red-400" />
            <span>Family-Run Business</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About Us
          </h2>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/20">
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-6">
              The job industry is very bad at the moment, and we decided to shake up the industry by offering 
              <span className="font-semibold text-orange-400"> low-cost access to CV editing functionality</span>, 
              giving you the help you want.
            </p>
            
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              We're a <span className="font-semibold text-white">bespoke, family-run platform</span> dedicated to helping job seekers 
              stand out in a competitive market. Our mission is to make professional CV optimization accessible to everyone, 
              not just those who can afford expensive career coaching services.
            </p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Family-Run</h3>
                <p className="text-white/70 text-sm">Built with care and dedication</p>
              </div>
              
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <Sparkles className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Bespoke Platform</h3>
                <p className="text-white/70 text-sm">Custom-built for your needs</p>
              </div>
              
              <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Always Improving</h3>
                <p className="text-white/70 text-sm">New features on the way</p>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-center">
              <p className="text-white/90 text-lg font-medium">
                We're working on adding more templates and features soon. Watch this space!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
