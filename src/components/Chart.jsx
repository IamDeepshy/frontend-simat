import React, { useEffect, useState } from 'react';
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
  const [chartData, setChartData] = useState({
    barLabels: [],
    barValues: [],
    passed: 0,
    failed: 0,
    total: 0,
  });

  // Helpers
  const normalizeStatus = (status) => {
    if (status === 'PASSED') return 'PASSED';
    if (status === 'FAILED' || status === 'BROKEN') return 'FAILED';
    return status;
  };

  const formatDurationBucket = (ms) => {
    // Bucket durasi: misal per 10ms
    const sec = Math.floor(ms / 1000);
    if (sec <= 1) return '1ms';
    if (sec <= 2) return '2ms';
    if (sec <= 3) return '3ms';
    if (sec <= 4) return '4ms';
    if (sec <= 5) return '5ms';
    if (sec <= 6) return '6ms';
    if (sec <= 7) return '7ms';
    if (sec <= 8) return '8ms';
    if (sec <= 9) return '9ms';
    return '10ms+';
  };

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/grouped-testcases', { credentials: 'include' });
        const data = await res.json();

        // Hitung bar chart (jumlah test case per durasi)
        const durationBuckets = {};
        let passedCount = 0;
        let failedCount = 0;

        data.forEach(suite => {
          suite.testCases.forEach(tc => {
            const status = normalizeStatus(tc.status);
            if (status === 'PASSED') passedCount++;
            if (status === 'FAILED') failedCount++;

            const bucket = formatDurationBucket(tc.durationMs);
            durationBuckets[bucket] = (durationBuckets[bucket] || 0) + 1;
          });
        });

        const barLabels = Object.keys(durationBuckets);
        const barValues = Object.values(durationBuckets);

        setChartData({
          barLabels,
          barValues,
          passed: passedCount,
          failed: failedCount,
          total: passedCount + failedCount,
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchChartData();
  }, []);

  // BAR CHART DATA AND OPTIONS
  const barData = {
    labels: chartData.barLabels,
    datasets: [
      {
        label: 'Test Cases',
        data: chartData.barValues,
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
      title: { display: false },
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
        title: { display: true, text: 'Test Cases', color: '#777', font: { size: 12 } },
        ticks: { font: { size: 11 } }
      },
    },
  };

  // DOUGHNUT CHART DATA AND OPTIONS
  const donutData = {
    labels: ['Failed', 'Passed'],
    datasets: [
      {
        data: [chartData.failed, chartData.passed],
        backgroundColor: ['#E01B22', '#00A63E'],
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
      title: { display: false },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 12 },
        formatter: (value, ctx) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          return total === 0 ? '0%' : Math.round((value / total) * 100) + '%';
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Bar Chart Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_7px_-3px_rgba(0,0,0,0.15)] p-6">
        <h4 className="font-semibold text-lg mb-4">Test Summary by Duration</h4>
        <div className="h-[300px]">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Doughnut Chart Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_7px_-3px_rgba(0,0,0,0.15)] p-6">
        <h4 className="font-semibold text-lg mb-4">Test Distribution</h4>
        <div className="h-[300px] flex flex-col items-center justify-center">
          <div className="w-full max-w-[250px] h-[250px] relative">
            <Doughnut data={donutData} options={donutOptions} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-semibold">{chartData.total}</span>
            </div>
          </div>
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#00A63E]"></span>
              <span className="text-sm text-gray-600">Passed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#E01B22]"></span>
              <span className="text-sm text-gray-600">Failed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
