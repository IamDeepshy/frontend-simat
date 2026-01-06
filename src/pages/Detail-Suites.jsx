import React from 'react';
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import CreateDefectModal from '../components/createDefectModal';
import { useRerunTest } from '../context/useRerunTest';
import RerunLoadingModal from '../components/RerunLoadingModal';

export default function DetailSuites() {
  /* ======================================================
   * RE RUN STATE
   * ====================================================== */
  const {
    rerun,
    isRerunning,
    progress,
    rerunTestName,
  } = useRerunTest();

  const [wasRerunning, setWasRerunning] = useState(false);

  const { state } = useLocation();
  const { testCases } = state;

  /* ======================================================
   * SWEETALERT – RERUN FINISHED
   * ====================================================== */
  useEffect(() => {
    if (wasRerunning && !isRerunning) {
      Swal.fire({
        icon: "success",
        title: "Re-run successful",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: true,
        html: `
          <p class="text-sm text-gray-500">
            Test case <b>${rerunTestName}</b> completed successfully.
          </p>
        `,
        confirmButtonText: "OK",
        buttonsStyling: false,
        customClass: {
          confirmButton:
            "bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800",
        },
      });
    }

    setWasRerunning(isRerunning);
  }, [isRerunning, rerunTestName]);

  /* ======================================================
   * LOCAL STATE
   * ====================================================== */
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadgeClass = (status) => {
    if (status === "PASSED") return "bg-green-100 text-green-700";
    if (status === "FAILED" || status === "BROKEN")
      return "bg-red-100 text-red-700";
    return "";
  };


  return (
    <div className="flex-grow ml-[260px] p-8 min-h-screen overflow-y-auto">
      {testCases ? (
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
                <h5 className="text-xl font-semibold mb-3">{testCases.testName}</h5> 
                <div className="flex items-center gap-4">
                  <span className={`px-8 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(testCases.status)}`}>
                    {testCases.status}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-regular fa-clock"></i>
                    {testCases.duration}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-regular fa-file"></i>
                    {testCases.name}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => rerun(testCases)}
                  disabled={isRerunning}
                  className="px-8 py-2 bg-white border border-gray-300 rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <img src="/assets/icon/rerun.svg" alt="Rerun icon" className="w-4 h-4" />
                  Rerun Test
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-2 bg-black text-white rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <img src="/assets/icon/defect.svg" alt="Defect icon" className="w-4 h-4" />
                  Create Defect
                </button>

                <CreateDefectModal
                  transition
                  className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                />
              </div>
            </div>

            {testCases.status === "PASSED" ? (
              <div className="bg-green-100 -mx-6 px-6 py-8 -mb-6 rounded-b-2xl justify-center flex flex-col items-center text-center">
                <img src="/assets/icon/checkbox.svg" alt="Check icon" className='pt-6'/>
                <h1 className="text-4xl font-semibold mb-2 mt-8">Test Case Passed </h1>
                <p className='italic pb-6 mt-2 text-lg'>The case <span className='font-medium'>{testCases.name}</span> passed as expected</p>
              </div>
            ) : (
              <>
                {/* Error Details Section */}
                {testCases.errorMessage && (
                  <div className="bg-[#ff3e3e16] -mx-6 px-6 py-6 mb-6">
                    <h5 className="text-lg font-semibold text-red-700 mb-4">Error Details</h5>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-red-700 whitespace-pre-wrap text-medium">
                        {testCases.errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Execution Record Section */}
                {testCases.screenshotUrl && (
                  <div className="mt-6">
                    <h5 className="text-lg font-semibold mb-4">Failure Evidence</h5>
                    <div className="bg-gray-100 rounded-lg p-6 relative">
                      <img
                        src={`http://localhost:3000/screenshots/${testCases.screenshotUrl}`}
                        alt="Screenshot"
                        className="rounded-lg border max-w-full"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">No data found.</p>
        </div>
      )}

      {/* Modal Re run */}
      <RerunLoadingModal
        open={isRerunning}
        progress={progress}
        testName={rerunTestName}
      />
    </div>
  );
}