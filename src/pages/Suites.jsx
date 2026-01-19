import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRerunTest } from '../context/useRerunTest';
import RerunLoadingModal from '../components/RerunLoadingModal';
import Swal from 'sweetalert2';

const ITEMS_PER_PAGE = 5;

const TestCaseAccordion = () => {
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

 /* ======================================================
   * RE RUN STATE
   * ====================================================== */
  const {
    rerun,
    isRerunning,
    progress,
    rerunTestName,
  } = useRerunTest();

  // untuk mendeteksi perubahan dari running -> selesai
  const [wasRerunning, setWasRerunning] = useState(false);

  /* ======================================================
   * LOCAL STATE
   * ====================================================== */
  const [expandedId, setExpandedId] = useState(null);
  const [testSuites, setTestSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  /* ======================================================
   * FETCH DATA
   * ====================================================== */
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

  const [lastRerunId, setLastRerunId] = useState(null);

  const fetchSuites = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:3000/api/grouped-testcases",
        { credentials: "include" }
      );
      const data = await res.json();

      const mapped = data.map((suite, idx) => ({
        id: `${suite.parentCode}-${idx}`,
        parentCode: suite.parentCode,
        totalTests: suite.totalTests,
        testCases: suite.testCases.map(tc => ({
          id: tc.id,
          name: tc.suiteName,
          testName: tc.testName,
          status: normalizeStatus(tc.status),
          duration: formatDuration(tc.durationMs),
          taskStatus: tc.taskStatus,
          taskAssignDev: tc.taskAssignDev,
          taskPriority: tc.taskPriority,
          errorMessage: tc.errorMessage,
          screenshotUrl: tc.screenshotUrl,
          specPath: tc.specPath,
          lastRunAt: tc.lastRunAt,
          runId: tc.runId,
        })),
      }));

      setTestSuites(mapped);
      return mapped; 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchSuites();
  }, []);

  const isRerunAfterDone = (lastRunAt, doneUpdatedAt) => {
    if (!lastRunAt) return false;
    if (!doneUpdatedAt) return false;

    return new Date(lastRunAt).getTime() > new Date(doneUpdatedAt).getTime();
  };

  // FAILED sebelum done
  const fetchTestCaseById = async (id) => {
    const res = await fetch("http://localhost:3000/api/grouped-testcases", { credentials: "include" });
    const data = await res.json();

    for (const suite of data) {
      const found = suite.testCases.find(tc => tc.id === id);
      if (found) {
        return {
          id: found.id,
          status: normalizeStatus(found.status),
          lastRunAt: found.lastRunAt,
        };
      }
    }
    return null;
  };

  // FAILED setelah done
  const fetchActiveDefectByTestSpecId = async (testSpecId) => {
    const res = await fetch(
      `http://localhost:3000/api/defects/active?testSpecId=${testSpecId}`,
      { credentials: "include" }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const defect = json?.data || null;

    if (defect && (defect.is_hidden === true || String(defect.is_hidden) === "1")) {
      return null;
    }
    return defect;
  };

  /* ======================================================
   * SWEETALERT – RERUN FINISHED
   * ====================================================== */
  useEffect(() => {
    if (wasRerunning && !isRerunning) {
      (async () => {
        if (!lastRerunId) return;

        const latest = await fetchTestCaseById(lastRerunId);
        const latestDefect = await fetchActiveDefectByTestSpecId(lastRerunId);

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
          await fetchSuites(); // refresh list
          return;
        }

        if (status === "FAILED") {
          const taskDone = latestDefect?.status === "Done";
          const rerunValidNow = isRerunAfterDone(
            latest?.lastRunAt, 
            latestDefect?.updated_at
          );

          if (taskDone && rerunValidNow) {
            // CASE FAILED
              Swal.fire({
                icon: "error",
                title: "Re-run failed",
                html: `<p class="text-sm text-gray-500">
                        Test case <b>${rerunTestName}</b> still failed.
                      </p>`,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
              });
            } else {
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
          await fetchSuites(); // refresh list
        }  
      })();
    }

  setWasRerunning(isRerunning);
  }, [isRerunning, wasRerunning, rerunTestName, lastRerunId]);

  /* ======================================================
   * HELPERS
   * ====================================================== */
  const toggleAccordion = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'PASSED') return 'bg-green-100 text-green-700 min-w-[80px]';
    if (status === 'FAILED') return 'bg-red-100 text-red-700 min-w-[100px]';
    return '';
  };

  const getTaskStatusClass = (status) => {
    switch(status) {
      case 'To Do': return 'bg-[#B9B9B9] text-[#323232]';
      case 'In Progress': return 'bg-[#FFFAC6] text-[#CC7A00]';
      case 'Done': return 'bg-[#E5FFE5] text-[#006600]';
      default: return '';
    }
  };

  const filterTestCases = (testCases) => {
    if (activeFilter === 'passed') {
      return testCases.filter(tc => tc.status === 'PASSED');
    }

    if (activeFilter === 'failed') {
      return testCases.filter(tc => tc.status === 'FAILED');
    }

    return testCases; // all
  };

  const getFilteredCounts = (suite) => {
    const filtered = filterTestCases(suite.testCases);

    const passed = filtered.filter(tc => tc.status === 'PASSED').length;
    const failed = filtered.filter(tc => tc.status === 'FAILED').length;

    return { passed, failed };
  };

  const filterBySearch = (suite) => {
    if (!searchTerm) return suite.testCases;

    const keyword = searchTerm.toLowerCase();

    return suite.testCases.filter(tc =>
      suite.parentCode.toLowerCase().includes(keyword) ||
      tc.name.toLowerCase().includes(keyword) ||
      tc.testName.toLowerCase().includes(keyword)
    );
  };

  // Logic disable rerun berdasarkan task status & role user
  const getRerunPolicy = (taskStatus, role) => {
    // kalau belum ada task/defect aktif (null/undefined/"")
    if (!taskStatus) {
      return { disabled: false, reason: "" };
    }

    // Saat task masih dikerjakan DEV
    if (["To Do", "In Progress"].includes(taskStatus)) {
      if (role === "qa") {
        return {
          disabled: true,
          reason: "Rerun disabled: task sedang dikerjakan DEV.",
        };
      }
      // dev
      return { disabled: false, reason: "" };
    }

    // Saat Done (masuk verifikasi QA)
    if (taskStatus === "Done") {
      if (role === "dev") {
        return {
          disabled: true,
          reason: "Rerun disabled: task sudah Done dan sedang diverifikasi QA.",
        };
      }
      // qa
      return { disabled: false, reason: "" };
    }

    // fallback
    return { disabled: false, reason: "" };
  };
  
  /* ======================================================
   * PAGINATION LOGIC
   * ====================================================== */

  const filteredSuites = testSuites
    .map(suite => {
      // filter status (passed / failed)
      const statusFiltered = filterTestCases(suite.testCases);

      // filter search
      const searchFiltered = filterBySearch({
        ...suite,
        testCases: statusFiltered
      });

      return {
        ...suite,
        testCases: searchFiltered
      };
    })
  // hide suite kalau tidak ada testCase tersisa
  .filter(suite => suite.testCases.length > 0);


  const totalPages = Math.ceil(filteredSuites.length / ITEMS_PER_PAGE);

  const paginatedSuites = filteredSuites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <div className="ml-[260px] p-8">Loading...</div>;
  }

  const isEmpty =
  !loading &&
  filteredSuites.length === 0;

   /* ======================================================
   * EXPORT REPORT TO CSV
   * ====================================================== */
  const isExportDisabled = filteredSuites.length === 0;

  const exportToCSV = () => {
    if (!testSuites.length) return;

    // HEADER CSV
    const headers = [
      'Code Test Case',
      'Test Name',
      'Status',
      'Duration',
    ];

    // FLATTEN DATA
    const rows = testSuites.flatMap((suite) =>
      filterTestCases(suite.testCases).map((tc) => [
        suite.parentCode,
        tc.testName,
        tc.status,
        tc.duration,
      ])
    );

    // GABUNG HEADER + ROW
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            `"${String(cell ?? '').replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\n');

    // BUAT FILE
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // AUTO DOWNLOAD
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `test-report-${new Date().toISOString().slice(0, 10)}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="ml-[260px] p-8 min-h-screen">

      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Suites</h1>
          <p className="text-gray-500 mt-1">Manage and monitor your test suites</p>
        </div>
         <button 
          onClick={exportToCSV}
          disabled={isExportDisabled}
          className={`px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all
              ${isExportDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5"}
            `}
            title={
              isExportDisabled
                ? "Tidak ada data untuk di-export"
                : "Export Report"
        }>
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset pagination saat search
              }}
              className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        {user?.role === "qa" && (
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
        )}
      </div>

      {/* INFO SEARCH */}
      {searchTerm && (
        <p className="text-sm text-gray-500 mb-4">
          Menampilkan hasil pencarian untuk: 
          <span className="font-medium"> "{searchTerm}"</span>
        </p>
      )}

      {/* ================= EMPTY STATE ================= */}
      {!loading && isEmpty && (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-600">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/assets/icon/empty.svg"
              alt="No data"
              className="w-24 h-24 opacity-90"
            />

            <h3 className="text-2xl font-semibold text-gray-800">
              No Tasks Assigned
            </h3>

            <p className="max-w-md text-sm text-gray-500">
              You don’t have any assigned defects right now.
            </p>
          </div>
        </div>
      )}


      {/* ================= ACCORDION LIST ================= */}
      {paginatedSuites.map((suite) => {
        const { passed, failed } = getFilteredCounts(suite);

        // kalau filter aktif & suite tidak punya test yang cocok, hide suite
        if (activeFilter !== 'all' && passed + failed === 0) {
          return null;
        }

        return (
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

              {/* BADGE */}
              <div className="flex gap-2">
                {(activeFilter === 'all' || activeFilter === 'passed') && passed > 0 && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium min-w-8">
                    {passed} Passed
                  </span>
                )}

                {(activeFilter === 'all' || activeFilter === 'failed') && failed > 0 && (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium min-w-20">
                    {failed} Failed
                  </span>
                )}
              </div>
            </button>

            {/* CONTENT */}
            {expandedId === suite.id && (
              <table className="w-full border-t">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Code Test Case</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Test Name</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Status</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Task Status</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Duration</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filterTestCases(suite.testCases).map((tc, idx) => {

                    const rerunPolicy = getRerunPolicy(tc.taskStatus, user?.role);
                    const disableRerun = isRerunning || rerunPolicy.disabled;

                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <div className="font-medium">{tc.name}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="font-medium">{tc.testName}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-6 py-0.5 rounded-full text-sm font-medium ${getStatusBadgeClass(
                              tc.status
                            )}`}
                          >
                            {tc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {tc.status !== "PASSED" && (
                            <span className={`inline-block px-6 py-0.5 rounded-full text-sm font-medium ${getTaskStatusClass(tc.taskStatus)}`}>
                              {tc.taskStatus}
                            </span>
                          )}

                        </td>
                        <td className="px-6 py-4 text-center font-medium text-sm text-gray-500">
                          {tc.duration}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-3">
                            <Link to="/detail-suites" state={{testCaseId: tc.id }}>
                              <img src="/assets/icon/view.svg" className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => {
                                if (disableRerun) return; // extra safety
                                setLastRerunId(tc.id);
                                rerun(tc);
                              }}
                              disabled={disableRerun}
                              className="hover:opacity-70 transition-opacity disabled:opacity-40"
                              title={rerunPolicy.disabled ? rerunPolicy.reason : ""}
                            >
                              <img src="/assets/icon/rerun.svg" alt="Rerun" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}


      {/* ================= PAGINATION ================= */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">
          Menampilkan{' '}
          {filteredSuites.length === 0
            ? 0
            : (currentPage - 1) * ITEMS_PER_PAGE + 1}
          –
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredSuites.length)} dari{' '}
          {filteredSuites.length} suites
        </p>


        <div className="flex gap-2">
          <button
            disabled={totalPages === 0 || currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className="px-3 py-2 border rounded disabled:opacity-40"
          >
            Previous
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
            disabled={totalPages === 0 || currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className="px-3 py-2 border rounded disabled:opacity-40"
          >
            Next
          </button>

        </div>
      </div>

      {/* Modal Re run */}
      <RerunLoadingModal
        open={isRerunning}
        progress={progress}
        name={rerunTestName}
      />


    </div>
  );
};

export default TestCaseAccordion;


