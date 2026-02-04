import { useState } from "react";
import { apiFetch } from "../utils/apifetch";

export function useRerunTest() {
  const [isRerunning, setIsRerunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rerunTestName, setRerunTestName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | success | error

  // =========================
  // FUNCTION UTAMA: trigger rerun 1 testcase
  // =========================
  const rerun = async (testCase) => {
    console.log("RERUN INPUT:", testCase);

    const resolveTestName = (tc = {}) =>
      tc.name ?? tc.testName ?? tc.suiteName ?? "-";

    try {
      // set state awal rerun
      setIsRerunning(true);
      setProgress(0);
      setRerunTestName(resolveTestName(testCase));
      setStatus("running");

      // ambil testSpecId dari beberapa kemungkinan field
      const testSpecId = testCase?.id ?? testCase?.testSpecId;
      if (!testSpecId) {
        throw new Error("testSpecId was not found in the test case.");
      }
      // untuk rerun spec
      if (!testCase?.specPath) {
        throw new Error("specPath was not found in the test case.");
      }

      // trigger rerun ke backend (jenkins proxy)
      const res = await apiFetch("/api/jenkins/rerun/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // session/cookie auth
        body: JSON.stringify({
          scope: "SPEC", // rerun 1 spec file
          target: testCase.specPath, // path
          testSpecId, // id untuk backend guard
        }),
      });

      // handle respon trigger
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        // backend kirim message
        const msg = payload?.message || "Rerun was rejected by the system.";
        throw new Error(msg);
      }

      const { queueUrl } = payload;
      if (!queueUrl) throw new Error("queueUrl was not found on the server.");

      // resolve queue -> build number
      let buildNumber = null;
      while (!buildNumber) {
        const q = await fetch(
          `http://localhost:3000/api/jenkins/queue/resolve?queueUrl=${encodeURIComponent(queueUrl)}`,
          { credentials: "include" }
        );
        const data = await q.json().catch(() => ({}));
        buildNumber = data.buildNumber;
        // tunggu 2 detik sebelum coba lagi
        await new Promise((r) => setTimeout(r, 2000));
      }

      // polling progress build sampai finished
      let finished = false;
      while (!finished) {
        const p = await fetch(
          `http://localhost:3000/api/jenkins/build/${buildNumber}/progress`,
          { credentials: "include" }
        );
        const data = await p.json().catch(() => ({}));

        setProgress(data.progress ?? 0);
        finished = Boolean(data.finished);

        // tunggu 2 detik sebelum polling lagi
        await new Promise((r) => setTimeout(r, 2000));
      }

      setProgress(100);
      setStatus("success");
      return true; 
    } catch (err) {
      // error handling
      console.error(err);
      setStatus("error");
      // lempar lagi supaya page bisa Swal message (403 reason, dsb)
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
