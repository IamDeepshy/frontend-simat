import React, { useEffect, useState } from 'react';
import ChartSection from "../components/Chart";
import Header from "../components/Header";
import { Navigate } from "react-router-dom";
import { Link } from 'react-router-dom';


export default function Dashboard() {
  const [testSuites, setTestSuites] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ======================================================
   * HELPERS
   * ====================================================== */
  const formatDuration = (ms) => {
    if (!ms) return '-';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
  };

  const normalizeStatus = (status) => {
    if (status === 'PASSED') return 'PASSED';
    if (status === 'FAILED' || status === 'BROKEN') return 'FAILED';
    return status;
  };

  const getFilteredCounts = (suite) => {
    const passed = suite.testCases.filter(tc => tc.status === 'PASSED').length;
    const failed = suite.testCases.filter(tc => tc.status === 'FAILED').length;
    const total = suite.testCases.length;
    const percentage = total === 0 ? 0 : Math.round((passed / total) * 100);
    return { passed, failed, total, percentage };
  };

  /* ======================================================
   * FETCH SUITES DATA
   * ====================================================== */
  useEffect(() => {
    const fetchSuites = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/grouped-testcases', { credentials: 'include' });
        const data = await res.json();

        const mapped = data.map((suite, idx) => ({
          id: `${suite.parentCode}-${idx}`,
          parentCode: suite.parentCode,
          testCases: suite.testCases.map(tc => ({
            name: tc.suiteName,
            testName: tc.testName,
            status: normalizeStatus(tc.status),
            duration: formatDuration(tc.durationMs),
            errorMessage: tc.errorMessage,
            screenshotUrl: tc.screenshotUrl,
            specPath: tc.specPath,
            lastRunAt: tc.lastRunAt,
            runId: tc.runId,
          })),
        }));

        setTestSuites(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuites();
  }, []);

  if (loading) return <p className="p-6 text-center">Loading...</p>;

  /* ======================================================
   * CALCULATE STATS
   * ====================================================== */
  const totalTests = testSuites.reduce((acc, suite) => acc + suite.testCases.length, 0);
  const totalPassed = testSuites.reduce(
    (acc, suite) => acc + getFilteredCounts(suite).passed,
    0
  );
  const totalFailed = testSuites.reduce(
    (acc, suite) => acc + getFilteredCounts(suite).failed,
    0
  );
  const inProgress = totalTests - (totalPassed + totalFailed);

  const stats = [
    { title: "Total Test Cases", value: totalTests, icon: "/assets/icon/list.svg", bgColor: "bg-[#EFF6FF]" },
    { title: "Total Test Passed", value: totalPassed, icon: "/assets/icon/passed.svg", bgColor: "bg-[#F0FDF4]" },
    { title: "Total Test Failed", value: totalFailed, icon: "/assets/icon/failed.svg", bgColor: "bg-[#FEF2F2]" },
    { title: "In Progress Task", value: inProgress, icon: "/assets/icon/progress.svg", bgColor: "bg-[#FEFCE8]" },
  ];

  return (
    <div className="flex-grow ml-[275px] p-4 min-h-screen overflow-y-auto">
      {/* Header Section */}
      <Header />

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div>
              <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
              <h3 className="text-2xl font-semibold">{stat.value}</h3>
            </div>
            <div className={`${stat.bgColor} w-[60px] h-[48px] rounded-xl flex items-center justify-center shadow-sm`}>
              <img src={stat.icon} alt={stat.title} className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <ChartSection />

      {/* Suites Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
        <h4 className="font-semibold text-lg mb-4">Suites</h4>
        <div className="space-y-5">
          {testSuites.slice(0, 5).map((suite, index) => {
            const { passed, failed, total, percentage } = getFilteredCounts(suite);
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-4 py-6 flex items-center gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-2 h-2 rounded-full ${passed === total ? 'bg-green-500' : failed > 0 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <h6 className="font-medium flex-1">{suite.parentCode}</h6>
                <span className="text-sm text-teal-600">{passed}/{total}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-teal-500 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{percentage}%</span>
              </div>
            );
          })}
        </div>
        <Link to="/suites">
          <button className="w-full bg-black text-white py-3 rounded-lg mt-4 hover:bg-gray-800 transition-colors">
            View All Suites
          </button>
        </Link>
      </div>

    </div>
  );
}
