import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ResumeForm from "../components/resume/ResumeForm";
import ResumePreview from "../components/resume/ResumePreview";
import Navbar from "../components/Navbar";

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */

const defaultResumeData = {
    personal: {
        fullName: "",
        title: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
        summary: "",
    },
    experience: [],
    education: [],
    skills: {
        technical: "",
        soft: "",
        languages: "",
    },
    projects: [],
    certifications: [],
    internships: [],
    trainings: [],
    achievements: [],
};

/* ─────────────────────────────────────────────
   Load html2pdf from CDN (lazy, once)
───────────────────────────────────────────── */
let html2pdfPromise = null;
const loadHtml2Pdf = () => {
    if (html2pdfPromise) return html2pdfPromise;
    html2pdfPromise = new Promise((resolve, reject) => {
        if (window.html2pdf) { resolve(window.html2pdf); return; }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.onload = () => resolve(window.html2pdf);
        script.onerror = () => reject(new Error("Failed to load html2pdf"));
        document.head.appendChild(script);
    });
    return html2pdfPromise;
};

/* ─────────────────────────────────────────────
   Score Engine
   Max points: Personal=20, Summary=10, Skills=15,
               Experience=25, Education=15, Projects=10, Certs=5,
               Internships=10, Training=5, Achievements=5
───────────────────────────────────────────── */
const hasVal = (v) => typeof v === "string" && v.trim().length > 0;

