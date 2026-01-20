'use client'

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ChartDownloadMenu from './ChartDownloadMenu';

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
  const chartRef = useRef<any>(null);
  
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

  const exportData = () => {
    const total = totalAttending + totalDeclined + totalPending;
    const csv = `Status,Count,Percentage\nAttending,${totalAttending},${Math.round((totalAttending / total) * 100)}%\nDeclined,${totalDeclined},${Math.round((totalDeclined / total) * 100)}%\nPending,${totalPending},${Math.round((totalPending / total) * 100)}%`;
    const json = JSON.stringify({
      attending: totalAttending,
      declined: totalDeclined,
      pending: totalPending,
      total: total,
      percentages: {
        attending: Math.round((totalAttending / total) * 100),
        declined: Math.round((totalDeclined / total) * 100),
        pending: Math.round((totalPending / total) * 100)
      }
    }, null, 2);
    return { csv, json };
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <ChartDownloadMenu
          chartRef={chartRef}
          chartTitle="Response Status"
          exportData={exportData}
        />
      </div>
      <div className="h-64">
        <Doughnut ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default ResponseStatus;

