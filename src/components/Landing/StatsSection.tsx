'use client'

import React from 'react'
import { TrendingUp, Users, Clock, Award, Star, CheckCircle } from 'lucide-react'

interface StatsSectionProps {
  onGetStarted?: () => void
}

const stats = [
  {
    icon: <Users className="h-8 w-8" />,
    number: "Thousands",
    label: "Resumes Optimized",
    description: "Professionals trust JobSpark AI",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    number: "98%",
    label: "Satisfaction Rate",
    description: "Users report improved resumes",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: <Clock className="h-8 w-8" />,
    number: "<1 Min",
    label: "Analysis Time",
    description: "Lightning-fast AI processing",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: <Award className="h-8 w-8" />,
    number: "AI-Powered",
    label: "Smart Analysis",
    description: "Advanced AI optimization",
    color: "from-green-500 to-emerald-500"
  }
]

const testimonials = [
  {
    name: "Zara B.",
    role: "Technology Professional",
    content: "The AI suggestions were incredibly helpful and the interface made editing so easy. Updated my entire resume in under 10 minutes!",
    rating: 5,
    avatar: "ZB"
  },
  {
    name: "Michael R.",
    role: "Marketing Professional",
    content: "Love how intuitive the platform is. The AI feedback was spot-on and helped me create a much more professional resume.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Emily J.",
    role: "Data Professional",
    content: "Best resume tool I've used. The editing experience is smooth and the AI recommendations really improved my content quality.",
    rating: 5,
    avatar: "EJ"
  }
]

export default function StatsSection({ onGetStarted }: StatsSectionProps) {
  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${stat.color} text-white mb-6`}>
                {stat.icon}
              </div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                {stat.number}
              </div>
              <div className="text-xl font-semibold text-gray-800 mb-2">
                {stat.label}
              </div>
              <div className="text-gray-600">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Success Stories from{' '}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Real Users
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of professionals who transformed their careers with AI-optimized resumes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed">
                {testimonial.content} - {testimonial.name}, {testimonial.role}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Join Our Success Stories?
            </h3>
            <p className="text-xl text-gray-600 mb-6">
              Start optimizing your resume today and see immediate improvements
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button onClick={onGetStarted} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105">
                Get Started
              </button>
              <div className="text-sm text-gray-500">
                Lightning-fast analysis • Instant results
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}