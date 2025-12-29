import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 5;

const TestCaseAccordion = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [testSuites, setTestSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');

  /* ======================================================
   * FETCH DATA
   * ====================================================== */
  useEffect(() => {
    const fetchSuites = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/grouped-testcases', {
          credentials: 'include',
        });
        const data = await res.json();

        const mapped = data.map((suite, idx) => ({
          id: `${suite.parentCode}-${idx}`,
          parentCode: suite.parentCode,
          totalTests: suite.totalTests,
          passed: suite.passed,
          failed: suite.failed,
          broken: suite.broken,
          testCases: suite.testCases.map(tc => ({
            name: tc.suiteName,
            testName: tc.testName,
            status: tc.status,
            duration: formatDuration(tc.durationMs),
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

  /* ======================================================
   * HELPERS
   * ====================================================== */
  const toggleAccordion = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'PASSED') return 'bg-green-100 text-green-700';
    if (status === 'FAILED') return 'bg-red-100 text-red-700';
    if (status === 'BROKEN') return 'bg-yellow-100 text-yellow-800';
    return '';
  };

  /* ======================================================
   * PAGINATION LOGIC (ACCORDION)
   * ====================================================== */
  const totalPages = Math.ceil(testSuites.length / ITEMS_PER_PAGE);

  const paginatedSuites = testSuites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <div className="ml-[260px] p-8">Loading...</div>;
  }

  return (
    <div className="ml-[260px] p-8 min-h-screen">

      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Suites</h1>
          <p className="text-gray-500 mt-1">Manage and monitor your test suites</p>
        </div>
        <button className="bg-black text-white text-sm px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2">
          <img src="/assets/icon/export.svg" alt="Export icon" className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Search Bar */}
        <div className="lg:col-span-5">
          <div className="relative">
            <svg 
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            <input
              type="text"
              placeholder="Search suites..."
              className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="lg:col-span-7 flex gap-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-12 py-0.2 rounded-lg text-sm transition-all ${
              activeFilter === 'all'
                ? 'bg-black text-white shadow-md font-semibold'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Test
          </button>
          <button
            onClick={() => setActiveFilter('passed')}
            className={`px-9 py-0.2 rounded-lg text-sm transition-all ${
              activeFilter === 'passed'
                ? 'bg-[#E5FFE5] text-[#006600] shadow-md font-semibold'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Test Passed
          </button>
          <button
            onClick={() => setActiveFilter('failed')}
            className={`px-10 py-0.2 rounded-lg text-sm transition-all ${
              activeFilter === 'failed'
                ? 'bg-[#FAD1D3] text-[#B6161B] shadow-md font-semibold '
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Test Failed
          </button>
        </div>
      </div>


      {/* ================= ACCORDION LIST ================= */}
      {paginatedSuites.map((suite) => (
        <div key={suite.id} className="bg-white border rounded-xl mb-4">

          {/* HEADER */}
          <button
            onClick={() => toggleAccordion(suite.id)}
            className="w-full p-5 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <svg
                className={`w-5 h-5 transition-transform ${
                  expandedId === suite.id ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>

              <div>
                <div className="font-semibold text-lg">{suite.parentCode}</div>
                <div className="text-sm text-gray-500">{suite.totalTests} Test Cases</div>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                {suite.passed} Passed
              </span>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                {suite.failed} Failed
              </span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {suite.broken} Broken
              </span>
            </div>
          </button>

          {/* CONTENT */}
          {expandedId === suite.id && (
            <table className="w-full border-t">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm">Test Name</th>
                  <th className="px-6 py-3 text-center text-sm">Status</th>
                  <th className="px-6 py-3 text-center text-sm">Duration</th>
                  <th className="px-6 py-3 text-center text-sm">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {suite.testCases.map((tc, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{tc.name}</div>
                      <div className="text-xs text-gray-500">{tc.testName}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-4 py-0.5 rounded-full text-sm ${getStatusBadgeClass(tc.status)}`}>
                        {tc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">{tc.duration}</td>
                    <td className="px-6 py-4 text-center">
                      <Link to="/detail-suites">
                        <img src="/assets/icon/view.svg" className="w-5 h-5 mx-auto" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">
          Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(currentPage * ITEMS_PER_PAGE, testSuites.length)} dari {testSuites.length} suites
        </p>

        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-2 border rounded disabled:opacity-40"
          >
            Sebelumnya
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-2 rounded ${
                currentPage === i + 1 ? 'bg-black text-white' : 'border'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-2 border rounded disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestCaseAccordion;
