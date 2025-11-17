'use client'

import React from 'react';

interface ComparisonMetrics {
  totalInvited: number;
  totalAttending: number;
  totalDeclined: number;
  totalGuests: number;
  totalAttendance: number;
  responseRate: string;
  responseVelocity: string;
  averageResponseTime: number | null;
}

interface EventComparisonDetailProps {
  currentEvent: {
    title: string;
    metrics: ComparisonMetrics;
  };
  compareEvent: {
    title: string;
    eventDate: string | null;
    metrics: ComparisonMetrics;
  };
}

const EventComparisonDetail: React.FC<EventComparisonDetailProps> = ({
  currentEvent,
  compareEvent
}) => {
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const attendanceGrowth = calculateGrowth(
    currentEvent.metrics.totalAttendance,
    compareEvent.metrics.totalAttendance
  );

  const responseRateGrowth = calculateGrowth(
    parseFloat(currentEvent.metrics.responseRate),
    parseFloat(compareEvent.metrics.responseRate)
  );

  const velocityGrowth = calculateGrowth(
    parseFloat(currentEvent.metrics.responseVelocity),
    parseFloat(compareEvent.metrics.responseVelocity)
  );

  const invitedGrowth = calculateGrowth(
    currentEvent.metrics.totalInvited,
    compareEvent.metrics.totalInvited
  );

  const metrics = [
    {
      label: 'Total Invited',
      current: currentEvent.metrics.totalInvited,
      compare: compareEvent.metrics.totalInvited,
      growth: invitedGrowth,
      format: (val: number) => val.toString()
    },
    {
      label: 'Total Attendance',
      current: currentEvent.metrics.totalAttendance,
      compare: compareEvent.metrics.totalAttendance,
      growth: attendanceGrowth,
      format: (val: number) => val.toString(),
      highlight: true
    },
    {
      label: 'Response Rate',
      current: parseFloat(currentEvent.metrics.responseRate),
      compare: parseFloat(compareEvent.metrics.responseRate),
      growth: responseRateGrowth,
      format: (val: number) => `${val.toFixed(1)}%`
    },
    {
      label: 'Response Velocity',
      current: parseFloat(currentEvent.metrics.responseVelocity),
      compare: parseFloat(compareEvent.metrics.responseVelocity),
      growth: velocityGrowth,
      format: (val: number) => `${val.toFixed(1)} responses/day`
    },
    {
      label: 'Attending',
      current: currentEvent.metrics.totalAttending,
      compare: compareEvent.metrics.totalAttending,
      growth: calculateGrowth(
        currentEvent.metrics.totalAttending,
        compareEvent.metrics.totalAttending
      ),
      format: (val: number) => val.toString()
    },
    {
      label: 'Additional Guests',
      current: currentEvent.metrics.totalGuests,
      compare: compareEvent.metrics.totalGuests,
      growth: calculateGrowth(
        currentEvent.metrics.totalGuests,
        compareEvent.metrics.totalGuests
      ),
      format: (val: number) => val.toString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-sm text-white/60 mb-1">Current Event</div>
          <div className="text-lg font-semibold text-white">{currentEvent.title}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-sm text-white/60 mb-1">Comparing To</div>
          <div className="text-lg font-semibold text-white">{compareEvent.title}</div>
          {compareEvent.eventDate && (
            <div className="text-xs text-white/50 mt-1">{formatDate(compareEvent.eventDate)}</div>
          )}
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="glass-card rounded-xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Detailed Comparison</h4>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className={`p-4 rounded-lg ${metric.highlight ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white/80">{metric.label}</span>
                <span className={`text-sm font-bold ${
                  metric.growth > 0 
                    ? 'text-green-400' 
                    : metric.growth < 0
                    ? 'text-red-400'
                    : 'text-white/60'
                }`}>
                  {metric.growth > 0 ? '+' : ''}{metric.growth.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/50 mb-1">Current Event</div>
                  <div className="text-xl font-bold text-white">
                    {metric.format(metric.current)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50 mb-1">Compare Event</div>
                  <div className="text-xl font-bold text-white/70">
                    {metric.format(metric.compare)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Insights */}
      <div className="glass-card rounded-xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Key Insights</h4>
        <div className="space-y-3">
          {attendanceGrowth > 20 && (
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-green-300 font-medium">Strong Growth</div>
                <div className="text-green-200 text-sm">Attendance increased by {attendanceGrowth.toFixed(0)}% compared to the previous event</div>
              </div>
            </div>
          )}
          {attendanceGrowth < -10 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <svg className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-yellow-300 font-medium">Lower Attendance</div>
                <div className="text-yellow-200 text-sm">Attendance decreased by {Math.abs(attendanceGrowth).toFixed(0)}% - consider reviewing your promotion strategy</div>
              </div>
            </div>
          )}
          {responseRateGrowth > 15 && (
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <div>
                <div className="text-blue-300 font-medium">Better Engagement</div>
                <div className="text-blue-200 text-sm">Response rate improved by {responseRateGrowth.toFixed(0)}% - your audience is more engaged</div>
              </div>
            </div>
          )}
          {velocityGrowth > 20 && (
            <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <svg className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-purple-300 font-medium">Faster Responses</div>
                <div className="text-purple-200 text-sm">People are responding {velocityGrowth.toFixed(0)}% faster - great timing on your invitations!</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventComparisonDetail;


