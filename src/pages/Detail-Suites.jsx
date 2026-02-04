import React from 'react';
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import CreateDefectModal from '../components/createDefectModal';
import { useRerunTest } from '../context/useRerunTest';
import RerunLoadingModal from '../components/RerunLoadingModal';
import { apiFetch } from '../utils/apifetch';
import API from "../config/api.jsx";

export default function DetailSuites() {
  // FETCH USER LOGIN Mengambil data user login untuk kontrol role-based action
  const [user, setUser] = useState(null);

  // Fetch data user dari endpoint /auth/me (menggunakan cookie via credentials)
  const fetchUser = async () => {
    try {
      const res = await apiFetch("/auth/me", {
        credentials: "include",
      });

      // Kalau response tidak OK, stop (tidak update state user)
      if (!res.ok) return;

      // Simpan data user ke state
      const data = await res.json();
      setUser(data);
    } catch (err) {
      // Logging jika gagal fetch user
      console.error("FETCH USER ERROR:", err);
    }
  };

  // Fetch user sekali ketika komponen pertama kali mount
  useEffect(() => {
    fetchUser();
  }, []);

  //  RE RUN STATE State dan handler rerun testcase (progress & nama testcase)
  const { rerun, isRerunning, progress, rerunTestName } = useRerunTest();

  // Menyimpan status rerun sebelumnya untuk mendeteksi transisi running -> selesai
  const [wasRerunning, setWasRerunning] = useState(false);

  // Ambil state dari react-router (data yang dikirim dari halaman sebelumnya)
  const { state } = useLocation();

  // id testcase yang dipilih dari halaman list suites
  const testCaseId = state?.testCaseId;

  // FETCH TEST CASE DETAILS Mengambil detail testcase berdasarkan id (diambil dari grouped-testcases)
  const [testCase, setTestCase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalisasi status agar konsisten (BROKEN dianggap FAILED)
  const normalizeStatus = (status) => {
    if (status === 'PASSED') return 'PASSED';
    if (status === 'FAILED' || status === 'BROKEN') return 'FAILED';
    return status;
  };

  // Convert durasi ms -> "Xm Ys"
  const formatDuration = (ms) => {
    if (!ms) return '-';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
  };

  // Fetch testcase detail berdasarkan testCaseId
  const fetchTestCase = async () => {
    try {
      setLoading(true); // mulai loading

      // Ambil semua suite + testcase, lalu cari testcase yang sesuai id
      const res = await apiFetch(
        "/api/grouped-testcases",
        { credentials: "include" }
      );
      const data = await res.json();
      // cari test case dari semua suite

      for (const suite of data) {
        const found = suite.testCases.find(tc => tc.id === testCaseId);
        if (found) {
          // Mapping field dari response ke struktur yang dipakai halaman detail
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

          // Simpan detail testcase ke state
          setTestCase(next);
          return next;
        }
      }

      // Jika testcase tidak ditemukan
      setTestCase(null);
    } catch (err) {
      // Logging error fetch testcase
      console.error(err);
      setTestCase(null);
    } finally {
      setLoading(false); // selesai loading
    }
  };

  // Saat testCaseId berubah / pertama kali ada, fetch detail testcase
  useEffect(() => {
    if (testCaseId) {
      fetchTestCase();
    }
  }, [testCaseId]);


  // Class badge status PASSED/FAILED untuk UI
  const getStatusBadgeClass = (status) => {
    if (status === 'PASSED') return 'bg-green-100 text-green-700 min-w-[80px]';
    if (status === 'FAILED') return 'bg-red-100 text-red-700 min-w-[100px]';
    return '';
  };

  // DEFECT STATE Mengambil defect aktif untuk testcase ini (untuk kontrol action QA/DEV)
  const [defectDetails, setDefectDetails] = useState(null);
  // console.log("defectDetails full:", defectDetails);

  // Fetch defect aktif berdasarkan testCase.id (testSpecId)
  const fetchActiveDefect = async () => {
    // Jika testcase belum siap, kosongkan defect
    if (!testCase) {
      setDefectDetails(null);
      return;
    }

    try {
      const res = await apiFetch(
        `/api/defects/active?testSpecId=${testCase.id}`,
        {
          credentials: "include",
        }
      );

      // Jika tidak OK, anggap tidak ada defect aktif
      if (!res.ok) {
        setDefectDetails(null);
        return;
      }

      // Ambil defect data dari response
      const json = await res.json();
      const defect = json?.data || null;

      // Jika defect disembunyikan (hidden), treat sebagai tidak ada defect
      if (defect && (defect.is_hidden === true || String(defect.is_hidden) === "1")) {
        setDefectDetails(null);
        return;
      }

      // Simpan defect detail ke state
      setDefectDetails(defect);
      return defect;
    } catch (e) {
      // Logging error fetch defect
      console.error("FETCH ACTIVE DEFECT ERROR:", e);
      setDefectDetails(null);
      return null;
    }
  };

  // Fetch defect aktif setiap kali testcase berubah (misal pindah testcase)
  useEffect(() => {
    fetchActiveDefect();
  }, [testCase]);

  // Penting: refetch defect setelah modal ditutup (supaya data sync setelah create/update)
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    if (!isModalOpen) fetchActiveDefect();
  }, [isModalOpen]);

  // Helper class untuk badge priority (High/Medium/Low)
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'High': return 'bg-[#FFCDCF] text-[#BD0108]';
      case 'Medium': return 'bg-[#FFEAD2] text-[#FF6200]';
      case 'Low': return 'bg-[#EFEFEF] text-[#757373]';
      default: return 'bg-gray-400 text-white';
    }
  };

  // Helper class untuk badge status issue  (To Do/In Progress/Done)
  const getTaskStatusClass = (status) => {
    switch(status) {
      case 'To Do': return 'bg-[#B9B9B9] text-[#323232]';
      case 'In Progress': return 'bg-[#FFFAC6] text-[#CC7A00]';
      case 'Done': return 'bg-[#E5FFE5] text-[#006600]';
      default: return 'bg-gray-400 text-white';
    }
  };

  // Disable create defect jika sudah ada defect aktif (To Do/In Progress/Done)
  const disableCreateDefect =
    defectDetails &&
    (defectDetails.status === "To Do" || defectDetails.status === "In Progress" || defectDetails.status === "Done");

  // EARLY RETURN Jika halaman detail dibuka tanpa testCaseId dari routing state
  if (!testCaseId) {
    return (
      <div className="flex-grow ml-[260px] p-8 min-h-screen overflow-y-auto">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">No test case selected.</p>
        </div>
      </div>
    );
  }


  // RERUN POLICY aturan rerun berdasarkan status defect + role user
  const getRerunPolicy = (() => {
    // Default: boleh rerun kalau tidak ada defect aktif
    if (!defectDetails) {
      return {
        disabled: false,
        reason: "",
      };
    }

    const status = defectDetails.status;

    // Saat issue  masih dikerjakan DEV: QA dilarang rerun, DEV boleh rerun
    if (["To Do", "In Progress"].includes(status)) {
      if (user?.role === "qa") {
        return {
          disabled: true,
          reason: "Rerun is disabled while this issue is being worked on by the developer.",
        };
      }
      return { disabled: false, reason: "" };
    }

    // Saat issue  Done (fase verifikasi): DEV dilarang rerun, QA boleh rerun
    if (status === "Done") {
      if (user?.role === "dev") {
        return {
          disabled: true,
          reason: "Rerun is disabled while this issue is being verified by QA.",
        };
      }
      return { disabled: false, reason: "" };
    }

    // Default fallback
    return { disabled: false, reason: "" };
  })();

  const disableRerun = isRerunning || getRerunPolicy.disabled;

  // RERUN VALIDATION membandingkan waktu lastRunAt testcase vs updated_at defect Done
  const isRerunAfterDone = (lastRunAt, doneUpdatedAt) => {
    if (!lastRunAt) return false;
    if (!doneUpdatedAt) return false;

    const lastRun = new Date(lastRunAt).getTime();
    const doneAt = new Date(doneUpdatedAt).getTime();

    return lastRun > doneAt;
  };

  // rerunValid = rerun terakhir terjadi setelah issue  Done terakhir diupdate
  const rerunValid = isRerunAfterDone(testCase?.lastRunAt, defectDetails?.updated_at);

  // Complete Action untuk QA muncul jika hasil rerun valid dan PASSED
  const showCompleteAction =
    user?.role === "qa" &&
    defectDetails?.status === "Done" &&
    rerunValid &&
    testCase?.status === "PASSED";

  // Handle complete issue  (menghapus issue  dari kanban board)
  const handleCompleteTask = async () => {
    // Konfirmasi sebelum complete
    const result = await Swal.fire({
      title: "Complete this issue?",
      html: `
        <p class="text-sm text-gray-500">
          This issue will be removed from the kanban board.
        </p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, complete",
      cancelButtonText: "Cancel",
      reverseButtons: false,
    });

    // Jika user cancel, stop
    if (!result.isConfirmed) return;

    // Hit API untuk complete issue 
    const res = await apiFetch(
      `/api/issues/${defectDetails.id}/complete`,
      {
        method: "PATCH",
        credentials: "include",
      }
    );

    // Jika gagal, tampilkan error swal
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

    // Jika sukses, tampilkan success swal
    Swal.fire({
      icon: "success",
      title: "Issue completed",
      html: `
        <p class="text-sm text-gray-500">
          This issue has been successfully completed.
        </p>
      `,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    // Reset defectDetails agar UI hide, lalu sync ulang ke server
    setDefectDetails(null);
    await fetchActiveDefect();
  };

  // SweetAlert Rerun Result Notification berdasarkan status  terbaru
  useEffect(() => {
    // Trigger saat sebelumnya rerunning dan sekarang sudah selesai
    if (wasRerunning && !isRerunning) {
      (async () => {
        // 1) ambil status testcase terbaru
        const latest = await fetchTestCase();

        // 2) ambil defect/issue  terbaru
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
                      Test case <b>${rerunTestName}</b> still failed.
                    </p>`,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
            });
            return;
          }

          // Failed BEFORE Done (pesan default)
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

    // Update tracker status rerun sebelumnya
    setWasRerunning(isRerunning);
  }, [isRerunning, wasRerunning, rerunTestName]);

  // Decision Action untuk QA memilih reopen atau create defect baru
  const showDecisionAction =
    user?.role === "qa" &&
    defectDetails?.status === "Done" &&
    rerunValid &&
    testCase?.status === "FAILED";

  //  Reopen issue mengubah status issue ke To Do
  const reopenTask = async () => {
    console.log("Reopen API hit:", defectDetails.id);

    const taskId = defectDetails?.id;

    console.log("REOPEN: taskId =", taskId);

    // Validasi taskId
    if (!taskId) {
      return Swal.fire({
        icon: "error",
        title: "Issue not found",
        html: `
          <p class="text-sm text-gray-500">
            This Issue ID could not be found. Please refresh the page and try again.
          </p>
        `,
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    }

    // Konfirmasi sebelum reopen
    const confirm = await Swal.fire({
      title: "Reopen this issue?",
      html: `
        <p class="text-sm text-gray-500">
          This issue status will be moved back to <b>To Do</b><br/>
          and recorded as reopened.
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reopen",
      cancelButtonText: "Cancel",
      reverseButtons: false,
    });

    if (!confirm.isConfirmed) return;

    console.log("CALLING API: /api/issues/" + taskId + "/reopen");

    // Hit API reopen
    const res = await apiFetch(`/api/issues/${taskId}/reopen`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    console.log("REOPEN response status:", res.status);

    const body = await res.json().catch(() => ({}));
    console.log("REOPEN response body:", body);

    // Jika gagal, tampilkan error swal
    if (!res.ok) {
      return Swal.fire({
        icon: "error",
        title: "Failed to reopen issue",
        html: `
          <p class="text-sm text-gray-500">
            ${body.message || "This issue could not be reopened. Please try again."}
          </p>
        `,
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 3000,
      });
    }

    // Jika sukses, tampilkan success swal dan refresh defect
    Swal.fire({
      icon: "success",
      title: "Issue reopened",
      html: `
        <p class="text-sm text-gray-500">
          This issue has been successfully reopened.
        </p>
      `,
      timerProgressBar: true,
      timer: 3000,
    });

    await fetchActiveDefect(); // refresh data defect
  };

   // QA memilih: apakah issue sama (reopen) atau issue baru (create defect baru)
  const handleDecisionQA = async () => {
    const result = await Swal.fire({
      title: "Is this the same issue?",
      html: `
      <div style="display:flex; justify-content:center; margin-top:8px;">
        <div style="
          background:#eff6ff;
          border:1px solid #bfdbfe;
          border-radius:8px;
          padding:12px 14px;
          max-width:360px;
          display:flex;
          gap:10px;
          align-items:flex-start;
          color:#1d4ed8;
          font-size:14px;
          text-align:left;
        ">
          <svg
            style="width:20px; height:20px; flex-shrink:0; margin-top:2px; fill:#3b82f6;"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>

          <div>
            <strong>Tip:</strong><br/>
            If <b>Yes</b>, this issue will be reopened.<br/>
            If <b>No</b>, a new defect will be created.
          </div>
        </div>
      </div>
      `,
      icon: "question",
      showCloseButton: true,
      showCancelButton: false,

      showDenyButton: true,
      confirmButtonColor: "#16A34A",
      denyButtonColor: "#ef4444",

      confirmButtonText: "Yes",
      denyButtonText: "No",

      reverseButtons: false,
    });

    // Jika dismiss (klik X / klik luar), stop
    if (result.isDismissed) return;

    // YES -> reopen issue 
    if (result.isConfirmed) {
      await reopenTask();
      return;
    }

    // NO -> buka modal create defect baru
    if (result.isDenied) {
      setIsModalOpen(true);
    }
  };

  /* ======================================================
   * UI HELPERS (layout)
   * ====================================================== */
  // Flag untuk menampilkan section action (complete / decision)
  const showActionsSection = showCompleteAction || showDecisionAction;

  // Format datetime untuk tampilan (fallback "-")
  const formatDateTime = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID");
  };

  // Flag untuk menampilkan info bahwa issue  pernah di-reopen
  const showReopen = !!defectDetails?.reopenedAt;

  // Menentukan jumlah kolom grid untuk section action
  const colsClass = showActionsSection ? "md:grid-cols-6" : "md:grid-cols-5";
  const gapClass = showActionsSection ? "gap-8" : "gap-6";


  // ====================== RENDERING UI ==========================
  return (
    // Container utama halaman detail (offset sidebar + padding + scroll)
    <div className="flex-grow ml-[260px] p-8 min-h-screen overflow-y-auto">
      {loading ? (
        // ====================== LOADING STATE ======================
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Loading test case...</p>
        </div>
      ) : testCase ? (
        // ====================== MAIN CONTENT (TESTCASE FOUND) ======================
        <>
          {/* Back Navigation: kembali ke halaman suites */}
          <Link
            to="/suites"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back to Suites</span>
          </Link>

          {/* Page Title */}
          <h2 className="text-3xl font-semibold mb-6">Detail Suites</h2>

          {/* Main Card: wrapper utama detail testcase */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {/* Test Case Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
              <div>
                {/* Judul testcase */}
                <h5 className="text-xl font-semibold mb-3">{testCase.testName}</h5>

                {/* Meta info testcase (status, duration, code, last run) */}
                <div className="flex items-center gap-4">
                  {/* Badge status PASSED/FAILED */}
                  <span
                    className={`px-8 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                      testCase.status
                    )}`}
                  >
                    {testCase.status}
                  </span>

                  {/* Durasi */}
                  <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-regular fa-clock"></i>
                    {testCase.duration}
                  </span>

                  {/* Code test case */}
                  <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-regular fa-file"></i>
                    {testCase.name}
                  </span>

                  {/* Waktu terakhir run */}
                  <span className="text-gray-500 flex items-center gap-1">
                    <i className="fa-solid fa-flag-checkered"></i>
                    {testCase.lastRunAt
                      ? new Date(testCase.lastRunAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                </div>
              </div>
              {/* ACTIONS BUTTON */}
              <div className="flex gap-3">
                {/* Button rerun testcase */}
                <button
                  onClick={() => {
                    // Safety: jika sedang rerun atau policy disable, jangan jalan
                    if (disableRerun) return;

                    // Trigger rerun dari hook
                    rerun(testCase);
                  }}
                  disabled={disableRerun}
                  title={getRerunPolicy.reason} // tooltip
                  className={`px-8 py-2 rounded-lg flex items-center gap-2 transition-all
                      ${
                        disableRerun
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-white border border-gray-300 hover:shadow-md hover:-translate-y-0.5"
                      }
                    `}
                >
                  <img
                    src="/assets/icon/rerun.svg"
                    alt="Rerun icon"
                    className={`w-4 h-4 ${disableRerun ? "opacity-50" : ""}`}
                  />
                  Rerun Test
                </button>

                {/* Create defect hanya untuk QA dan hanya jika testcase tidak PASSED */}
                {testCase.status !== "PASSED" && user?.role === "qa" && (
                  <>
                    {/* Button create defect */}
                    <button
                      onClick={() => setIsModalOpen(true)}
                      disabled={disableCreateDefect}
                      className={`px-8 py-2 rounded-lg flex items-center gap-2 transition-all
                        ${
                          isRerunning || disableCreateDefect
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-black text-white hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5"
                        }
                      `}
                      // Tooltip jika create defect disabled karena sudah ada defect aktif
                      title={disableCreateDefect ? "Create Defect is disabled due to an active defect." : ""}
                    >
                      <img
                        src="/assets/icon/defect.svg"
                        alt="Defect icon"
                         className={`w-4 h-4 transition
                          ${disableCreateDefect
                            ? "filter invert brightness-60 opacity-40"
                            : ""}
                        `}
                      />
                      Create Defect
                    </button>

                    {/* Modal create defect (dibuka via isModalOpen) */}
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

           {/* Details Section menampilkan info issue  defect */}
            {defectDetails && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h5 className="text-lg font-semibold mb-4">Details</h5>

                {/* Grid detail defect (jumlah kolom dinamis via colsClass & gapClass) */}
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

                  {/* issue  Status */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Issue Status</p>
                    <span
                      className={`inline-block px-5 py-1.5 rounded-full text-xs font-semibold ${getTaskStatusClass(
                        defectDetails.status
                      )}`}
                    >
                      {defectDetails.status}
                    </span>
                  </div>

                  {/* Created At */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-3.5">Created At</p>
                    <span className="text-sm text-gray-900 font-medium">
                      {new Date(defectDetails.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Updated At */}
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-3.5">
                      Update Issue Status At
                    </p>
                    <span className="text-sm text-gray-900 font-medium">
                      {new Date(defectDetails.updated_at).toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Actions */}
                  {showActionsSection && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-3.5">Actions</p>

                      <div className="flex items-center gap-2">
                        {/* Complete issue  (QA + Done + rerun valid + PASSED) */}
                        {showCompleteAction && (
                          <button
                            onClick={handleCompleteTask}
                            className="w-6 h-6 flex items-center justify-center rounded-sm
                                        bg-green-600 text-white hover:bg-green-700"
                            title="Complete Issue"
                          >
                            <i className="fa-solid fa-check text-sm"></i>
                          </button>
                        )}

                        {/* QA Decision */}
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

                {/* Menampilkan Reopen */}
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

                    {/* Spacer kosong biar layout tetap rapi di grid */}
                    <div className="hidden md:block" />
                    <div className="hidden md:block" />
                    <div className="hidden md:block" />
                    <div className="hidden md:block" />
                  </div>
                )}
              </div>
            )}

           {/* Result Section */}
            {testCase.status === "PASSED" ? (
              // ====================== PASSED STATE ======================
              <div className="bg-green-100 -mx-6 px-6 py-8 -mb-6 rounded-b-2xl justify-center flex flex-col items-center text-center">
                <img src="/assets/icon/checkbox.svg" alt="Check icon" className="pt-6" />
                <h1 className="text-4xl font-semibold mb-2 mt-8">Test Case Passed</h1>
                <p className="italic pb-6 mt-2 text-lg">
                  The case <span className="font-medium">{testCase.name}</span> passed as expected
                </p>
              </div>
            ) : (
              // ====================== FAILED/NOT PASSED STATE ======================
              <>
                {/* Error Details Section: tampil jika ada errorMessage */}
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

                {/* Execution Screenshot Section: bukti screenshot kegagalan */}
                {testCase.screenshotUrl && (
                  <div className="mt-6">
                    <h5 className="text-lg font-semibold mb-4">Failure Evidence</h5>
                    <div className="bg-gray-100 rounded-lg p-6 relative">
                      <img
                        src={`${API}/screenshots/${testCase.screenshotUrl}`}
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
        // ====================== EMPTY STATE (NO TESTCASE FOUND) ======================
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">No data found.</p>
        </div>
      )}

      {/* Modal Rerun -> progress re run */}
      <RerunLoadingModal
        open={isRerunning}
        progress={progress}
        name={rerunTestName}
      />
    </div>
  );

}