'use client'

import { useState, useMemo } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import FAQAccordion from '@/components/FAQAccordion'
import Link from 'next/link'
import { ALL_FAQS, FAQ_CATEGORIES, FAQ } from '@/lib/faqData'

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = ALL_FAQS

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(faq => faq.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [searchQuery, selectedCategory])

  // Generate FAQ schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL_FAQS.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <>
      {/* FAQ Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Navigation />

        <main className="flex-1 px-6 py-24">
          <section className="max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <header className="text-center space-y-4">
              <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs">FAQ</p>
              <h1 className="text-4xl md:text-5xl font-light">Frequently Asked Questions</h1>
              <p className="text-white/70 max-w-2xl mx-auto">
                Find answers to common questions about OwlRSVP. Can't find what you're looking for?{' '}
                <Link href="/support" className="text-cyan-400 hover:text-cyan-300 underline">
                  Contact our support team
                </Link>
                .
              </p>
            </header>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                All Categories
              </button>
              {Object.entries(FAQ_CATEGORIES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === key
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Results Count */}
            {filteredFAQs.length > 0 && (
              <p className="text-center text-white/60 text-sm">
                Showing {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'}
                {selectedCategory && ` in ${FAQ_CATEGORIES[selectedCategory as keyof typeof FAQ_CATEGORIES]}`}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            )}

            {/* FAQ List */}
            {filteredFAQs.length > 0 ? (
              <div className="space-y-4">
                {selectedCategory ? (
                  // Show single category
                  <FAQAccordion 
                    faqs={filteredFAQs}
                    defaultOpen={-1}
                    showCategory={false}
                  />
                ) : (
                  // Show all categories grouped
                  Object.entries(FAQ_CATEGORIES).map(([categoryKey, categoryLabel]) => {
                    const categoryFAQs = filteredFAQs.filter(faq => faq.category === categoryKey)
                    if (categoryFAQs.length === 0) return null

                    return (
                      <div key={categoryKey} className="space-y-4">
                        <h2 className="text-2xl font-light text-white mt-8 mb-4 border-b border-white/10 pb-2">
                          {categoryLabel}
                        </h2>
                        <FAQAccordion 
                          faqs={categoryFAQs}
                          defaultOpen={-1}
                          showCategory={false}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-white/60 text-lg mb-4">No FAQs found matching your search.</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-16 rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
              <h2 className="text-2xl font-light mb-4">Still have questions?</h2>
              <p className="text-white/70 mb-6">
                Our support team is here to help. Get in touch and we'll respond within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/support"
                  className="inline-flex items-center justify-center px-6 py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                >
                  Send a Message
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}
