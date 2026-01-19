import { useState } from "react";

export function useRerunTest() {
  const [isRerunning, setIsRerunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rerunTestName, setRerunTestName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | success | error

  const rerun = async (testCase) => {
    console.log("RERUN INPUT:", testCase);

    const resolveTestName = (tc = {}) =>
      tc.name ?? tc.testName ?? tc.suiteName ?? "-";

    try {
      setIsRerunning(true);
      setProgress(0);
      setRerunTestName(resolveTestName(testCase));
      setStatus("running");

      // ✅ pastikan testSpecId tersedia
      const testSpecId = testCase?.id ?? testCase?.testSpecId;
      if (!testSpecId) {
        throw new Error("testSpecId tidak ditemukan pada testCase");
      }
      if (!testCase?.specPath) {
        throw new Error("specPath tidak ditemukan pada testCase");
      }

      // ✅ trigger rerun
      const res = await fetch("http://localhost:3000/api/jenkins/rerun/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ penting kalau backend pakai session/cookie auth
        body: JSON.stringify({
          scope: "SPEC",
          target: testCase.specPath,
          testSpecId, // ✅ tambahan untuk backend guard
        }),
      });

      // ✅ handle non-200 (403 / 400 / 500)
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        // backend kamu sudah kirim message
        const msg = payload?.message || "Rerun ditolak oleh sistem.";
        throw new Error(msg);
      }

      const { queueUrl } = payload;
      if (!queueUrl) throw new Error("queueUrl tidak ditemukan dari server.");

      // resolve queue → build number
      let buildNumber = null;
      while (!buildNumber) {
        const q = await fetch(
          `http://localhost:3000/api/jenkins/queue/resolve?queueUrl=${encodeURIComponent(queueUrl)}`,
          { credentials: "include" }
        );
        const data = await q.json().catch(() => ({}));
        buildNumber = data.buildNumber;
        await new Promise((r) => setTimeout(r, 2000));
      }

      // polling progress
      let finished = false;
      while (!finished) {
        const p = await fetch(
          `http://localhost:3000/api/jenkins/build/${buildNumber}/progress`,
          { credentials: "include" }
        );
        const data = await p.json().catch(() => ({}));

        setProgress(data.progress ?? 0);
        finished = Boolean(data.finished);

        await new Promise((r) => setTimeout(r, 2000));
      }

      setProgress(100);
      setStatus("success");
      return true; // optional: biar caller tau sukses
    } catch (err) {
      console.error(err);
      setStatus("error");
      // ✅ lempar lagi supaya page bisa Swal message (403 reason, dsb)
      throw err;
    } finally {
      setIsRerunning(false);
    }
  };

  return {
    rerun,
    isRerunning,
    progress,
    rerunTestName,
    status,
  };
}
