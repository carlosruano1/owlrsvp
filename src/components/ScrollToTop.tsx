'use client';

import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      
      // Show button after scrolling down 400px
      setIsVisible(scrolled > 400);
      
      // Calculate scroll progress (0-100)
      const progress = (scrolled / (fullHeight - windowHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  const circumference = 2 * Math.PI * 24;
  const dashOffset = circumference * (1 - scrollProgress / 100);

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[60] group"
      aria-label="Scroll to top"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Container with backdrop blur */}
      <div className="relative w-12 h-12 md:w-14 md:h-14">
        {/* Background circle with blur */}
        <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-md border border-white/10" />
        
        {/* SVG Progress ring */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90 transform transition-transform duration-300 group-hover:scale-110" 
          viewBox="0 0 56 56"
        >
          {/* Progress ring */}
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="url(#scrollGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-150"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Arrow icon in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg 
            className="w-4 h-4 md:w-5 md:h-5 text-white transition-transform duration-300 group-hover:-translate-y-0.5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M5 10l7-7 7 7M12 3v18" 
            />
          </svg>
        </div>
        
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125" />
      </div>
    </button>
  );
}

