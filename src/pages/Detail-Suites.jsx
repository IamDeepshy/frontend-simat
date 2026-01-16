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
  const testCaseId = state?.testCaseId;

  /* ======================================================
   * FETCH TEST CASE DETAILS
   * ====================================================== */

  const [testCase, setTestCase] = useState(null);
  const [loading, setLoading] = useState(true);
 
  const normalizeStatus = (status) => {
    if (status === 'PASSED') return 'PASSED';
    if (status === 'FAILED' || status === 'BROKEN') return 'FAILED';
    return status;
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
  };


  const fetchTestCase = async () => {
    try {
      setLoading(true); // mulai loading

      const res = await fetch(
        "http://localhost:3000/api/grouped-testcases",
        { credentials: "include" }
      );
      const data = await res.json();
      // cari test case dari semua suite

      for (const suite of data) {
        const found = suite.testCases.find(tc => tc.id === testCaseId);
        if (found) {
          const normalized = normalizeStatus(found.status);

          const next = {
            id: found.id,
            name: found.suiteName,
            testName: found.testName || found.suiteName || found.name,
            specPath: found.specPath,
            screenshotUrl: found.screenshotUrl,
            errorMessage: found.errorMessage,
            lastRunAt: found.lastRunAt,
            status: normalizeStatus(found.status),
            duration: formatDuration(found.durationMs),
          };

          setTestCase(next);
          return next;
        }

      }
    setTestCase(null); // kalau tidak ketemu
    } catch (err) {
      console.error(err);
      setTestCase(null);
    } finally {
      setLoading(false); // selesai loading 
    }
  };

  useEffect(() => {
    if (testCaseId) {
      fetchTestCase();
    }
  }, [testCaseId]);

  /* ======================================================
   * STATUS BADGE STATE
   * ====================================================== */
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadgeClass = (status) => {
    if (status === 'PASSED') return 'bg-green-100 text-green-700 min-w-[80px]';
    if (status === 'FAILED') return 'bg-red-100 text-red-700 min-w-[100px]';
    return '';
  };

  /* ======================================================
   * DEFECT STATE
   * ====================================================== */
  const [defectDetails, setDefectDetails] = useState(null);
  console.log("defectDetails full:", defectDetails);

  const fetchActiveDefect = async () => {
    if (!testCase) {
      setDefectDetails(null);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/api/defects/active?testSpecId=${testCase.id}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        setDefectDetails(null);
        return;
      }

      const json = await res.json();
      const defect = json?.data || null;

    if (defect && (defect.is_hidden === true || String(defect.is_hidden) === "1")) {
      setDefectDetails(null);
      return;
    }
      setDefectDetails(defect);
      return defect;
    } catch (e) {
      console.error("FETCH ACTIVE DEFECT ERROR:", e);
      setDefectDetails(null);
      return null;
    }
  };

  useEffect(() => {
    fetchActiveDefect();
  }, [testCase]);

  // penting: refetch setelah modal close
  useEffect(() => {
    if (!isModalOpen) fetchActiveDefect();
  }, [isModalOpen]);

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'High': return 'bg-[#FFCDCF] text-[#BD0108]';
      case 'Medium': return 'bg-[#FFEAD2] text-[#FF6200]';
      case 'Low': return 'bg-[#EFEFEF] text-[#757373]';
      default: return 'bg-gray-400 text-white';
    }
  };
  
  const getTaskStatusClass = (status) => {
    switch(status) {
      case 'To Do': return 'bg-[#B9B9B9] text-[#323232]';
      case 'In Progress': return 'bg-[#FFFAC6] text-[#CC7A00]';
      case 'Done': return 'bg-[#E5FFE5] text-[#006600]';
      default: return 'bg-gray-400 text-white';
    }
  };

  // disable create defect
  const disableCreateDefect =
    defectDetails &&
    (defectDetails.status === "To Do" || defectDetails.status === "In Progress" || defectDetails.status === "Done");

  if (!testCaseId) {
    return (
      <div className="flex-grow ml-[260px] p-8 min-h-screen overflow-y-auto">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">No test case selected.</p>
        </div>
      </div>
    );
  }

  // disable Re run when task status is "To Do" or "In Progress"
  const disableRerun =
    defectDetails &&
    ["To Do", "In Progress"].includes(defectDetails.status);
    
  /* ======================================================
  * FETCH USER LOGIN
  * ====================================================== */
  const [user, setUser] = useState(null);
  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:3000/auth/me", {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("FETCH USER ERROR:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const isRerunAfterDone = (lastRunAt, doneUpdatedAt) => {
    if (!lastRunAt) return false;
    if (!doneUpdatedAt) return false;

    const lastRun = new Date(lastRunAt).getTime();
    const doneAt = new Date(doneUpdatedAt).getTime();

    return lastRun > doneAt;
  };

  const rerunValid = isRerunAfterDone(testCase?.lastRunAt, defectDetails?.updated_at);

  // IF DONE AND PASSED TO TASK COMPLETE --------------------------------------------------------
  // tampilkan COMPLETE kalau: QA + task Done + hasil rerun terakhir PASSED
  const showCompleteAction =
    user?.role === "qa" &&
    defectDetails?.status === "Done" &&
    rerunValid &&
    testCase?.status === "PASSED";

  const handleCompleteTask = async () => {
    const result = await Swal.fire({
      title: "Complete task?",
      html: `
        <p class="text-sm text-gray-500">
          This task will be removed from the kanban board.
        </p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e", 
      cancelButtonColor: "#6b7280",  
      confirmButtonText: "Yes, complete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });


    if (!result.isConfirmed) return;

    const res = await fetch(
      `http://localhost:3000/api/tasks/${defectDetails.id}/complete`,
      {
        method: "PATCH",
        credentials: "include",
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return Swal.fire({
        icon: "error",
        title: "Action failed",
        html: `
          <p class="text-sm text-gray-500">
            ${err.message || "Something went wrong. Please try again."}
          </p>
        `,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }

    Swal.fire({
      icon: "success",
      title: "Task completed",
      html: `
        <p class="text-sm text-gray-500">
          The task has been successfully completed.
        </p>
      `,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    setDefectDetails(null); // hide details
    await fetchActiveDefect(); // sync
  };

    /* ======================================================
   * SWEETALERT – RERUN FINISHED
   * ====================================================== */
  useEffect(() => {
    if (wasRerunning && !isRerunning) {
      (async () => {
        // 1) ambil status testcase terbaru
        const latest = await fetchTestCase();

        // 2) ambil defect/task terbaru
        const latestDefect = await fetchActiveDefect();

        const status = latest?.status || null; // "PASSED" / "FAILED" / null

        // CASE PASSED
        if (status === "PASSED") {
          Swal.fire({
            icon: "success",
            title: "Re-run passed",
            html: `<p class="text-sm text-gray-500">
                      Test case <b>${rerunTestName}</b> passed.
                  </p>`,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          return;
        }

        // CASE FAILED
        if (status === "FAILED") {
          const taskDone = latestDefect?.status === "Done";
          const rerunValidNow = isRerunAfterDone(
            latest?.lastRunAt,
            latestDefect?.updated_at
          );

          // Failed AFTER Done (dan rerun memang setelah Done)
          if (taskDone && rerunValidNow) {
            Swal.fire({
              icon: "error",
              title: "Re-run failed",
              html: `<p class="text-sm text-gray-500">
                      Test case <b>${rerunTestName}</b> still failed. You can reopen task or create a new defect.
                    </p>`,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
            });
            return;
          }

          // Failed BEFORE Done (simple message)
          Swal.fire({
            icon: "error",
            title: "Test case failed",
            html: `<p class="text-sm text-gray-500">
                    Test case <b>${rerunTestName}</b> failed.
                  </p>`,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        }
      })();
    }

  setWasRerunning(isRerunning);
  }, [isRerunning, wasRerunning, rerunTestName]);
  
  // ====================== REOPEN
  // tampilkan DECISION kalau: QA + task Done + hasil rerun terakhir FAILED
  const showDecisionAction =
    user?.role === "qa" &&
    defectDetails?.status === "Done" &&
    rerunValid &&
    testCase?.status === "FAILED";

  // DEcision Create New Defect or 
  const handleDecisionQA = async () => {
    const result = await Swal.fire({
      title: "Is this the same issue?",
      html: `
        <p class="text-sm text-gray-500">
          If <b>Yes</b>, the task will be reopened.<br/>
          If <b>No</b>, a new defect will be created.
        </p>
      `,
      icon: "question",
      showCloseButton: true,
      showCancelButton: false,

      showDenyButton: true,
      confirmButtonColor: "#22c55e",
      denyButtonColor: "#ef4444",

      confirmButtonText: "Yes",
      denyButtonText: "No",

      reverseButtons: true,
    });

    // ❌ Klik X / ESC / klik luar modal
    if (result.isDismissed) return;

    // ✅ YES → Reopen task
    if (result.isConfirmed) {
      await reopenTask();
      return;
    }

    // ❌ NO → Create new defect
    if (result.isDenied) {
      setIsModalOpen(true);
    }
  };
  // REOPEN FUNCTION
  const reopenTask = async () => {
    console.log("Reopen API hit:", defectDetails.id);

    const taskId = defectDetails?.id;

    console.log("REOPEN: taskId =", taskId);

    if (!taskId) {
      return Swal.fire({
        icon: "error",
        title: "Task not found",
        html: `
          <p class="text-sm text-gray-500">
            The task ID could not be found. Please refresh the page and try again.
          </p>
        `,
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    }

    const confirm = await Swal.fire({
      title: "Reopen task?",
      html: `
        <p class="text-sm text-gray-500">
          The task status will be moved back to <b>To Do</b><br/>
          and recorded as reopened.
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e", 
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reopen",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });


    if (!confirm.isConfirmed) return;

    console.log("CALLING API: /api/tasks/" + taskId + "/reopen");

    const res = await fetch(`http://localhost:3000/api/tasks/${taskId}/reopen`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    console.log("REOPEN response status:", res.status);

    const body = await res.json().catch(() => ({}));
    console.log("REOPEN response body:", body);

    if (!res.ok) {
      return Swal.fire({
        icon: "error",
        title: "Failed to reopen task",
        html: `
          <p class="text-sm text-gray-500">
            ${body.message || "The task could not be reopened. Please try again."}
          </p>
        `,
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    }

    Swal.fire({
      icon: "success",
      title: "Task reopened",
      html: `
        <p class="text-sm text-gray-500">
          The task has been successfully reopened.
        </p>
      `,
      timerProgressBar: true,
      timer: 3000,
    });
    await fetchActiveDefect(); // refresh
  };

  const showActionsSection = showCompleteAction || showDecisionAction;

  const formatDateTime = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID");
  };
  
  // hide reopen
  const showReopen = !!defectDetails?.reopenedAt;

  // kolom 6:5
  const colsClass = showActionsSection ? "md:grid-cols-6" : "md:grid-cols-5";
  const gapClass = showActionsSection ? "gap-8" : "gap-6"; 

  return (
    <div className="flex-grow ml-[260px] p-8 min-h-screen overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Loading test case...</p>
        </div>
      ) : testCase ? (
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
                <h5 className="text-xl font-semibold mb-3">{testCase.testName}</h5> 
                <div className="flex items-center gap-4">
                  <span className={`px-8 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(testCase.status)}`}>
                    {testCase.status}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-regular fa-clock"></i>
                    {testCase.duration}
                  </span>

                  <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-regular fa-file"></i>
                    {testCase.name}
                  </span>

                 <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-solid fa-flag-checkered"></i>
                    {testCase.lastRunAt
                      ? new Date(testCase.lastRunAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                 <button 
                  onClick={() => {
                    if (isRerunning || disableRerun) return;
                    rerun(testCase);
                  }}
                  disabled={isRerunning || disableRerun}
                   className={`px-8 py-2 rounded-lg flex items-center gap-2 transition-all
                      ${isRerunning || disableRerun
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-white border border-gray-300 hover:shadow-md hover:-translate-y-0.5"}
                    `}
                    title={
                      disableRerun
                        ? "Rerun disabled while task is in progress"
                        : ""
                    }
                  >
                  <img src="/assets/icon/rerun.svg" alt="Rerun icon" className={`w-4 h-4 ${isRerunning || disableRerun ? "opacity-50" : ""}`}/>
                  Rerun Test
                </button>

                {testCase.status !== "PASSED" && user?.role === "qa" && (
                  <>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={disableCreateDefect}
                    className={`px-8 py-2 rounded-lg flex items-center gap-2 transition-all
                      ${isRerunning || disableCreateDefect
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5"}
                    `}
                    title={
                      disableCreateDefect
                        ? "A defect is already active and being handled"
                        : ""
                    }
                  >
                    <img
                      src="/assets/icon/defect.svg"
                      alt="Defect icon"
                      className={`w-4 h-4 ${disableCreateDefect ? "opacity-50" : ""}`}
                    />
                    Create Defect
                  </button>


                    <CreateDefectModal
                      transition
                      className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                      isOpen={isModalOpen}
                      onClose={() => setIsModalOpen(false)}
                      testCaseName={testCase.testName}   
                      testSpecId={testCase.id}           
                    />
                  </>
                )}
              </div>
            </div>
            
            {/* Details */}
            {defectDetails && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h5 className="text-lg font-semibold mb-4">Details</h5>

                <div className={`grid grid-cols-1 ${colsClass} ${gapClass}`}>
                  {/* Assignee */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-3.5">Assignee</p>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-user text-gray-400 text-sm"></i>
                      <span className="text-sm text-gray-900 font-medium">
                        {defectDetails.assignDev?.username || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Priority</p>
                    <span
                      className={`inline-block px-5 py-1.5 rounded-lg text-xs font-semibold uppercase ${getPriorityClass(
                        defectDetails.priority
                      )}`}
                    >
                      {defectDetails.priority}
                    </span>
                  </div>

                  {/* Task Status */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Task Status</p>
                    <span
                      className={`inline-block px-5 py-1.5 rounded-full text-xs font-semibold ${getTaskStatusClass(
                        defectDetails.status
                      )}`}
                    >
                      {defectDetails.status}
                    </span>
                  </div>

                  {/* Created */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-3.5">Created At</p>
                    <span className="text-sm text-gray-900 font-medium">
                      {new Date(defectDetails.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Updated */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-3.5">
                      Update Task Status At
                    </p>
                    <span className="text-sm text-gray-900 font-medium">
                      {new Date(defectDetails.updated_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  {showActionsSection && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-3.5">
                        Actions
                      </p>

                      <div className="flex items-center gap-2">
                        {showCompleteAction && (
                          <button
                            onClick={handleCompleteTask}
                            className="w-6 h-6 flex items-center justify-center rounded-sm
                                      bg-green-600 text-white hover:bg-green-700"
                            title="Complete Task"
                          >
                            <i className="fa-solid fa-check text-sm"></i>
                          </button>
                        )}

                        {showDecisionAction && (
                          <button
                            onClick={handleDecisionQA}
                            className="w-6 h-6 flex items-center justify-center rounded-sm 
                                      bg-yellow-500 text-white hover:bg-yellow-600"
                            title="QA Decision"
                          >
                            <i className="fa-solid fa-magnifying-glass text-sm"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 2: Reopen metadata */}
                {showReopen && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                    {/* Reopened At */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-3.5">Reopened At</p>
                      <span className="text-sm text-gray-900 font-medium">
                        {formatDateTime(defectDetails.reopenedAt)}
                      </span>
                    </div>

                    {/* Reopened By */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-3.5">Reopened By</p>
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-user-check text-gray-400 text-sm"></i>
                        <span className="text-sm text-gray-900 font-medium">
                          {defectDetails.reopened_by?.username || "-"}
                        </span>
                      </div>
                    </div>

                    {/* sisanya kosong biar sejajar 6 kolom */}
                    <div className="hidden md:block" />
                    <div className="hidden md:block" />
                    <div className="hidden md:block" />
                    <div className="hidden md:block" />
                  </div>
                )}
              </div>
            )}

            {testCase.status === "PASSED" ? (
              <div className="bg-green-100 -mx-6 px-6 py-8 -mb-6 rounded-b-2xl justify-center flex flex-col items-center text-center">
                <img src="/assets/icon/checkbox.svg" alt="Check icon" className='pt-6'/>
                <h1 className="text-4xl font-semibold mb-2 mt-8">Test Case Passed </h1>
                <p className='italic pb-6 mt-2 text-lg'>The case <span className='font-medium'>{testCase.name}</span> passed as expected</p>
              </div>
            ) : (
              <>
                {/* Error Details Section */}
                {testCase.errorMessage && (
                  <div className="bg-[#ff3e3e16] -mx-6 px-6 py-6 mb-6">
                    <h5 className="text-lg font-semibold text-red-700 mb-4">Error Details</h5>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-red-700 whitespace-pre-wrap text-medium">
                        {testCase.errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Execution Record Section */}
                {testCase.screenshotUrl && (
                  <div className="mt-6">
                    <h5 className="text-lg font-semibold mb-4">Failure Evidence</h5>
                    <div className="bg-gray-100 rounded-lg p-6 relative">
                      <img
                        src={`http://localhost:3000/screenshots/${testCase.screenshotUrl}`}
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
        name= {rerunTestName}
      />
    </div>
  );
}