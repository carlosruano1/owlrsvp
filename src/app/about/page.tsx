'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function About() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Refs for scroll reveal animations
  const sectionRefs = {
    story: useRef<HTMLDivElement>(null),
    mission: useRef<HTMLDivElement>(null),
    journey: useRef<HTMLDivElement>(null),
    philosophy: useRef<HTMLDivElement>(null)
  }
  
  useEffect(() => {
    setIsLoaded(true)
    
    // Set up intersection observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)
    
    // Observe all section refs
    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })
    
    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Simple dark background with subtle spotlight */}
      <div className="absolute inset-0 bg-gray-900" />
      <div className="spotlight" />
      
      {/* Navigation */}
      <Navigation />
      
      <div className={`relative z-10 min-h-screen transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Simple Hero Section with Personal Touch */}
        <div className="flex items-center justify-center min-h-[50vh] p-6 pt-24">
          <div className="w-full max-w-3xl text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-20 h-20">
                <Image 
                  src="/images/owlrsvp_logo_png.png"
                  alt="OwlRSVP Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 tracking-tight text-white">
              The Story Behind <span className="text-blue-400">OwlRSVP</span>
            </h1>
            
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-white/80 mb-6">
                Great solutions often arise from professional challenges. This is the story of how a wealth manager's 
                need for a better client event RSVP system led to creating a tool that transforms how people connect.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Personal Story */}
        <div className="py-12 px-6">
          <div className="max-w-3xl mx-auto space-y-16">
            
            {/* Founder's Story */}
            <div 
              ref={sectionRefs.story}
              className="animate-reveal"
            >
              <div className="glass-card rounded-xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Meet Carlos</h2>
                
                <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-4xl text-white/80 font-bold">
                      C
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-white/80 leading-relaxed mb-4">
                      OwlRSVP was founded by Carlos, an immigrant from Spain who now calls Texas home. His journey 
                      took him from the halls of St. Bonaventure University in New York to earning his MBA from UNC-Chapel Hill.
                    </p>
                    
                    <p className="text-white/80 leading-relaxed">
                      By day, Carlos works as a wealth manager in Central Texas, helping others secure their financial futures. 
                      But his passion for problem-solving extends far beyond finance.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-white/60 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Spain → USA
                  </span>
                  <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                    MBA, UNC-Chapel Hill
                  </span>
                  <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Wealth Manager
                  </span>
                </div>
              </div>
            </div>

            {/* The Inspiration */}
            <div 
              ref={sectionRefs.mission}
              className="animate-reveal"
            >
              <div className="glass-card rounded-xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">The Inspiration</h2>
                
                <p className="text-white/80 leading-relaxed mb-6">
                  OwlRSVP was born from a real professional need. While organizing a client appreciation event 
                  for his wealth management practice, Carlos encountered a frustrating gap in the available tools.
                </p>
                
                <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
                  <p className="text-white/90 italic">
                    "We wanted to create a seamless experience for our clients, but couldn't find a tool where 
                    everyone could simply scan a QR code and RSVP super fast. The existing solutions were either 
                    too complicated or didn't have the professional look we needed for client-facing events."
                  </p>
                  <p className="text-right text-white/60 text-sm mt-2">— Carlos, Founder</p>
                </div>
                
                <p className="text-white/80 leading-relaxed">
                  Rather than settling for subpar options, Carlos decided to create the solution himself. 
                  What began as a tool for professional client events quickly revealed its value across many 
                  scenarios—from corporate gatherings and conferences to weddings and social events—anywhere 
                  a streamlined, professional RSVP system was needed.
                </p>
              </div>
            </div>

            {/* The Journey */}
            <div 
              ref={sectionRefs.journey}
              className="animate-reveal"
            >
              <div className="glass-card rounded-xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">The Journey</h2>
                
                <div className="relative pl-6 border-l border-white/20 space-y-8 mb-6">
                  <div>
                    <div className="absolute -left-2 top-2 w-3 h-3 bg-blue-400 rounded-full"></div>
                    <h3 className="text-lg font-medium text-blue-400 mb-2">The Problem</h3>
                    <p className="text-white/80">
                      Client appreciation events required a professional, frictionless RSVP system. Existing solutions 
                      were either too complex for guests or lacked the speed and elegance a financial professional needed.
                    </p>
                  </div>
                  
                  <div>
                    <div className="absolute -left-2 top-2 w-3 h-3 bg-purple-400 rounded-full"></div>
                    <h3 className="text-lg font-medium text-purple-400 mb-2">The Solution</h3>
                    <p className="text-white/80">
                      A QR code-based RSVP system that prioritized speed and simplicity. Drawing on his finance background, 
                      Carlos designed a platform that was both professional enough for client-facing events and 
                      intuitive enough for anyone to use.
                    </p>
                  </div>
                  
                  <div>
                    <div className="absolute -left-2 top-2 w-3 h-3 bg-green-400 rounded-full"></div>
                    <h3 className="text-lg font-medium text-green-400 mb-2">The Launch</h3>
                    <p className="text-white/80">
                      After successfully using the platform for his own client events, Carlos received requests from 
                      colleagues and other professionals who wanted to use it. This organic demand convinced him to 
                      develop OwlRSVP into a full-featured product.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Did You Know?</h4>
                      <p className="text-white/60 text-sm">
                        The QR code feature was the very first functionality Carlos built, as it was the 
                        critical element missing from other platforms that would make client event RSVPs truly seamless.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Philosophy */}
            <div 
              ref={sectionRefs.philosophy}
              className="animate-reveal"
            >
              <div className="glass-card rounded-xl p-8 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Personal Philosophy</h2>
                
                <p className="text-white/80 leading-relaxed mb-6">
                  Carlos's approach to building OwlRSVP reflects his broader life philosophy: identify 
                  problems you personally face, create elegant solutions, and share them with others 
                  who might benefit.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 p-5 rounded-lg border border-white/10">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Client Experience First
                    </h3>
                    <p className="text-white/70 text-sm">
                      "In wealth management, every touchpoint with clients matters. I wanted an RSVP system 
                      that reflected the same level of professionalism and attention to detail that I bring to 
                      financial planning."
                    </p>
                  </div>
                  
                  <div className="bg-white/5 p-5 rounded-lg border border-white/10">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Speed and Simplicity
                    </h3>
                    <p className="text-white/70 text-sm">
                      "The QR code had to work instantly. If clients had to jump through hoops to RSVP, 
                      the tool would defeat its own purpose. Every extra click reduces response rates."
                    </p>
                  </div>
                </div>
                
                <p className="text-white/80 leading-relaxed">
                  When he's not improving OwlRSVP or managing client portfolios, Carlos can be found watching soccer matches, 
                  exploring the Texas Hill Country, or brainstorming solutions to professional challenges. His immigrant journey 
                  and financial background have given him a unique perspective on creating tools that truly serve people's needs—a 
                  philosophy that drives OwlRSVP's continued development.
                </p>
              </div>
            </div>

            {/* Simple Call to Action */}
            <div className="glass-card rounded-xl p-8 text-center animate-reveal border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Join the Journey</h2>
              <p className="text-lg text-white/80 mb-6 max-w-xl mx-auto">
                What began as a solution for client appreciation events has evolved into a platform 
                that helps professionals across industries create seamless RSVP experiences with just a QR code scan.
              </p>
              <button
                onClick={() => router.push('/create')}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
              >
                Create Your First Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}