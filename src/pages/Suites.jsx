import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TestCaseAccordion = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const testSuites = [
    {
      id: 'AT-CORE-0001',
      totalTests: 10,
      passed: 1,
      failed: 2,
      testCases: [
        { 
          name: 'Validate Table Header Wording', 
          status: 'Failed', 
          taskStatus: 'Todo', 
          duration: '2m 3s',
          errormsg: 'Error: Jumlah kolom tidak sesuai.\n  Expected: 6 kolom → Bag Type, Reference Entity, Reference Value, Created By, Updated At, Updated By\n  Received: 7 kolom → id, Bag Type, Reference Entity, Reference Value, Created By, Updated At, Updated By'
        },
        { 
          name: 'Validate Table Header Wording', 
          status: 'Passed', 
          taskStatus: null, 
          duration: '2m 3s' 
        },
        { 
          name: 'Validate Table Header Wording', 
          status: 'Failed', 
          taskStatus: 'Done', 
          duration: '2m 3s' 
        },
        { 
          name: 'Validate Table Header Wording', 
          status: 'Failed', 
          taskStatus: 'In Progress', 
          duration: '2m 3s',
          errormsg: 'Expected header to be "User Name" but found "Username"',
        }
      ]
    }
  ];

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Passed') return 'bg-green-100 text-green-700';
    if (status === 'Failed') return 'bg-red-100 text-red-700';
    return '';
  };

  const getTaskStatusBadgeClass = (taskStatus) => {
    if (taskStatus === 'Todo') return 'bg-gray-300 text-black';
    if (taskStatus === 'In Progress') return 'bg-yellow-200 text-yellow-900';
    if (taskStatus === 'Done') return 'bg-green-100 text-green-700';
    return '';
  };

  return (
    <div className="flex-grow ml-[260px] pt-4 pb-8 pr-8 pl-8 min-h-screen overflow-y-auto">
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

      {/* Accordion Section */}
      {testSuites.map((suite) => (
        <div key={suite.id} className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
          {/* Accordion Header */}
          <button
            onClick={() => toggleAccordion(suite.id)}
            className="w-full p-5 flex justify-between items-center hover:bg-gray-50 transition-colors rounded-t-xl"
          >
            <div className="flex items-center gap-4">
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-500 ${
                  expandedId === suite.id ? 'rotate-90' : 'rotate-0'
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="text-left">
                <div className="font-semibold text-lg">{suite.id}</div>
                <div className="text-gray-500 text-sm">{suite.totalTests} Test Cases</div>
              </div>
            </div>
            <div className="flex gap-2 mr-4">
              <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium">
                {suite.passed} Passed
              </span>
              <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-medium">
                {suite.failed} Failed
              </span>
            </div>
          </button>

          <div 
            className={`border-t border-gray-200 transition-all duration-500 ease-in-out  ${
              expandedId === suite.id 
                ? 'max-h-[2000px] opacity-100' 
                : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            <div className={`transition-all duration-500 ${expandedId === suite.id ? 'translate-y-0' : '-translate-y-4'}`}>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Test Name</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Task Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Duration</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {suite.testCases.map((testCase, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm">{testCase.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-8 py-0.5 rounded-full text-sm font-medium ${getStatusBadgeClass(testCase.status)}`}>
                          {testCase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {testCase.taskStatus && (
                          <span className={`inline-block px-8 py-0.5 rounded-full text-sm font-medium ${getTaskStatusBadgeClass(testCase.taskStatus)}`}>
                            {testCase.taskStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">{testCase.duration}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-3">
                          <Link
                            to="/detail-suites"
                            state={{
                              suiteId: suite.id,
                              testCase: testCase,
                              index: index
                            }}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <img src="/assets/icon/view.svg" alt="View" className="w-5 h-5" />
                          </Link>
                          <button className="hover:opacity-70 transition-opacity">
                            <img src="/assets/icon/rerun.svg" alt="Rerun" className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">Menampilkan 3 dari 4 data</p>
        <div className="flex gap-2">
          <button className="px-3 py-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            Sebelumnya
          </button>
          <button className="px-3 py-2 bg-black text-white rounded-lg text-sm">1</button>
          <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">2</button>
          <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestCaseAccordion;