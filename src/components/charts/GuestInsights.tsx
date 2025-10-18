'use client'

import React from 'react';

interface GuestInsightsProps {
  totalAttending: number;
  totalGuests: number;
  responseRate: string;
  plusOnes: number;
  plusOnesAverage: number | string;
  predictedAttendance: number;
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'urgent';
    message: string;
  }>;
}

const GuestInsights: React.FC<GuestInsightsProps> = ({
  totalAttending,
  totalGuests,
  responseRate,
  plusOnes,
  plusOnesAverage,
  predictedAttendance,
  insights
}) => {
  // Format plus ones text
  const plusOnesText = plusOnes > 0 
    ? `${plusOnes} guests bringing +1s (avg. ${plusOnesAverage} each)`
    : 'No guests bringing +1s';

  // Get icon for insight type
  const getInsightIcon = (type: string) => {
    switch(type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'urgent':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Get background color for insight type
  const getInsightColor = (type: string) => {
    switch(type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'urgent':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-sm text-white/60 mb-1">Attending</div>
          <div className="text-2xl font-bold text-green-400">{totalAttending}</div>
        </div>
        
        <div className="glass-card rounded-xl p-4">
          <div className="text-sm text-white/60 mb-1">Total w/ Guests</div>
          <div className="text-2xl font-bold text-blue-400">{totalGuests}</div>
        </div>
        
        <div className="glass-card rounded-xl p-4">
          <div className="text-sm text-white/60 mb-1">Response Rate</div>
          <div className="text-2xl font-bold text-purple-400">{responseRate}%</div>
        </div>
        
        <div className="glass-card rounded-xl p-4">
          <div className="text-sm text-white/60 mb-1">Predicted</div>
          <div className="text-2xl font-bold text-yellow-400">{predictedAttendance}</div>
        </div>
      </div>

      {/* Plus ones insight */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-medium text-white mb-1">Plus One Analysis</div>
            <div className="text-white/70">{plusOnesText}</div>
          </div>
        </div>
      </div>

      {/* AI-driven insights */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">Smart Insights</h3>
        
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-xl border ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="text-white/80">
                    {insight.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border bg-gray-500/10 border-gray-500/30 text-white/70 text-center">
            No insights available yet. More data is needed.
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestInsights;

