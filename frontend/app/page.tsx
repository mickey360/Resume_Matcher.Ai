 "use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  History,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  UploadCloud,
  XCircle,
} from "lucide-react";

type Result = {
  id: string;
  created_at: string;
  filename: string;
  overall_score: number;
  label: string;
  breakdown: {
    skills: number;
    keywords: number;
    experience: number;
    education: number;
    semantic: number;
  };
  matching_skills: string[];
  missing_skills: string[];
  resume_skills: string[];
  job_skills: string[];
  recommendations: string[];
  extracted: {
    name: string;
    email: string;
    phone: string;
    sections: string[];
  };
  stats: {
    resume_words: number;
    job_words: number;
    job_skill_count: number;
    matched_skill_count: number;
  };
};

type Saved = Pick<Result, "id" | "created_at" | "filename" | "overall_score" | "label">;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const HISTORY_KEY = "resumeai-history-v1";

const demoJob = `We are looking for a Junior Full Stack Developer to build modern web applications. Required skills include React, Next.js, TypeScript, JavaScript, Node.js, REST API development, Git, SQL, MongoDB and AWS. Candidates should have a bachelor's degree in computer science or a related field, strong communication skills, and at least 1 year of software development experience. Experience with Docker and CI/CD is a plus.`;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // Ignore malformed local history.
    }
  }, []);

  const canAnalyze = Boolean(file && job.trim().length >= 50 && !loading);

  function selectFile(selected: File | null) {
    setError("");
    if (!selected) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const extensionOk = /\.(pdf|docx)$/i.test(selected.name);
    if (!extensionOk && !allowed.includes(selected.type)) {
      setError("Please choose a PDF or DOCX resume.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Your resume must be smaller than 5 MB.");
      return;
    }
    setFile(selected);
  }

  function onInput(e: ChangeEvent<HTMLInputElement>) {
    selectFile(e.target.files?.[0] || null);
  }

  function saveHistory(next: Result) {
    const item: Saved = {
      id: next.id,
      created_at: next.created_at,
      filename: next.filename,
      overall_score: next.overall_score,
      label: next.label,
    };
    const updated = [item, ...history.filter((x) => x.id !== item.id)].slice(0, 8);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  async function analyze() {
    if (!file) {
      setError("Please upload your resume.");
      return;
    }
    if (job.trim().length < 50) {
      setError("Please paste a complete job description (at least 50 characters).");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.append("resume", file);
      form.append("job_description", job.trim());

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        body: form,
      });

      let data: Result | { detail?: string };
      try {
        data = await response.json();
      } catch {
        throw new Error("The backend returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error("detail" in data && data.detail ? data.detail : "Analysis failed.");
      }

      setResult(data as Result);
      saveHistory(data as Result);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} Check that the FastAPI backend is running and NEXT_PUBLIC_API_URL is correct.`
          : "Could not connect to the backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    setJob(demoJob);
    setError("");
  }

  function clearAll() {
    setFile(null);
    setJob("");
    setResult(null);
    setError("");
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }

  const topMissing = useMemo(() => result?.missing_skills.slice(0, 10) ?? [], [result]);

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-3 font-extrabold tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span>ResumeAI</span>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Open-source AI/ML
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-14 pt-8 md:px-8 md:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-indigo-700">
            <Sparkles className="h-4 w-4" /> Explainable resume intelligence
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
            Match your resume to the job with confidence.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Upload a resume and paste a job description. ResumeAI combines NLP, semantic similarity, and transparent scoring to reveal strengths, gaps, and practical improvements.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files?.[0] || null); }}
            className={`rounded-3xl border-2 border-dashed p-7 transition md:p-9 ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white"} shadow-sm`}
          >
            <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
              <div className="mb-5 rounded-2xl bg-indigo-50 p-4 text-indigo-600"><UploadCloud /></div>
              <h2 className="text-xl font-extrabold">Upload your resume</h2>
              <p className="mt-2 text-sm text-slate-500">Drop a PDF or DOCX here, or browse your computer.</p>
              {file ? (
                <div className="mt-5 flex max-w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <FileText className="h-4 w-4 shrink-0" /><span className="truncate">{file.name}</span>
                </div>
              ) : null}
              <label className="mt-6 cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                Choose resume
                <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onInput} className="hidden" />
              </label>
              <p className="mt-4 text-xs text-slate-400">Maximum 5 MB</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">Job description</h2>
                <p className="mt-1 text-sm text-slate-500">Paste the complete job posting.</p>
              </div>
              <button onClick={loadDemo} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Load demo</button>
            </div>
            <textarea value={job} onChange={(e) => setJob(e.target.value)} placeholder="We are looking for a Full Stack Developer..." className="mt-5 h-52 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" />
            <div className="mt-3 flex justify-between text-xs text-slate-400"><span>{job.length} characters</span><span>Minimum 50</span></div>
          </div>
        </div>

        {error ? (
          <div className="mx-auto mt-5 flex max-w-3xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button disabled={!canAnalyze} onClick={analyze} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-extrabold text-white shadow-xl shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing resume...</> : <>Analyze my match <ArrowRight className="h-5 w-5" /></>}
          </button>
          <button onClick={clearAll} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-12 sm:grid-cols-3 md:px-8">
        <Feature icon={<Gauge />} title="Explainable score" text="Five measurable signals instead of a mystery number." />
        <Feature icon={<Target />} title="Skill gaps" text="See what the job asks for that your resume doesn't show." />
        <Feature icon={<BrainCircuit />} title="Semantic ML" text="Compare meaning with embeddings, plus a reliable fallback." />
      </section>

      {result ? <Results result={result} topMissing={topMissing} /> : null}

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><History className="h-5 w-5 text-indigo-600" /><div><h2 className="font-extrabold">Recent analyses</h2><p className="text-xs text-slate-500">Saved locally in this browser.</p></div></div>
            {history.length ? <button onClick={clearHistory} className="text-xs font-bold text-slate-500 hover:text-red-600">Clear history</button> : null}
          </div>
          {history.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{item.filename}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p></div>
                  <div className="ml-4 text-right"><div className="text-lg font-black text-indigo-600">{item.overall_score}%</div><div className="text-[11px] font-semibold text-slate-500">{item.label}</div></div>
                </div>
              ))}
            </div>
          ) : <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Your completed analyses will appear here.</p>}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        ResumeAI · Built with Next.js, FastAPI, NLP and open-source ML
      </footer>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</div><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div>;
}

