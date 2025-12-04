"use client";

import { useState } from "react";

export default function QuizPage() {
  const [numQuestions, setNumQuestions] = useState(5); // default number
  const [policyText, setPolicyText] = useState("");   // where the user pastes their policy
  const [quiz, setQuiz] = useState("");               // generated quiz output
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When we later build the API route, this will call it:
  const generateQuiz = async () => {
    if (!policyText.trim()) {
      setError("Please paste your AI Use Policy first.");
      return;
    }

    setError("");
    setLoading(true);
    setQuiz("");

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyText,
          numQuestions,
        }),
      });

      if (!res.ok) {
        throw new Error("Quiz generation failed.");
      }

      const data = await res.json();
      setQuiz(data.quiz || "");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold mb-4">
          AI Policy Training Quiz Generator
        </h1>
        <p className="text-slate-300 text-sm mb-6">
          Paste your AI Use Policy below and generate a short staff quiz based on it.
        </p>

        <div className="space-y-6">
          {/* Number of questions */}
          <div>
            <label className="block text-sm mb-1 text-slate-200">
              Number of questions
            </label>
            <select
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            >
              <option value={3}>3 questions</option>
              <option value={5}>5 questions</option>
              <option value={8}>8 questions</option>
              <option value={10}>10 questions</option>
            </select>
          </div>

          {/* Policy input */}
          <div>
            <label className="block text-sm mb-1 text-slate-200">
              Paste AI Use Policy
            </label>
            <textarea
              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-50"
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              placeholder="Paste your full AI Use Policy here..."
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-rose-400 text-sm">
              {error}
            </p>
          )}

          {/* Generate button */}
          <button
            onClick={generateQuiz}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2 rounded-full text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Generating quiz..." : "Generate quiz"}
          </button>

          {/* Quiz output */}
          {quiz && (
            <div className="mt-6 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm whitespace-pre-wrap">
              {quiz}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
