'use client'

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDownloadMenu from './ChartDownloadMenu';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PreviousEvent {
  eventId: string;
  title: string;
  totalInvited: number;
  created_at: string;
}

interface ResponseVelocityChartProps {
  currentEventTitle: string;
  currentVelocity: number;
  previousEvents: PreviousEvent[];
  avgPreviousVelocity: number;
}

const ResponseVelocityChart: React.FC<ResponseVelocityChartProps> = ({
  currentEventTitle,
  currentVelocity,
  previousEvents,
  avgPreviousVelocity
}) => {
  const chartRef = useRef<any>(null);
  // Calculate velocity for each previous event
  const now = new Date();
  const previousVelocities = previousEvents.map(prevEvent => {
    const prevCreatedAt = new Date(prevEvent.created_at);
    const daysSinceCreation = Math.max(1, Math.floor((now.getTime() - prevCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));
    return prevEvent.totalInvited > 0 ? (prevEvent.totalInvited / daysSinceCreation) : 0;
  });

  // Truncate long event titles
  const truncateTitle = (title: string, maxLength: number = 15) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  // Prepare data - show average of previous events vs current
  const labels = [
    'Previous Events Avg',
    truncateTitle(currentEventTitle) + ' (Current)'
  ];

  const velocityData = [
    avgPreviousVelocity,
    currentVelocity
  ];

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Responses per Day',
        data: velocityData,
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: function(context) {
            return `${context.parsed.y.toFixed(2)} responses per day`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: function(value) {
            return typeof value === 'number' ? value.toFixed(1) : String(value);
          }
        },
        title: {
          display: true,
          text: 'Responses per Day',
          color: 'rgba(255, 255, 255, 0.8)',
        }
      },
    },
  };

  const exportData = () => {
    const csvRows = ['Event,Responses per Day'];
    csvRows.push(`Previous Events Average,${avgPreviousVelocity.toFixed(2)}`);
    csvRows.push(`${currentEventTitle} (Current),${currentVelocity.toFixed(2)}`);
    const csv = csvRows.join('\n');

    const json = JSON.stringify({
      currentEvent: {
        title: currentEventTitle,
        velocity: currentVelocity
      },
      averagePreviousVelocity: avgPreviousVelocity
    }, null, 2);

    return { csv, json };
  };

  if (previousEvents.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-white/60">
        <div className="text-center">
          <p className="text-lg mb-2">No previous events to compare</p>
          <p className="text-sm">Create more events to see velocity trends</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <ChartDownloadMenu
          chartRef={chartRef}
          chartTitle="Response Velocity"
          exportData={exportData}
        />
      </div>
      <div className="h-72">
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default ResponseVelocityChart;