function Results({ result, topMissing }: { result: Result; topMissing: string[] }) {
  return (
    <section id="results" className="border-y border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div><div className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-600"><BarChart3 className="h-4 w-4" /> Analysis report</div><h2 className="text-3xl font-black tracking-tight text-slate-950">Your resume match</h2><p className="mt-2 text-sm text-slate-500">{result.filename} · {new Date(result.created_at).toLocaleString()}</p></div>
          <div className="flex items-center gap-2 text-xs text-slate-500"><Clock3 className="h-4 w-4" /> Processed by your backend</div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[290px_1fr]">
          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
            <div className="flex items-center justify-between"><Target className="h-6 w-6 text-indigo-300" /><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">Overall</span></div>
            <div className="mt-8 text-7xl font-black tracking-tight">{result.overall_score}<span className="text-3xl text-slate-400">%</span></div>
            <p className="mt-3 text-xl font-extrabold">{result.label}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">A weighted score based on skill coverage, keywords, experience, education and semantic similarity.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ScoreCard title="Skills" value={result.breakdown.skills} />
            <ScoreCard title="Keywords" value={result.breakdown.keywords} />
            <ScoreCard title="Experience" value={result.breakdown.experience} />
            <ScoreCard title="Education" value={result.breakdown.education} />
            <ScoreCard title="Semantic ML" value={result.breakdown.semantic} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SkillPanel title="Matching skills" items={result.matching_skills} good />
          <SkillPanel title="Missing job skills" items={topMissing} good={false} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
            <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-indigo-600" /><h3 className="text-xl font-extrabold">Recommendations</h3></div>
            <div className="mt-5 space-y-3">{result.recommendations.map((item, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">{item}</div>)}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <h3 className="text-xl font-extrabold">Resume profile</h3>
            <dl className="mt-5 space-y-4 text-sm">
              <Row label="Detected name" value={result.extracted.name || "Not detected"} />
              <Row label="Email" value={result.extracted.email || "Not detected"} />
              <Row label="Resume words" value={String(result.stats.resume_words)} />
              <Row label="Job words" value={String(result.stats.job_words)} />
              <Row label="Skills detected" value={`${result.stats.matched_skill_count}/${result.stats.job_skill_count} matched`} />
              <Row label="Sections" value={result.extracted.sections.join(", ") || "Not detected"} />
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreCard({ title, value }: { title: string; value: number }) {
  return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6"><div className="text-3xl font-black text-slate-950">{value}%</div><div className="mt-2 text-sm font-semibold text-slate-500">{title}</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${value}%` }} /></div></div>;
}

function SkillPanel({ title, items, good }: { title: string; items: string[]; good: boolean }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">{title}</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{items.length}</span></div><div className="mt-5 flex flex-wrap gap-2">{items.length ? items.map(item => <span key={item} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{good ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}{item}</span>) : <p className="text-sm text-slate-500">No items detected.</p>}</div></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0"><dt className="text-slate-500">{label}</dt><dd className="max-w-[60%] text-right font-semibold text-slate-800">{value}</dd></div>;
}
