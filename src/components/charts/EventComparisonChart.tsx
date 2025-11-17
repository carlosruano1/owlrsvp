'use client'

import React from 'react';
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
  totalAttendance: number;
  responseRate: number;
}

interface EventComparisonChartProps {
  currentEventTitle: string;
  currentAttendance: number;
  currentResponseRate: number;
  previousEvents: PreviousEvent[];
}

const EventComparisonChart: React.FC<EventComparisonChartProps> = ({
  currentEventTitle,
  currentAttendance,
  currentResponseRate,
  previousEvents
}) => {
  // Truncate long event titles
  const truncateTitle = (title: string, maxLength: number = 20) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  // Prepare data for comparison
  const eventLabels = [
    ...previousEvents.map(e => truncateTitle(e.title)),
    truncateTitle(currentEventTitle) + ' (Current)'
  ];

  const attendanceData = [
    ...previousEvents.map(e => e.totalAttendance),
    currentAttendance
  ];

  const responseRateData = [
    ...previousEvents.map(e => e.responseRate),
    currentResponseRate
  ];

  const data = {
    labels: eventLabels,
    datasets: [
      {
        label: 'Total Attendance',
        data: attendanceData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Response Rate (%)',
        data: responseRateData,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            family: 'system-ui',
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Attendance: ${context.parsed.y} people`;
            } else {
              return `Response Rate: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxRotation: 45,
          minRotation: 45,
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
        title: {
          display: true,
          text: 'Attendance',
          color: 'rgba(75, 192, 192, 0.8)',
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgba(255, 99, 132, 0.6)',
        },
        title: {
          display: true,
          text: 'Response Rate (%)',
          color: 'rgba(255, 99, 132, 0.8)',
        }
      },
    },
  };

  if (previousEvents.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-white/60">
        <div className="text-center">
          <p className="text-lg mb-2">No previous events to compare</p>
          <p className="text-sm">Create more events to see comparison trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-72">
      <Bar data={data} options={options} />
    </div>
  );
};

export default EventComparisonChart;