function computeScore(data) {
    const sections = [];

    /* ── Personal Info — 20 pts ── */
    const p = data.personal ?? {};
    const personalFields = [
        { key: "fullName", label: "Full name", pts: 4 },
        { key: "title", label: "Job title", pts: 3 },
        { key: "email", label: "Email", pts: 4 },
        { key: "phone", label: "Phone", pts: 3 },
        { key: "location", label: "Location", pts: 2 },
        { key: "linkedin", label: "LinkedIn URL", pts: 2 },
        { key: "website", label: "Website", pts: 2 },
    ];
    const personalEarned = personalFields.reduce((acc, f) => acc + (hasVal(p[f.key]) ? f.pts : 0), 0);
    const personalMissing = personalFields.filter((f) => !hasVal(p[f.key])).map((f) => f.label);
    const personalSuggestions = personalMissing.length
        ? [`Add missing personal fields: ${personalMissing.join(", ")}`]
        : [];
    if (personalEarned === 20) personalSuggestions.push("Consider using a professional email address domain");
    sections.push({
        id: "personal",
        label: "Personal Info",
        icon: "👤",
        max: 20,
        earned: personalEarned,
        missing: personalMissing,
        suggestions: personalSuggestions,
    });

    /* ── Summary — 10 pts ── */
    const summary = p.summary ?? "";
    const wordCount = summary.trim().split(/\s+/).filter(Boolean).length;
    let summaryEarned = 0;
    const summarySuggestions = [];
    if (wordCount >= 10) summaryEarned = 5;
    if (wordCount >= 30) summaryEarned = 8;
    if (wordCount >= 50) summaryEarned = 10;
    if (wordCount === 0) summarySuggestions.push("Write a 2–3 sentence professional summary to introduce yourself");
    else if (wordCount < 30) summarySuggestions.push(`Expand your summary — ${wordCount} words is too brief (aim for 40–80)`);
    else if (wordCount > 120) summarySuggestions.push("Trim your summary to 2–3 focused sentences; shorter is stronger");
    else summarySuggestions.push("Include measurable achievements or key specialisations in your summary");
    sections.push({
        id: "summary",
        label: "Summary",
        icon: "📝",
        max: 10,
        earned: summaryEarned,
        missing: wordCount === 0 ? ["Professional summary"] : [],
        suggestions: summarySuggestions,
    });

    /* ── Skills — 15 pts ── */
    const sk = data.skills ?? {};
    let skillsEarned = 0;
    const skillsSuggestions = [];
    const techSkillCount = sk.technical ? sk.technical.split(",").map((s) => s.trim()).filter(Boolean).length : 0;
    if (techSkillCount >= 1) skillsEarned += 8;
    if (techSkillCount >= 6) skillsEarned += 4;
    if (hasVal(sk.soft)) skillsEarned += 2;
    if (hasVal(sk.languages)) skillsEarned += 1;
    if (techSkillCount === 0) skillsSuggestions.push("Add at least 5 technical skills relevant to your target role");
    else if (techSkillCount < 6) skillsSuggestions.push(`List more technical skills — you have ${techSkillCount} (aim for 8–12)`);
    if (!hasVal(sk.soft)) skillsSuggestions.push("Add soft skills to show leadership and collaboration abilities");
    if (!hasVal(sk.languages)) skillsSuggestions.push("List languages spoken, even if only English, for ATS coverage");
    if (skillsSuggestions.length === 0) skillsSuggestions.push("Group skills by category (e.g. Languages, Frameworks, Cloud) for better ATS parsing");
    sections.push({
        id: "skills",
        label: "Skills",
        icon: "⚡",
        max: 15,
        earned: Math.min(skillsEarned, 15),
        missing: [
            !hasVal(sk.technical) && "Technical skills",
            !hasVal(sk.soft) && "Soft skills",
        ].filter(Boolean),
        suggestions: skillsSuggestions,
    });

    /* ── Experience — 25 pts ── */
    const exp = (data.experience ?? []).filter((e) => hasVal(e.company) || hasVal(e.title));
    let expEarned = 0;
    const expSuggestions = [];
    if (exp.length >= 1) expEarned += 10;
    if (exp.length >= 2) expEarned += 5;
    const totalBullets = exp.reduce((a, e) => a + (e.bullets ?? []).filter((b) => hasVal(b)).length, 0);
    if (totalBullets >= 3) expEarned += 5;
    if (totalBullets >= 6) expEarned += 5;
    const hasQuantified = exp.some((e) =>
        (e.bullets ?? []).some((b) => /\d+[%x+k]|\d+ (percent|times|users|customers|million|engineers)/i.test(b))
    );
    if (hasQuantified) expEarned = Math.min(expEarned + 3, 25);
    if (exp.length === 0) expSuggestions.push("Add at least one work experience entry");
    if (totalBullets < 3) expSuggestions.push("Write 3–5 bullet points per role describing your contributions");
    if (!hasQuantified) expSuggestions.push("Quantify achievements with numbers (%, revenue, users, team size)");
    if (exp.length < 2 && exp.length > 0) expSuggestions.push("Add more positions to show career progression");
    if (expSuggestions.length === 0) expSuggestions.push("Use strong action verbs (Led, Designed, Shipped, Reduced) to open bullets");
    sections.push({
        id: "experience",
        label: "Experience",
        icon: "💼",
        max: 25,
        earned: Math.min(expEarned, 25),
        missing: exp.length === 0 ? ["Work experience"] : [],
        suggestions: expSuggestions,
    });

    /* ── Internships — 10 pts ── */
    const internships = (data.internships ?? []).filter((i) => hasVal(i.company) || hasVal(i.title));
    let internshipsEarned = 0;
    const internshipsSuggestions = [];
    if (internships.length >= 1) internshipsEarned += 5;
    if (internships.length >= 2) internshipsEarned += 2;
    const internshipBullets = internships.reduce((a, i) => a + (i.bullets ?? []).filter((b) => hasVal(b)).length, 0);
    if (internshipBullets >= 2) internshipsEarned += 2;
    const hasInternshipDates = internships.some((i) => hasVal(i.startDate) || hasVal(i.endDate) || i.current);
    if (hasInternshipDates) internshipsEarned += 1;
    if (internships.length === 0) internshipsSuggestions.push("Add internship experience to show practical workplace exposure");
    if (internshipBullets < 2 && internships.length > 0) internshipsSuggestions.push("Add 2–4 bullet points describing internship contributions");
    if (!hasInternshipDates && internships.length > 0) internshipsSuggestions.push("Include internship dates for timeline clarity");
    if (internshipsSuggestions.length === 0) internshipsSuggestions.push("Highlight tools used, outcomes delivered, and team impact from internships");
    sections.push({
        id: "internships",
        label: "Internships",
        icon: "🧑‍💻",
        max: 10,
        earned: Math.min(internshipsEarned, 10),
        missing: internships.length === 0 ? ["Internships"] : [],
        suggestions: internshipsSuggestions,
    });

    /* ── Education — 15 pts ── */
    const edu = (data.education ?? []).filter((e) => hasVal(e.institution) || hasVal(e.degree));
    let eduEarned = 0;
    const eduSuggestions = [];
    if (edu.length >= 1) eduEarned += 10;
    const hasGpa = edu.some((e) => hasVal(e.gpa));
    const hasDates = edu.some((e) => hasVal(e.startDate) || hasVal(e.endDate));
    if (hasGpa) eduEarned += 3;
    if (hasDates) eduEarned += 2;
    if (edu.length === 0) eduSuggestions.push("Add your highest level of education");
    if (!hasGpa && edu.length > 0) eduSuggestions.push("Include GPA if 3.5 or above — it strengthens early-career resumes");
    if (!hasDates && edu.length > 0) eduSuggestions.push("Add graduation dates to each education entry");
    if (eduSuggestions.length === 0) eduSuggestions.push("List relevant coursework or academic projects if you have limited experience");
    sections.push({
        id: "education",
        label: "Education",
        icon: "🎓",
        max: 15,
        earned: Math.min(eduEarned, 15),
        missing: edu.length === 0 ? ["Education entry"] : [],
        suggestions: eduSuggestions,
    });

    /* ── Projects — 10 pts ── */
    const proj = (data.projects ?? []).filter((p) => hasVal(p.name));
    let projEarned = 0;
    const projSuggestions = [];
    if (proj.length >= 1) projEarned += 5;
    if (proj.length >= 2) projEarned += 3;
    const hasUrl = proj.some((p) => hasVal(p.url));
    const hasDesc = proj.some((p) => hasVal(p.description));
    if (hasUrl) projEarned += 1;
    if (hasDesc) projEarned += 1;
    if (proj.length === 0) projSuggestions.push("Add 1–2 notable projects to demonstrate hands-on skills");
    if (!hasUrl && proj.length > 0) projSuggestions.push("Link your projects to GitHub or a live demo for credibility");
    if (!hasDesc && proj.length > 0) projSuggestions.push("Write a one-line description of each project's purpose and impact");
    if (projSuggestions.length === 0) projSuggestions.push("Mention tech stack used and project outcomes (stars, users, performance gains)");
    sections.push({
        id: "projects",
        label: "Projects",
        icon: "🚀",
        max: 10,
        earned: Math.min(projEarned, 10),
        missing: proj.length === 0 ? ["Projects"] : [],
        suggestions: projSuggestions,
    });

    /* ── Certifications — 5 pts ── */
    const certs = (data.certifications ?? []).filter((c) => hasVal(c.name));
    let certsEarned = 0;
    const certsSuggestions = [];
    if (certs.length >= 1) certsEarned += 3;
    if (certs.length >= 2) certsEarned += 2;
    const hasCertDate = certs.some((c) => hasVal(c.date));
    const hasCertIssuer = certs.some((c) => hasVal(c.issuer));
    if (hasCertDate && !certsEarned) certsEarned = Math.min(certsEarned, 5);
    if (certs.length === 0) certsSuggestions.push("Add relevant certifications to validate your expertise");
    if (!hasCertIssuer && certs.length > 0) certsSuggestions.push("Include the issuing organisation for each certification");
    if (!hasCertDate && certs.length > 0) certsSuggestions.push("Add the year earned — recency signals ongoing learning");
    if (certsSuggestions.length === 0) certsSuggestions.push("Prioritise certifications relevant to your target role or industry");
    sections.push({
        id: "certifications",
        label: "Certifications",
        icon: "🏅",
        max: 5,
        earned: Math.min(certsEarned, 5),
        missing: certs.length === 0 ? ["Certifications"] : [],
        suggestions: certsSuggestions,
    });

    /* ── Training — 5 pts ── */
    const trainings = (data.trainings ?? []).filter((t) => hasVal(t.title) || hasVal(t.organization));
    let trainingsEarned = 0;
    const trainingsSuggestions = [];
    if (trainings.length >= 1) trainingsEarned += 3;
    const hasTrainingCertificate = trainings.some((t) => hasVal(t.certificate));
    const hasTrainingDescription = trainings.some((t) => hasVal(t.description));
    if (hasTrainingCertificate) trainingsEarned += 1;
    if (hasTrainingDescription) trainingsEarned += 1;
    if (trainings.length === 0) trainingsSuggestions.push("Add relevant training programs or workshops");
    if (!hasTrainingCertificate && trainings.length > 0) trainingsSuggestions.push("Include certificate links or IDs where available");
    if (!hasTrainingDescription && trainings.length > 0) trainingsSuggestions.push("Describe the skills or topics covered in each training");
    if (trainingsSuggestions.length === 0) trainingsSuggestions.push("Prioritise training that supports your target role");
    sections.push({
        id: "trainings",
        label: "Training",
        icon: "📚",
        max: 5,
        earned: Math.min(trainingsEarned, 5),
        missing: trainings.length === 0 ? ["Training"] : [],
        suggestions: trainingsSuggestions,
    });

    /* ── Achievements — 5 pts ── */
    const achievements = (data.achievements ?? []).filter((a) => hasVal(a.title));
    let achievementsEarned = 0;
    const achievementsSuggestions = [];
    if (achievements.length >= 1) achievementsEarned += 3;
    if (achievements.length >= 2) achievementsEarned += 1;
    const hasAchievementContext = achievements.some((a) => hasVal(a.issuer) || hasVal(a.description));
    if (hasAchievementContext) achievementsEarned += 1;
    if (achievements.length === 0) achievementsSuggestions.push("Add awards, honours, publications, or notable accomplishments");
    if (!hasAchievementContext && achievements.length > 0) achievementsSuggestions.push("Include issuer or context so achievements carry more weight");
    if (achievementsSuggestions.length === 0) achievementsSuggestions.push("Use achievements to separate awards and recognitions from work bullets");
    sections.push({
        id: "achievements",
        label: "Achievements",
        icon: "🏆",
        max: 5,
        earned: Math.min(achievementsEarned, 5),
        missing: achievements.length === 0 ? ["Achievements"] : [],
        suggestions: achievementsSuggestions,
    });

    const earnedTotal = sections.reduce((a, s) => a + s.earned, 0);
    const maxTotal = sections.reduce((a, s) => a + s.max, 0);
    const total = Math.min(100, Math.round((earnedTotal / maxTotal) * 100));
    return { total, sections };
}

