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

interface ResponseOverTimeProps {
  responsesByDay: Record<string, number>;
}

const ResponseOverTime: React.FC<ResponseOverTimeProps> = ({ responsesByDay }) => {
  // Format dates to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Prepare cumulative data
  const dates = Object.keys(responsesByDay);
  const dailyCounts = Object.values(responsesByDay);
  
  // Calculate cumulative count
  let cumulative = 0;
  const cumulativeCounts = dailyCounts.map(count => {
    cumulative += count;
    return cumulative;
  });

  const data = {
    labels: dates.map(formatDate),
    datasets: [
      {
        label: 'Daily Responses',
        data: dailyCounts,
        backgroundColor: 'rgba(53, 162, 235, 0.3)',
        borderColor: 'rgba(53, 162, 235, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(53, 162, 235, 1)',
        pointRadius: 3,
        tension: 0.3,
      },
      {
        label: 'Cumulative Responses',
        data: cumulativeCounts,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 3,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
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
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      }
    },
  };

  return (
    <div className="h-72">
      <Line data={data} options={options} />
    </div>
  );
};

export default ResponseOverTime;

