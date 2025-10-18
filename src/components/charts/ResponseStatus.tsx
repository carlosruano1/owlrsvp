'use client'

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface ResponseStatusProps {
  totalAttending: number;
  totalDeclined: number;
  totalPending: number;
}

const ResponseStatus: React.FC<ResponseStatusProps> = ({ 
  totalAttending, 
  totalDeclined, 
  totalPending 
}) => {
  
  const data = {
    labels: ['Attending', 'Declined', 'Pending'],
    datasets: [
      {
        data: [totalAttending, totalDeclined, totalPending],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',   // Green for attending
          'rgba(255, 99, 132, 0.7)',   // Red for declined
          'rgba(255, 206, 86, 0.7)',   // Yellow for pending
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            family: 'system-ui',
          },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = totalAttending + totalDeclined + totalPending;
            const value = context.raw as number;
            const percentage = Math.round((value / total) * 100);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default ResponseStatus;

