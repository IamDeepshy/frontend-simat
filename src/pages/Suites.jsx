import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRerunTest } from '../context/useRerunTest';
import RerunLoadingModal from '../components/RerunLoadingModal';
import Swal from 'sweetalert2';

const ITEMS_PER_PAGE = 5;
// export default function DetailSuites() {

export default function TestCaseAccordion() {
  // Menyimpan data user yang sedang login (default null sebelum berhasil di-fetch)
  const [user, setUser] = useState(null);

  // Ambil data user login dari endpoint /auth/me (pakai cookie via credentials: "include")
  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:3000/auth/me", {
        credentials: "include",
      });

      // Jika response tidak OK, hentikan proses (tidak update state user)
      if (!res.ok) return;

      // Parse JSON dan simpan ke state user
      const data = await res.json();
      setUser(data);
    } catch (err) {
      // Logging error jika gagal fetch user
      console.error("FETCH USER ERROR:", err);
    }
  };

  // Jalankan fetchUser sekali saat komponen pertama kali mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Ambil state & handler dari custom hook untuk rerun test
  const { rerun, isRerunning, progress, rerunTestName } = useRerunTest();

  // Menyimpan status rerunning sebelumnya untuk mendeteksi transisi dari "running" -> "selesai"
  const [wasRerunning, setWasRerunning] = useState(false);
  // Menyimpan id suite yang sedang dibuka di accordion
  const [expandedId, setExpandedId] = useState(null);
  // Menyimpan data suite + testcases yang sudah dimapping untuk UI
  const [testSuites, setTestSuites] = useState([]);
  // Flag loading saat fetch data
  const [loading, setLoading] = useState(true);
  // State pagination page yang aktif
  const [currentPage, setCurrentPage] = useState(1);
  // Filter status yang aktif: 'all' | 'passed' | 'failed'
  const [activeFilter, setActiveFilter] = useState('all');
  // Keyword pencarian untuk filter by search
  const [searchTerm, setSearchTerm] = useState('');

  // Normalisasi status agar konsisten (BROKEN dianggap FAILED)
  const normalizeStatus = (status) => {
    if (status === 'PASSED') return 'PASSED';
    if (status === 'FAILED' || status === 'BROKEN') return 'FAILED';
    return status;
  };

  // Format durasi dari ms ke "Xm Ys"
  const formatDuration = (ms) => {
    if (!ms) return '-';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
  };

  // Menyimpan id testcase terakhir yang direrun
  const [lastRerunId, setLastRerunId] = useState(null);

  // Ambil grouped testcases dari API 
  const fetchSuites = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/grouped-testcases", {
        credentials: "include",
      });

      const data = await res.json();

      // Mapping hasil API -> struktur suite + testCases yang siap dipakai UI
      const mapped = data.map((suite, idx) => ({
        id: `${suite.parentCode}-${idx}`,
        parentCode: suite.parentCode,
        totalTests: suite.totalTests,
        testCases: suite.testCases.map((tc) => ({
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

      // Simpan hasil mapping ke state utama
      setTestSuites(mapped);
      return mapped;
    } catch (err) {
      // Logging error fetch suite
      console.error(err);
    } finally {
      // Pastikan loading false baik sukses/gagal
      setLoading(false);
    }
  };

  // Saat komponen mount: reset pagination ke page 1 lalu fetch data suite
  useEffect(() => {
    setCurrentPage(1);
    fetchSuites();
  }, []);

  // Cek rerun setelah defect Done untuk validasi hasil verifikasi
  const isRerunAfterDone = (lastRunAt, doneUpdatedAt) => {
    if (!lastRunAt) return false;
    if (!doneUpdatedAt) return false;

    return new Date(lastRunAt).getTime() > new Date(doneUpdatedAt).getTime();
  };

  // Digunakan saat rerun selesai untuk cek status testcase
  const fetchTestCaseById = async (id) => {
    const res = await fetch("http://localhost:3000/api/grouped-testcases", {
      credentials: "include",
    });
    const data = await res.json();

    // Loop semua suite lalu cari testcase yang id-nya match
    for (const suite of data) {
      const found = suite.testCases.find((tc) => tc.id === id);
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

  // Jika tidak ada defect aktif atau defect disembunyikan, kembalikan null
  const fetchActiveDefectByTestSpecId = async (testSpecId) => {
    const res = await fetch(
      `http://localhost:3000/api/defects/active?testSpecId=${testSpecId}`,
      { credentials: "include" }
    );

    // Kalau tidak OK, anggap tidak ada defect aktif
    if (!res.ok) return null;

    const json = await res.json();
    const defect = json?.data || null;

    // Jika defect disembunyikan, treat sebagai tidak ada
    if (defect && (defect.is_hidden === true || String(defect.is_hidden) === "1")) {
      return null;
    }
    return defect;
  };

  // SweetAlert notifikasi hasil rerun setelah proses rerun selesai
  useEffect(() => {
    // Trigger hanya saat sebelumnya rerunning dan sekarang sudah tidak rerunning
    if (wasRerunning && !isRerunning) {
      (async () => {
        // Kalau tidak ada id rerun terakhir, tidak perlu lanjut
        if (!lastRerunId) return;

        // Ambil status testcase terbaru + defect terbaru
        const latest = await fetchTestCaseById(lastRerunId);
        const latestDefect = await fetchActiveDefectByTestSpecId(lastRerunId);

        // Status terbaru testcase (PASSED/FAILED/null)
        const status = latest?.status || null;

        // CASE: rerun berhasil PASSED -> tampilkan alert success dan refresh list
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

        // Rerun FAILED 
        if (status === "FAILED") {
          // Cek apakah defect sudah Done (masuk fase verifikasi)
          const taskDone = latestDefect?.status === "Done";
          // Cek apakah rerun dilakukan setelah defect Done terakhir diupdate (valid untuk verifikasi)
          const rerunValidNow = isRerunAfterDone(latest?.lastRunAt, latestDefect?.updated_at);

          if (taskDone && rerunValidNow) {
            // Menampilkan pesan still failed seetelah rerun
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
            // Jika rerun gagal
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

          // Refresh list setelah alert
          await fetchSuites();
        }
      })();
    }

    // Update tracker status rerun sebelumnya
    setWasRerunning(isRerunning);
  }, [isRerunning, wasRerunning, rerunTestName, lastRerunId]);

  
  // Toggle accordion: jika id sama -> tutup, kalau beda -> buka suite tersebut
  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Mengembalikan class badge sesuai status PASSED/FAILED
  const getStatusBadgeClass = (status) => {
    if (status === 'PASSED') return 'bg-green-100 text-green-700 min-w-[80px]';
    if (status === 'FAILED') return 'bg-red-100 text-red-700 min-w-[100px]';
    return '';
  };

  // Mapping class UI untuk issue status (To Do, In Progress, Done)
  const getTaskStatusClass = (status) => {
    switch (status) {
      case 'To Do':
        return 'bg-[#B9B9B9] text-[#323232]';
      case 'In Progress':
        return 'bg-[#FFFAC6] text-[#CC7A00]';
      case 'Done':
        return 'bg-[#E5FFE5] text-[#006600]';
      default:
        return '';
    }
  };

  // Filter testcase per suite berdasarkan filter status aktif (passed/failed/all)
  const filterTestCases = (testCases) => {
    if (activeFilter === 'passed') {
      return testCases.filter((tc) => tc.status === 'PASSED');
    }

    if (activeFilter === 'failed') {
      return testCases.filter((tc) => tc.status === 'FAILED');
    }

    return testCases; // all
  };

  // Hitung jumlah passed/failed setelah filter status diterapkan
  const getFilteredCounts = (suite) => {
    const filtered = filterTestCases(suite.testCases);

    const passed = filtered.filter((tc) => tc.status === 'PASSED').length;
    const failed = filtered.filter((tc) => tc.status === 'FAILED').length;

    return { passed, failed };
  };

  // Filter berdasarkan searchTerm (parentCode / suiteName / testName)
  const filterBySearch = (suite) => {
    if (!searchTerm) return suite.testCases;

    const keyword = searchTerm.toLowerCase();

    return suite.testCases.filter(
      (tc) =>
        suite.parentCode.toLowerCase().includes(keyword) ||
        tc.name.toLowerCase().includes(keyword) ||
        tc.testName.toLowerCase().includes(keyword)
    );
  };

  // Aturan disable rerun berdasarkan status issue & role user (qa/dev)
  const getRerunPolicy = (taskStatus, role) => {
    // Jika tidak ada issue/defect aktif, rerun boleh
    if (!taskStatus) {
      return { 
        disabled: false, 
        reason: "",
      };
    }

    // Saat issue  masih dikerjakan DEV: QA dilarang rerun, DEV boleh rerun
    if (["To Do", "In Progress"].includes(taskStatus)) {
      if (role === "qa") {
        return {
          disabled: true,
          reason: "Rerun is disabled while this issue is being worked on by the developer.",
        };
      }
      return { disabled: false, reason: "" };
    }

    // Saat issue  Done (fase verifikasi): DEV dilarang rerun, QA boleh rerun
    if (taskStatus === "Done") {
      if (role === "dev") {
        return {
          disabled: true,
          reason: "Rerun is disabled while this issue is being verified by QA.",
        };
      }
      return { disabled: false, reason: "" };
    }

    // Default fallback: rerun tetap boleh
    return { disabled: false, reason: "" };
  };


  // Apply filter status + filter search, lalu buang suite yang hasilnya kosong
  const filteredSuites = testSuites
    .map((suite) => {
      // Filter status (passed/failed)
      const statusFiltered = filterTestCases(suite.testCases);

      // Filter pencarian berdasarkan searchTerm
      const searchFiltered = filterBySearch({
        ...suite,
        testCases: statusFiltered,
      });

      return {
        ...suite,
        testCases: searchFiltered,
      };
    })
    // Hide suite kalau tidak ada testCase tersisa setelah filtering
    .filter((suite) => suite.testCases.length > 0);

  // Hitung total halaman pagination berdasarkan jumlah suite yang lolos filter
  const totalPages = Math.ceil(filteredSuites.length / ITEMS_PER_PAGE);

  // Ambil slice suite sesuai halaman yang aktif
  const paginatedSuites = filteredSuites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Tampilkan loading UI jika sedang fetch
  if (loading) {
    return <div className="ml-[260px] p-8">Loading...</div>;
  }

  // Kondisi list kosong setelah filtering selesai
  const isEmpty = !loading && filteredSuites.length === 0;

  // Empty karena search keyword ada, tapi hasilnya 0
  const isSearchEmpty = isEmpty && !!searchTerm?.trim();

  // Empty “normal” (bukan karena search)
  const isNormalEmpty = isEmpty && !searchTerm?.trim();

  // Role user
  const isQA = user?.role === "qa";

  // Tentukan teks empty state berdasarkan kondisi
  const emptyTitle = isSearchEmpty
    ? "No Results Found"
    : isQA
      ? "No Test Results Available"
      : "No Issues Assigned";
  // Deskripsi empty state berdasarkan kondisi
  const emptyDescription = isSearchEmpty
    ? `We couldn't find any test results matching “${searchTerm}”.`
    : isQA
      ? "You don't have any test results yet."
      : "You don't have any assigned defects right now.";

  // Disable tombol export jika tidak ada data yang bisa diexport
  const isExportDisabled = filteredSuites.length === 0;

  // Export report testcases ke CSV (berdasarkan filter status yang aktif)
  const exportToCSV = () => {
    if (!testSuites.length) return;

    // Header kolom CSV
    const headers = ['Code Test Case', 'Test Name', 'Status', 'Duration'];

    // Flatten data suite -> rows CSV
    const rows = testSuites.flatMap((suite) =>
      filterTestCases(suite.testCases).map((tc) => [
        suite.parentCode,
        tc.testName,
        tc.status,
        tc.duration,
      ])
    );

    // Gabungkan header + rows, lalu escape tanda kutip untuk format CSV
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    // Buat blob file CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Auto download dengan nama file berdasarkan tanggal hari ini (YYYY-MM-DD)
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

  // ================== RENDER UI =================

  return (
    // Container utama halaman (offset sidebar + padding + full height)
    <div className="ml-[260px] p-8 min-h-screen">

      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* Judul halaman */}
          <h1 className="text-3xl font-semibold">Suites</h1>

          {/* Subjudul / deskripsi halaman */}
          <p className="text-gray-500 mt-1">Manage and monitor your test suites</p>
        </div>

        {/* Tombol export report ke CSV */}
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
              ? "No data available for export"
              : "Export Report"
          }
        >
          {/* Icon export */}
          <img src="/assets/icon/export.svg" alt="Export icon" className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Search & Filter Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Search Bar */}
        <div className="lg:col-span-5">
          <div className="relative">
            {/* Icon search di dalam input */}
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

            {/* Input search untuk filter suite/testcase */}
            <input
              type="text"
              placeholder="Search suites..."
              value={searchTerm}
              onChange={(e) => {
                // Update kata kunci search
                setSearchTerm(e.target.value);

                // Reset pagination ke halaman 1 agar hasil search langsung terlihat dari awal
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        {user?.role === "qa" && (
          <div className="lg:col-span-7 flex gap-3">
            {/* Filter ALL */}
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

            {/* Filter PASSED */}
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

            {/* Filter FAILED */}
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

      {/* Search Info */}
      {searchTerm && (
        <p className="text-sm text-gray-500 mb-4">
          Menampilkan hasil pencarian untuk:
          <span className="font-medium"> "{searchTerm}"</span>
        </p>
      )}

      {/* Empty State */}
      {!loading && isEmpty && (
        <div className="bg-white border rounded-2xl p-12 text-center text-gray-600">
          <div className="flex flex-col items-center gap-4">
            <img
              src="/assets/icon/empty.svg"
              alt="No data"
              className="w-24 h-24 opacity-90"
            />

            <h3 className="text-2xl font-semibold text-gray-800">
              {emptyTitle}
            </h3>

            <p className="max-w-md text-sm text-gray-500">
              {emptyDescription}
            </p>
          </div>
        </div>
      )}


      {/* Accordion Suite List */}
      {paginatedSuites.map((suite) => {
        // Hitung jumlah passed & failed setelah filter aktif diterapkan
        const { passed, failed } = getFilteredCounts(suite);

        // Jika filter bukan 'all' dan suite tidak punya testcase yang match, skip render suite
        if (activeFilter !== 'all' && passed + failed === 0) {
          return null;
        }

        return (
          <div key={suite.id} className="bg-white border rounded-xl mb-4">
            {/* Header Accordion */}
            <button
              onClick={() => toggleAccordion(suite.id)}
              className="w-full p-5 flex justify-between items-center hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                {/* Chevron icon (rotate jika accordion expand) */}
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

                {/* Info suite */}
                <div>
                  <div className="font-semibold text-lg">{suite.parentCode}</div>
                  <div className="text-sm text-gray-500">{suite.totalTests} Test Cases</div>
                </div>
              </div>

              {/* Badge Summary */}
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

            {/* Content Accordion */}
            {expandedId === suite.id && (
              <table className="w-full border-t">
                {/* Header tabel */}
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Code Test Case</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Test Name</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Status</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Issue Status</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Duration</th>
                    <th className="px-6 py-3 text-center text-medium text-gray-600">Action</th>
                  </tr>
                </thead>

                {/* Body tabel: list testcase (sudah terfilter) */}
                <tbody className="divide-y divide-gray-200">
                  {filterTestCases(suite.testCases).map((tc, idx) => {
                    // Ambil kebijakan rerun berdasarkan issue status & role
                    const rerunPolicy = getRerunPolicy(tc.taskStatus, user?.role);

                    // Disable rerun jika sedang rerunning ATAU policy menyatakan disabled
                    const disableRerun = isRerunning || rerunPolicy.disabled;

                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        {/* Code testcase */}
                        <td className="px-6 py-4 text-center">
                          <div className="font-medium">{tc.name}</div>
                        </td>

                        {/* Nama test */}
                        <td className="px-6 py-4 text-center">
                          <div className="font-medium">{tc.testName}</div>
                        </td>

                        {/* Status passed/failed dengan badge */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-6 py-0.5 rounded-full text-sm font-medium ${getStatusBadgeClass(
                              tc.status
                            )}`}
                          >
                            {tc.status}
                          </span>
                        </td>

                        {/* issue status hanya ditampilkan jika testcase tidak PASSED */}
                        <td className="px-6 py-4 text-center">
                          {tc.status !== "PASSED" && (
                            <span className={`inline-block px-6 py-0.5 rounded-full text-sm font-medium ${getTaskStatusClass(tc.taskStatus)}`}>
                              {tc.taskStatus}
                            </span>
                          )}
                        </td>

                        {/* Durasi eksekusi testcase */}
                        <td className="px-6 py-4 text-center font-medium text-sm text-gray-500">
                          {tc.duration}
                        </td>

                        {/* Action: view detail + rerun */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-3">
                            {/* Link menuju halaman detail testcase (kirim state testCaseId) */}
                            <Link to="/detail-suites" state={{ testCaseId: tc.id }}>
                              <img src="/assets/icon/view.svg" className="w-5 h-5" />
                            </Link>

                            {/* Tombol rerun testcase sesuai policy */}
                            <button
                              onClick={() => {
                                // Safety: jika disable, jangan lakukan apa-apa
                                if (disableRerun) return;
                                // Simpan id testcase yang akan direrun untuk kebutuhan alert/status update
                                setLastRerunId(tc.id);
                                // Trigger rerun dari hook useRerunTest
                                rerun(tc);
                              }}
                              disabled={disableRerun}
                              className="hover:opacity-70 transition-opacity disabled:opacity-40"
                              // Tooltip reason jika rerun disabled oleh policy
                              title={rerunPolicy.disabled ? rerunPolicy.reason : ""}
                            >
                              <img src="/assets/icon/rerun.svg" alt="Rerun" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        {/* Info jumlah suite yang sedang ditampilkan */}
        <p className="text-sm text-gray-600">
          Menampilkan{' '}
          {filteredSuites.length === 0
            ? 0
            : (currentPage - 1) * ITEMS_PER_PAGE + 1}
          –
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredSuites.length)} dari{' '}
          {filteredSuites.length} suites
        </p>

        {/* Tombol kontrol pagination */}
        <div className="flex gap-2">
          {/* Tombol Previous */}
          <button
            disabled={totalPages === 0 || currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-2 border rounded disabled:opacity-40"
          >
            Previous
          </button>

          {/* Tombol nomor halaman */}
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

          {/* Tombol Next */}
          <button
            disabled={totalPages === 0 || currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-2 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Rerun Loading Modal */}
      <RerunLoadingModal
        open={isRerunning}
        progress={progress}
        name={rerunTestName}
      />
    </div>
  );

};