/* ─────────────────────────────────────────────
   Score helpers
───────────────────────────────────────────── */
const scoreGrade = (score) => {
    if (score >= 90) return { label: "Excellent", color: "#10b981", glow: "shadow-emerald-500/30" };
    if (score >= 75) return { label: "Strong", color: "#6366f1", glow: "shadow-violet-500/30" };
    if (score >= 55) return { label: "Good", color: "#f59e0b", glow: "shadow-amber-500/30" };
    if (score >= 35) return { label: "Fair", color: "#f97316", glow: "shadow-orange-500/30" };
    return { label: "Needs Work", color: "#ef4444", glow: "shadow-red-500/30" };
};

const barColor = (earned, max) => {
    const pct = earned / max;
    if (pct >= 0.9) return "#10b981";
    if (pct >= 0.65) return "#6366f1";
    if (pct >= 0.4) return "#f59e0b";
    return "#ef4444";
};

/* ─────────────────────────────────────────────
   ResumeScorePanel
───────────────────────────────────────────── */
function ResumeScorePanel({ resumeData, onNavigate }) {
    const [open, setOpen] = useState(true);
    const [expandedSection, setExpandedSection] = useState(null);

    const { total, sections } = useMemo(() => computeScore(resumeData), [resumeData]);
    const grade = scoreGrade(total);

    // Circumference for SVG ring
    const R = 28;
    const C = 2 * Math.PI * R;
    const dashOffset = C - (total / 100) * C;

    const allMissing = sections.flatMap((s) => s.missing);
    const topSuggestions = sections
        .filter((s) => s.earned < s.max)
        .sort((a, b) => (b.max - b.earned) - (a.max - a.earned))
        .slice(0, 3)
        .flatMap((s) => s.suggestions.slice(0, 1));

    return (
        <div className="border-b border-white/8 bg-[#0f0f17]">
            {/* ── Panel header / toggle ── */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    {/* Mini ring */}
                    <div className="relative w-9 h-9 shrink-0">
                        <svg width="36" height="36" viewBox="0 0 72 72" className="-rotate-90">
                            <circle cx="36" cy="36" r={R} fill="none" stroke="#ffffff10" strokeWidth="6" />
                            <circle
                                cx="36" cy="36" r={R}
                                fill="none"
                                stroke={grade.color}
                                strokeWidth="6"
                                strokeDasharray={C}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dashoffset 0.6s ease" }}
                            />
                        </svg>
                        <span
                            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                            style={{ color: grade.color }}
                        >
                            {total}
                        </span>
                    </div>

                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white/80">Resume Score</span>
                            <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ color: grade.color, background: grade.color + "20", border: `1px solid ${grade.color}40` }}
                            >
                                {grade.label}
                            </span>
                        </div>
                        {allMissing.length > 0 ? (
                            <p className="text-[10px] text-white/35 mt-0.5">
                                {allMissing.length} section{allMissing.length !== 1 ? "s" : ""} incomplete
                            </p>
                        ) : (
                            <p className="text-[10px] text-emerald-400/70 mt-0.5">All sections complete ✓</p>
                        )}
                    </div>
                </div>

                <span className={`text-white/30 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </button>

            {/* ── Expanded panel ── */}
            {open && (
                <div className="px-5 pb-4 space-y-4">

                    {/* Master progress bar */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] text-white/35 uppercase tracking-wider">Overall Completeness</span>
                            <span className="text-[10px] font-semibold" style={{ color: grade.color }}>{total}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${total}%`, background: `linear-gradient(90deg, ${grade.color}cc, ${grade.color})` }}
                            />
                        </div>
                    </div>

                    {/* Section breakdown */}
                    <div className="space-y-1.5">
                        {sections.map((s) => {
                            const pct = (s.earned / s.max) * 100;
                            const isExpanded = expandedSection === s.id;
                            const complete = s.earned === s.max;

                            return (
                                <div key={s.id} className="rounded-lg overflow-hidden">
                                    {/* Section row */}
                                    <button
                                        onClick={() => setExpandedSection(isExpanded ? null : s.id)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/4 transition-colors rounded-lg group"
                                    >
                                        <span className="text-sm leading-none shrink-0">{s.icon}</span>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] font-medium text-white/70 truncate">{s.label}</span>
                                                <span className="text-[10px] font-semibold shrink-0 ml-2" style={{ color: barColor(s.earned, s.max) }}>
                                                    {s.earned}/{s.max}
                                                </span>
                                            </div>
                                            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%`, backgroundColor: barColor(s.earned, s.max) }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {complete ? (
                                                <span className="text-emerald-400 text-[11px]">✓</span>
                                            ) : (
                                                <span
                                                    className="text-[10px] text-white/20 group-hover:text-white/40 transition-colors"
                                                >
                                                    {isExpanded ? "▲" : "▼"}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded: suggestions + navigate */}
                                    {isExpanded && !complete && (
                                        <div className="mx-1 mb-1 bg-white/[0.03] border border-white/8 rounded-lg px-3 py-2.5 space-y-2">
                                            {s.missing.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {s.missing.map((m) => (
                                                        <span
                                                            key={m}
                                                            className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400/80"
                                                        >
                                                            ✕ {m}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <ul className="space-y-1.5">
                                                {s.suggestions.map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-1.5">
                                                        <span className="text-purple-400/60 text-[11px] mt-0.5 shrink-0">→</span>
                                                        <span className="text-[11px] text-white/50 leading-snug">{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                onClick={() => onNavigate(s.id === "summary" ? "personal" : s.id)}
                                                className="mt-1 text-[10px] text-purple-400/70 hover:text-purple-300 transition-colors flex items-center gap-1 font-medium"
                                            >
                                                <span>→</span> Go to {s.label}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Top 3 quick wins */}
                    {topSuggestions.length > 0 && (
                        <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-3">
                            <p className="text-[10px] font-semibold text-purple-300/70 uppercase tracking-wider mb-2">
                                ✦ Quick Wins
                            </p>
                            <ul className="space-y-1.5">
                                {topSuggestions.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-purple-400/50 text-[11px] mt-0.5 shrink-0">{i + 1}.</span>
                                        <span className="text-[11px] text-white/50 leading-snug">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {total === 100 && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                            <p className="text-xs text-emerald-400 font-semibold">🎉 Perfect score! Your resume is complete.</p>
                            <p className="text-[10px] text-white/35 mt-1">Download your PDF and start applying.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Toast component
───────────────────────────────────────────── */
const TOAST_ICONS = { success: "✓", error: "✕", info: "↓" };
const TOAST_STYLES = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-red-500/40 bg-red-500/10 text-red-300",
    info: "border-purple-500/40 bg-purple-500/10 text-purple-300",
};

function Toast({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-xl
            text-sm font-medium shadow-xl shadow-black/40 transition-all duration-300
            ${TOAST_STYLES[t.type]}`}
                    style={{ animation: "slideInRight 0.2s ease-out" }}
                >
                    <span className="text-base leading-none">{TOAST_ICONS[t.type]}</span>
                    {t.message}
                </div>
            ))}
            <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Toolbar action button
