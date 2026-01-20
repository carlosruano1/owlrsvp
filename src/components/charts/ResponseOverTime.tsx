'use client'

import React, { useRef } from 'react';
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
import ChartDownloadMenu from './ChartDownloadMenu';

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
  const chartRef = useRef<any>(null);

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
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      }
    },
  };

  const exportData = () => {
    const csvRows = ['Date,Daily Responses,Cumulative Responses'];
    let cumulative = 0;
    dates.forEach((date, index) => {
      const daily = dailyCounts[index];
      cumulative += daily;
      csvRows.push(`${date},${daily},${cumulative}`);
    });
    const csv = csvRows.join('\n');
    
    const json = JSON.stringify({
      responsesByDay: dates.reduce((acc, date, index) => {
        acc[date] = dailyCounts[index];
        return acc;
      }, {} as Record<string, number>),
      cumulativeByDay: dates.reduce((acc, date, index) => {
        let cum = 0;
        for (let i = 0; i <= index; i++) {
          cum += dailyCounts[i];
        }
        acc[date] = cum;
        return acc;
      }, {} as Record<string, number>)
    }, null, 2);
    
    return { csv, json };
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <ChartDownloadMenu
          chartRef={chartRef}
          chartTitle="Responses Over Time"
          exportData={exportData}
        />
      </div>
      <div className="h-72">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default ResponseOverTime;

