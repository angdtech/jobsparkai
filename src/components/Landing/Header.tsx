'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X, Zap, LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  onLogin: () => void
  onSignUp: () => void
}

export default function Header({ onLogin, onSignUp }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '#testimonials', label: 'Reviews' },
    { href: '#about', label: 'About' }
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className={`text-2xl font-bold ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}>
              JobSpark AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors hover:text-orange-500 ${
                  isScrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <button
                  onClick={onLogin}
                  className={`font-medium py-2 px-4 rounded-full transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-orange-500'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  <LogIn className="h-4 w-4 inline mr-2" />
                  Log In
                </button>
                <button
                  onClick={onSignUp}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  <UserPlus className="h-4 w-4 inline mr-2" />
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${
              isScrolled ? 'text-gray-700' : 'text-white'
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100">
            <div className="py-4 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-gray-700 font-medium hover:text-orange-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="block w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium py-3 px-6 rounded-full text-center"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={onLogin}
                      className="block w-full text-gray-700 font-medium py-3 px-6 border border-gray-300 rounded-full hover:border-orange-500 hover:text-orange-500 transition-colors"
                    >
                      <LogIn className="h-4 w-4 inline mr-2" />
                      Log In
                    </button>
                    <button
                      onClick={onSignUp}
                      className="block w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium py-3 px-6 rounded-full"
                    >
                      <UserPlus className="h-4 w-4 inline mr-2" />
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}