'use client'

import React from 'react'
import { TrendingUp, Users, Clock, Award, Star, CheckCircle } from 'lucide-react'

const stats = [
  {
    icon: <Users className="h-8 w-8" />,
    number: "10,000+",
    label: "Resumes Optimized",
    description: "Professionals trust JobSpark AI",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    number: "5X",
    label: "More Interviews",
    description: "Average increase in interview calls",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: <Clock className="h-8 w-8" />,
    number: "2 Min",
    label: "Analysis Time",
    description: "Lightning-fast AI processing",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: <Award className="h-8 w-8" />,
    number: "98%",
    label: "ATS Pass Rate",
    description: "Successfully parse tracking systems",
    color: "from-orange-500 to-red-500"
  }
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Google",
    content: "JobSpark AI helped me land my dream job at Google. The ATS optimization was game-changing!",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Michael Rodriguez",
    role: "Marketing Manager",
    company: "Microsoft",
    content: "Increased my interview rate by 400%. The AI suggestions were spot-on and professional.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Emily Johnson",
    role: "Data Scientist",
    company: "Amazon",
    content: "The real-time scoring helped me optimize every section. Got hired within 3 weeks!",
    rating: 5,
    avatar: "EJ"
  }
]

export default function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
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
              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>

              {/* Verification Badge */}
              <div className="flex items-center space-x-2 mt-4 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Verified success story</span>
              </div>
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
              Start your free resume analysis today and see immediate improvements
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105">
                Start Free Analysis
              </button>
              <div className="text-sm text-gray-500">
                ✓ No signup required ✓ 2-minute analysis ✓ Instant results
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}