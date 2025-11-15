import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Tooltip, 
  Legend, 
  Title, 
  ChartDataLabels
);

const ChartSection = () => {
  // BAR CHART DATA AND OPTIONS
  const barData = {
    labels: ['1ms', '2ms', '3ms', '4ms', '5ms', '6ms', '7ms', '8ms', '9ms', '10ms'],
    datasets: [
      {
        label: 'Test Cases',
        data: [45, 120, 95, 78, 62, 48, 35, 28, 18, 12],
        backgroundColor: '#4285F4',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#666',
        font: { weight: 'bold', size: 10 },
      },
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#eee' },
        title: {
          display: true,
          text: 'Test Cases',
          color: '#777',
          font: { size: 12 },
        },
        ticks: { font: { size: 11 } }
      },
    },
  };

  // DONUT CHART DATA AND OPTIONS
  const donutData = {
    labels: ['Failed', 'Passed'],
    datasets: [
      {
        data: [52, 41],
        backgroundColor: ['#EA4335', '#34A853'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
      },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 14 },
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          return Math.round((value / total) * 100) + '%';
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Bar Chart Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h4 className="font-semibold text-lg mb-4">Test Summary by Duration</h4>
        <div className="h-[300px]">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Doughnut Chart Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h4 className="font-semibold text-lg mb-4">Test Distribution</h4>
        <div className="h-[300px] flex flex-col items-center justify-center">
          <div className="w-full max-w-[250px] h-[250px] relative">
            <Doughnut data={donutData} options={donutOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold">93</span>
            </div>
          </div>
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#34A853]"></span>
              <span className="text-sm text-gray-600">Passed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#EA4335]"></span>
              <span className="text-sm text-gray-600">Failed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;