───────────────────────────────────────────── */
function ActionButton({ onClick, disabled, loading, icon, label, variant = "ghost" }) {
    const base = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed";
    const variants = {
        ghost: "text-white/60 hover:text-white hover:bg-white/8 border border-white/10 hover:border-white/20",
        primary: "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-900/30 border border-purple-500/30",
        danger: "text-red-400/70 hover:text-red-300 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30",
    };
    return (
        <button onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]}`}>
            {loading ? (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
            ) : (
                <span className="text-sm leading-none">{icon}</span>
            )}
            {label}
        </button>
    );
}

/* ─────────────────────────────────────────────
   Confirm modal (for reset)
───────────────────────────────────────────── */
function ConfirmModal({ open, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[#16161f] border border-white/10 rounded-2xl p-6 w-80 shadow-2xl shadow-black/60">
                <h3 className="text-sm font-semibold text-white mb-1">Reset resume?</h3>
                <p className="text-xs text-white/50 mb-5">
                    This will clear all saved data and restore the default template. This cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all">
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function ResumeBuilder() {
    const [resumeData, setResumeData] = useState(defaultResumeData);
    const [activeSection, setActiveSection] = useState("personal");
    const [toasts, setToasts] = useState([]);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const previewRef = useRef(null);
    const autoSaveTimer = useRef(null);

    const addToast = useCallback((message, type = "success", duration = 3000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }, []);

    const updateSection = useCallback((section, data) => {
        setResumeData((prev) => ({ ...prev, [section]: data }));
    }, []);

    const handleSave = useCallback(() => {
        addToast("Resume saved successfully", "success");
    }, [addToast]);

    const handleExportJson = useCallback(() => {
        try {
            const filename = `${(resumeData.personal.fullName || "resume").toLowerCase().replace(/\s+/g, "_")}_resume.json`;
            const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
            addToast("JSON exported successfully", "success");
        } catch { addToast("Export failed", "error"); }
    }, [resumeData, addToast]);

    const handleDownloadPdf = useCallback(async () => {
        if (!previewRef.current) { addToast("Preview not ready", "error"); return; }
        setPdfLoading(true);
        try {
            const html2pdf = await loadHtml2Pdf();
            const filename = `${(resumeData.personal.fullName || "resume").toLowerCase().replace(/\s+/g, "_")}_resume.pdf`;
            await html2pdf().set({
                margin: 0, filename,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: "#ffffff" },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["avoid-all", "css", "legacy"] },
            }).from(previewRef.current).save();
            addToast("PDF downloaded", "success");
        } catch (err) {
            console.error("PDF generation error:", err);
            addToast("PDF generation failed — try again", "error");
        } finally { setPdfLoading(false); }
    }, [resumeData, addToast]);

    const handleReset = useCallback(() => {
        setResumeData(defaultResumeData);
        setLastSaved(null);
        setShowResetModal(false);
        addToast("Resume reset to default", "info");
    }, [addToast]);

    const savedLabel = lastSaved
        ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : null;

    return (
        <>
            <Navbar />

            <div className="min-h-screen bg-[#0a0a0f] text-white font-sans flex flex-col">

                {/* ── Header ── */}
                <header className="border-b border-white/10 bg-[#0d0d14]/80 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-900/40">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 4h10M3 8h7M3 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-white tracking-tight">Vista IQ</span>
                                <span className="text-white/30 mx-2 text-xs">›</span>
                                <span className="text-sm text-white/60 font-medium">Resume Builder</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {savedLabel && <span className="text-xs text-white/25 hidden sm:inline">{savedLabel}</span>}
                            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live
                            </span>
                            <div className="w-px h-5 bg-white/10" />
                            <ActionButton onClick={handleSave} icon="💾" label="Save" variant="ghost" />
                            <ActionButton onClick={handleExportJson} icon="{ }" label="Export JSON" variant="ghost" />
                            <ActionButton onClick={handleDownloadPdf} loading={pdfLoading} icon="⬇" label={pdfLoading ? "Generating…" : "Download PDF"} variant="primary" />
                            <div className="w-px h-5 bg-white/10" />
                            <ActionButton onClick={() => setShowResetModal(true)} icon="↺" label="Reset" variant="danger" />
                        </div>
                    </div>
                </header>

                {/* ── Split Screen ── */}
                <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 53px)" }}>

                    {/* Left: Score Panel + Form */}
                    <div className="w-[46%] border-r border-white/10 overflow-y-auto bg-[#0d0d14] flex flex-col">
                        {/* Score panel sits above the form, below the header */}
                        <ResumeScorePanel
                            resumeData={resumeData}
                            onNavigate={setActiveSection}
                        />
                        {/* Form fills the rest */}
                        <div className="flex-1">
                            <ResumeForm
                                resumeData={resumeData}
                                updateSection={updateSection}
                                activeSection={activeSection}
                                setActiveSection={setActiveSection}
                            />
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="w-[54%] overflow-y-auto bg-[#111118] flex flex-col">
                        <div className="sticky top-0 z-10 bg-[#111118]/90 backdrop-blur border-b border-white/10 px-6 py-2.5 flex items-center justify-between">
                            <span className="text-xs text-white/40 font-medium uppercase tracking-widest">Preview — ATS Format</span>
                            <div className="flex gap-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                            </div>
                        </div>
                        <div className="flex-1 flex items-start justify-center p-8">
                            <div ref={previewRef} className="w-full max-w-[720px] shadow-2xl shadow-black/60 ring-1 ring-white/10">
                                <ResumePreview resumeData={resumeData} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Overlays ── */}
                <Toast toasts={toasts} />
                <ConfirmModal open={showResetModal} onConfirm={handleReset} onCancel={() => setShowResetModal(false)} />
            </div>
        </>
    );
}
