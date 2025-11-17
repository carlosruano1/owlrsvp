'use client'

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoricalDataPoint {
  date: string;
  attendance: number;
  responseRate: number;
  title: string;
}

interface GrowthTrendChartProps {
  historicalData: HistoricalDataPoint[];
  currentAttendance: number;
  currentResponseRate: number;
}

const GrowthTrendChart: React.FC<GrowthTrendChartProps> = ({
  historicalData,
  currentAttendance,
  currentResponseRate
}) => {
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Combine historical data with current event
  const allDates = [
    ...historicalData.map(d => formatDate(d.date)),
    'Current'
  ];

  const attendanceData = [
    ...historicalData.map(d => d.attendance),
    currentAttendance
  ];

  const responseRateData = [
    ...historicalData.map(d => d.responseRate),
    currentResponseRate
  ];

  const data = {
    labels: allDates,
    datasets: [
      {
        label: 'Total Attendance',
        data: attendanceData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Response Rate (%)',
        data: responseRateData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const options: ChartOptions<'line'> = {
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
          color: 'rgba(75, 192, 192, 0.8)',
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
          color: 'rgba(255, 99, 132, 0.8)',
        },
        title: {
          display: true,
          text: 'Response Rate (%)',
          color: 'rgba(255, 99, 132, 0.8)',
        }
      },
    },
  };

  if (historicalData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-white/60">
        <div className="text-center">
          <p className="text-lg mb-2">No historical data available</p>
          <p className="text-sm">Create more events to see growth trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-72">
      <Line data={data} options={options} />
    </div>
  );
};

export default GrowthTrendChart;



