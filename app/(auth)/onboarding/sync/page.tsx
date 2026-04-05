"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import logoAI from "@/public/aiLogo.png"
import { redirect } from "next/navigation";
const STEPS = [
  {
    id: "validate",
    label: "Validating Data",
    sublabel: "Checking integrity and schema compatibility",
    duration: 2800,
    icon: "◎",
  },
  {
    id: "segment",
    label: "Segmenting Data",
    sublabel: "Splitting into training and evaluation sets",
    duration: 3200,
    icon: "⬡",
  },
  {
    id: "train",
    label: "Training Model",
    sublabel: "Running gradient descent across 48 epochs",
    duration: 4500,
    icon: "⟳",
  },
  {
    id: "metrics",
    label: "Generating Metrics",
    sublabel: "Computing accuracy, precision, recall & F1",
    duration: 2400,
    icon: "▦",
  },
];

type StepStatus = "idle" | "running" | "done";

export default function ProcessingPage() {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    STEPS.map(() => "idle")
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (currentStep < 0 || currentStep >= STEPS.length) return;
    const duration = STEPS[currentStep].duration;
    const interval = 30;
    const increment = (interval / duration) * 100;
    let current = 0;
    setProgress(0);
    const ticker = setInterval(() => {
      current += increment;
      if (current >= 100) {
        current = 100;
        clearInterval(ticker);
      }
      setProgress(current);
    }, interval);
    return () => clearInterval(ticker);
  }, [currentStep]);

  useEffect(() => {
    if (!started) return;

    let stepIndex = 0;

    const runStep = (index: number) => {
      if (index >= STEPS.length) {
        setFinished(true);
        redirect("/dashboard")
        return;
      }
      setCurrentStep(index);
      setStepStatuses((prev) => {
        const next = [...prev];
        next[index] = "running";
        return next;
      });
      setTimeout(() => {
        setStepStatuses((prev) => {
          const next = [...prev];
          next[index] = "done";
          return next;
        });
        runStep(index + 1);
      }, STEPS[index].duration);
    };

    runStep(stepIndex);
  }, [started]);

  useEffect(() => {
    setStarted(true)
  }, [])

  const totalDuration = STEPS.reduce((a, s) => a + s.duration, 0);
  const elapsed = STEPS.slice(0, currentStep).reduce((a, s) => a + s.duration, 0);
  const overallProgress = finished
    ? 100
    : currentStep < 0
    ? 0
    : ((elapsed + (progress / 100) * STEPS[currentStep]?.duration) / totalDuration) * 100;

  return (
    <>
      <style>{styles}</style>
      <div className="root">
        <div className="card">
          {/* Header */}
          <div className="card-header">
            <div className="logo-mark"><Image src={logoAI} alt="logo" width={50}/></div>
            <div className="header-text">
              <h1>{finished ? "All done" : started ? "AI is processing your data" : "Ready to process"}</h1>
              <p>
                {finished
                  ? "Your model is trained and metrics are ready."
                  : started
                  ? `Step ${Math.min(currentStep + 1, STEPS.length)} of ${STEPS.length} — please don't close this tab`
                  : "This will take about 13 seconds."}
              </p>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="overall-bar-wrap">
            <div
              className={`overall-bar-fill ${finished ? "finished" : ""}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="steps-list">
            {STEPS.map((step, i) => {
              const status = stepStatuses[i];
              const isRunning = status === "running";
              const isDone = status === "done";
              const isIdle = status === "idle";

              return (
                <div
                  key={step.id}
                  className={`step-row ${isRunning ? "running" : ""} ${isDone ? "done" : ""} ${isIdle ? "idle" : ""}`}
                >
                  <div className="step-icon-wrap">
                    <span className={`step-icon ${isRunning ? "spin" : ""}`}>
                      {isDone ? "✓" : step.icon}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className={`connector ${isDone ? "filled" : ""}`} />
                    )}
                  </div>

                  <div className="step-body">
                    <div className="step-top">
                      <span className="step-label">{step.label}</span>
                      <span className="step-badge">
                        {isDone ? "Done" : isRunning ? "Running" : "Queued"}
                      </span>
                    </div>
                    <div className="step-sublabel">{step.sublabel}</div>

                    {isRunning && (
                      <div className="step-bar-wrap">
                        <div
                          className="step-bar-fill"
                          style={{ width: `${progress}%`, transition: "width 0.03s linear" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {finished && (
            <div className="done-banner">
              <span className="done-icon">🎉</span>
              <div>
                <div className="done-title">Pipeline complete</div>
                <div className="done-sub">Your model is ready. Head to the dashboard to view results.</div>
              </div>
              <a href="/dashboard" className="done-btn">View Results →</a>
            </div>
          )}

          {/* Start button */}
          {!started && !finished && (
            <div className="start-wrap">
              <button className="start-btn">
                Start Processing
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #fff;
    --surface: #fff;
    --surface2: #F9FAFB;
    --border: #E5E7EB;
    --border-active: rgba(124,106,245,0.5);
    --text: #000;
    --muted: #6B6B8A;
    --accent: #3044F9;
    --accent2: #5BDBB0;
    --danger: #F87171;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'DM Sans', sans-serif;
    --radius: 16px;
    --radius-sm: 8px;
  }

  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
  }

  .root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse at 30% 20%, rgba(124,106,245,0.12) 0%, transparent 55%),
      radial-gradient(ellipse at 75% 80%, rgba(91,219,176,0.07) 0%, transparent 50%);
  }

  .card {
    width: 100%;
    max-width: 540px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px rgba(0,0,0,0.6);
  }

  /* Header */
  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 32px 32px 24px;
    border-bottom: 1px solid var(--border);
  }

  .logo-mark {
    font-size: 24px;
    color: var(--accent);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .header-text h1 {
    font-family: var(--sans);
    font-size: 20px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  .header-text p {
    font-size: 13px;
    color: var(--muted);
    font-family: var(--mono);
  }

  /* Overall bar */
  .overall-bar-wrap {
    height: 2px;
    background: var(--surface2);
    position: relative;
  }

  .overall-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    transition: width 0.08s linear;
  }

  .overall-bar-fill.finished {
    background: var(--accent2);
  }

  /* Steps list */
  .steps-list {
    padding: 28px 32px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step-row {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    padding-bottom: 28px;
  }
  .step-row:last-child { padding-bottom: 0; }

  /* Icon column */
  .step-icon-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    gap: 0;
  }

  .step-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    border: 1.5px solid var(--border);
    background: var(--surface2);
    color: var(--muted);
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .step-row.running .step-icon {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(124,106,245,0.1);
    box-shadow: 0 0 0 4px rgba(124,106,245,0.1);
  }

  .step-row.done .step-icon {
    border-color: var(--accent2);
    color: #0A0A0F;
    background: var(--accent2);
    font-size: 13px;
  }

  .spin {
    animation: spin 1.8s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .connector {
    width: 1.5px;
    flex: 1;
    min-height: 24px;
    background: var(--border);
    margin: 6px 0;
    transition: background 0.4s;
  }
  .connector.filled {
    background: var(--accent2);
  }

  /* Step body */
  .step-body {
    flex: 1;
    min-width: 0;
    padding-top: 6px;
  }

  .step-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 3px;
  }

  .step-label {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    transition: color 0.2s;
  }

  .step-row.idle .step-label {
    color: var(--muted);
  }

  .step-badge {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 20px;
    letter-spacing: 0.3px;
    border: 1px solid var(--border);
    color: var(--muted);
    background: var(--surface2);
    transition: all 0.2s;
  }

  .step-row.running .step-badge {
    color: var(--accent);
    border-color: rgba(124,106,245,0.4);
    background: rgba(124,106,245,0.08);
  }

  .step-row.done .step-badge {
    color: var(--accent2);
    border-color: rgba(91,219,176,0.3);
    background: rgba(91,219,176,0.07);
  }

  .step-sublabel {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 8px;
    line-height: 1.5;
  }

  /* Step micro-bar */
  .step-bar-wrap {
    height: 3px;
    background: rgba(124,106,245,0.12);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 10px;
  }

  .step-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), #a78cf7);
    border-radius: 4px;
  }

  /* Done banner */
  .done-banner {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 0 32px 28px;
    padding: 16px 20px;
    background: rgba(91,219,176,0.07);
    border: 1px solid rgba(91,219,176,0.2);
    border-radius: var(--radius-sm);
    animation: fadeUp 0.4s ease;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .done-icon { font-size: 24px; flex-shrink: 0; }

  .done-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--accent2);
    margin-bottom: 2px;
  }

  .done-sub {
    font-size: 12px;
    color: var(--muted);
    font-family: var(--mono);
  }

  .done-btn {
    margin-left: auto;
    flex-shrink: 0;
    padding: 8px 16px;
    background: var(--accent2);
    color: #0A0A0F;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .done-btn:hover { opacity: 0.85; }

  /* Start button */
  .start-wrap {
    padding: 0 32px 32px;
  }

  .start-btn {
    width: 100%;
    padding: 14px;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-sm);
    color: #fff;
    font-family: var(--sans);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: -0.2px;
  }
  .start-btn:hover { background: #9b8df7; transform: translateY(-1px); }
`;