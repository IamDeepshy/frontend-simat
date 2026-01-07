import { useState } from "react";

export function useRerunTest() {
  const [isRerunning, setIsRerunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rerunTestName, setRerunTestName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | success | error

  const rerun = async (testCase) => {
    try {
      setIsRerunning(true);
      setProgress(0);
      setRerunTestName(testCase.name);
      setStatus("running");

      // 1️⃣ trigger rerun
      const res = await fetch("http://localhost:3000/api/jenkins/rerun/spec", {    
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "SPEC",
          target: testCase.specPath,
        }),

      });

      const { queueUrl } = await res.json();

      // 2️⃣ resolve queue → build number
      let buildNumber = null;
      while (!buildNumber) {
        const q = await fetch(
          `http://localhost:3000/api/jenkins/queue/resolve?queueUrl=${encodeURIComponent(queueUrl)}`
        );
        const data = await q.json();
        buildNumber = data.buildNumber;
        await new Promise(r => setTimeout(r, 2000));
      }

      // 3️⃣ polling progress
      let finished = false;
      while (!finished) {
        const p = await fetch(
          `http://localhost:3000/api/jenkins/build/${buildNumber}/progress`
        );
        const data = await p.json();

        setProgress(data.progress);
        finished = data.finished;

        await new Promise(r => setTimeout(r, 2000));
      }

      // ✅ selesai
      setProgress(100);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsRerunning(false);
    }
  };

  return {
    rerun,
    isRerunning,
    progress,
    rerunTestName,
    status, // ⬅️ PENTING
  };
}
