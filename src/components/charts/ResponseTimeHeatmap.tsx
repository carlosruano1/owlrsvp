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

interface ResponseTimeHeatmapProps {
  responseHours: Record<number, number>;
}

const ResponseTimeHeatmap: React.FC<ResponseTimeHeatmapProps> = ({ responseHours }) => {
  const chartRef = useRef<any>(null);
  // Convert hours to readable format
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  };

  // Create 24-hour array with 0 counts for missing hours
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourCounts = hours.map(hour => responseHours[hour] || 0);

  // Determine the best times to send reminders (hours with highest response rates)
  const sortedHours = [...hours].sort((a, b) => (responseHours[b] || 0) - (responseHours[a] || 0));
  const topThreeHours = sortedHours.slice(0, 3);
  const colorMapping: Record<number, string> = {};
  
  // Assign colors to hours
  hours.forEach(hour => {
    if (topThreeHours.includes(hour)) {
      const index = topThreeHours.indexOf(hour);
      // Gradient of greens from most to least active in top 3
      colorMapping[hour] = [
        'rgba(72, 187, 120, 0.9)',  // Strong green
        'rgba(72, 187, 120, 0.7)',  // Medium green
        'rgba(72, 187, 120, 0.5)',  // Light green
      ][index];
    } else {
      colorMapping[hour] = 'rgba(113, 128, 150, 0.4)'; // Grey for other hours
    }
  });

  const data = {
    labels: hours.map(formatHour),
    datasets: [
      {
        label: 'Responses',
        data: hourCounts,
        backgroundColor: hours.map(hour => colorMapping[hour]),
        borderColor: hours.map(hour => {
          const baseColor = colorMapping[hour];
          return baseColor.replace('0.9', '1')
                          .replace('0.7', '0.8')
                          .replace('0.5', '0.6')
                          .replace('0.4', '0.5');
        }),
        borderWidth: 1,
        borderRadius: 4,
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
        callbacks: {
          title: function(tooltipItems) {
            return `${tooltipItems[0].label}`;
          },
          label: function(context) {
            const value = context.raw as number;
            return `${value} responses`;
          },
          afterLabel: function(context) {
            const value = context.raw as number;
            const totalResponses = hourCounts.reduce((sum, count) => sum + count, 0);
            const percentage = totalResponses > 0 ? (value / totalResponses * 100).toFixed(1) : '0';
            return `${percentage}% of all responses`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
      title: {
        display: true,
        text: 'Responses by Time of Day',
        color: 'rgba(255, 255, 255, 0.8)',
        font: {
          size: 16,
          family: 'system-ui',
        }
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
          maxRotation: 90,
          minRotation: 45,
          autoSkip: false,
          font: {
            size: 10,
          }
        }
      }
    },
  };

  const exportData = () => {
    const formatHour = (hour: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour} ${period}`;
    };

    const csvRows = ['Hour,Responses,Percentage'];
    const totalResponses = hourCounts.reduce((sum, count) => sum + count, 0);
    hours.forEach((hour, index) => {
      const count = hourCounts[index];
      const percentage = totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : '0';
      csvRows.push(`${formatHour(hour)},${count},${percentage}%`);
    });
    const csv = csvRows.join('\n');

    const json = JSON.stringify({
      responseHours: hours.reduce((acc, hour, index) => {
        acc[formatHour(hour)] = hourCounts[index];
        return acc;
      }, {} as Record<string, number>),
      totalResponses: totalResponses,
      mostActiveHour: formatHour(sortedHours[0])
    }, null, 2);

    return { csv, json };
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <ChartDownloadMenu
          chartRef={chartRef}
          chartTitle="Response Time Analysis"
          exportData={exportData}
        />
      </div>
      <div className="h-72">
        <Bar ref={chartRef} data={data} options={options} />
      </div>
      <div className="mt-3 text-center text-white/70 text-sm">
        <span className="inline-flex items-center mr-4">
          <span className="w-3 h-3 inline-block mr-1 bg-green-500 rounded-sm"></span> Best times to send reminders
        </span>
      </div>
    </div>
  );
};

export default ResponseTimeHeatmap;

