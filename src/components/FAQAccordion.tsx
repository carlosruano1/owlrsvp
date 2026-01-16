'use client'

import { useState } from 'react'
import { FAQ } from '@/lib/faqData'

interface FAQAccordionProps {
  faqs: FAQ[];
  defaultOpen?: number;
  showCategory?: boolean;
  className?: string;
}

export default function FAQAccordion({ 
  faqs, 
  defaultOpen = -1,
  showCategory = false,
  className = '' 
}: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number>(defaultOpen)

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? -1 : index))
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {faqs.map((faq, index) => (
        <article 
          key={`${faq.question}-${index}`} 
          className="rounded-xl bg-black/20 border border-white/10 overflow-hidden transition-all hover:border-white/20"
        >
          <button
            type="button"
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between px-5 py-4 text-left group"
            aria-expanded={openIndex === index}
          >
            <div className="flex-1 pr-4">
              {showCategory && (
                <span className="text-xs text-cyan-400/70 uppercase tracking-wide mb-1 block">
                  {faq.category.replace('-', ' ')}
                </span>
              )}
              <span className="font-medium text-white group-hover:text-cyan-300 transition-colors">
                {faq.question}
              </span>
            </div>
            <span className="text-cyan-400 text-2xl font-light shrink-0 transition-transform duration-200">
              {openIndex === index ? '−' : '+'}
            </span>
          </button>
          {openIndex === index && (
            <div className="px-5 pb-4 text-white/80 leading-relaxed animate-fadeIn">
              <p className="whitespace-pre-line">{faq.answer}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
