import { useState } from "react";

export function useRerunTest() {
  const [isRerunning, setIsRerunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rerunTestName, setRerunTestName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | success | error

  const rerun = async (testCase) => {
    console.log("RERUN INPUT:", testCase);

    try {
      
      const resolveTestName = (tc = {}) =>
        tc.name ??
        tc.testName ??
        tc.suiteName ??
        "-";


      setIsRerunning(true);
      setProgress(0);
      setRerunTestName(resolveTestName(testCase));
      setStatus("running");

      //  trigger rerun
      const res = await fetch("http://localhost:3000/api/jenkins/rerun/spec", {    
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "SPEC",
          target: testCase.specPath,
        }),

      });

      const { queueUrl } = await res.json();

      //  resolve queue → build number
      let buildNumber = null;
      while (!buildNumber) {
        const q = await fetch(
          `http://localhost:3000/api/jenkins/queue/resolve?queueUrl=${encodeURIComponent(queueUrl)}`
        );
        const data = await q.json();
        buildNumber = data.buildNumber;
        await new Promise(r => setTimeout(r, 2000));
      }

      //  polling progress
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

      //  selesai
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
    status,
  };
}
