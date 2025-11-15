import React from 'react';
import { useLocation, Link } from "react-router-dom";
import CreateDefectModal from '../layouts/createDefectModal';

export default function DetailSuites() {
  const location = useLocation();
  const { suiteId, testCase } = location.state || {};

  const getStatusBadgeClass = (status) => {
    if (status === 'Passed') return 'bg-green-100 text-green-700';
    if (status === 'Failed') return 'bg-red-100 text-red-700';
    return '';
  };

  return (
    <div className="flex-grow ml-[290px] p-8 min-h-screen overflow-y-auto">
      {testCase ? (
        <>
          {/* Back Navigation */}
          <Link 
            to="/suites" 
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back to Suites</span>
          </Link>

          {/* Page Title */}
          <h2 className="text-3xl font-semibold mb-6">Detail Suites</h2>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {/* Test Case Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
              <div>
                <h5 className="text-xl font-semibold mb-3">{testCase.name}</h5>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusBadgeClass(testCase.status)}`}>
                    {testCase.status}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-regular fa-clock"></i>
                    {testCase.duration}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="px-8 py-2 bg-white border border-gray-300 rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <img src="/assets/icon/rerun.svg" alt="Rerun icon" className="w-4 h-4" />
                  Rerun Test
                </button>
                <button className="px-8 py-2 bg-black text-white rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <img src="/assets/icon/defect.svg" alt="Defect icon" className="w-4 h-4" />
                  Create Defect
                </button>
              </div>
            </div>

            {/* Error Details Section */}
            {testCase.errormsg && (
              <div className="bg-[#FEF2F2] -mx-6 px-6 py-6 mb-6">
                <h5 className="text-lg font-semibold text-red-600 mb-4">Error Details</h5>
                <div className="bg-white rounded-lg p-4">
                  <pre className="text-red-600 whitespace-pre-wrap font-mono text-sm">
                    {testCase.errormsg}
                  </pre>
                </div>
              </div>
            )}

            {/* Execution Record Section */}
            <div className="mt-6">
              <h5 className="text-lg font-semibold mb-4">Execution Record</h5>
              <div className="bg-gray-100 rounded-lg p-6 relative">
                <img 
                  src="/assets/image/execution-record.png" 
                  alt="Execution Record" 
                  className="w-full rounded-lg"
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">No data found.</p>
        </div>
      )}
    </div>
  );
}