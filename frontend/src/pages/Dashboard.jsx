import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { authFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  Award, BarChart3, Briefcase, Building2, CalendarDays, CheckCircle2,
  Code2, FileText, Lightbulb, Mic, RefreshCw, TrendingUp,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
);

const CHART_OPTS = {
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } },
    },
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } },
    },
  },
  maintainAspectRatio: false,
};

const EMPTY_INTERVIEW_ANALYTICS = {
  stats: { total_sessions: 0, avg_score: 0, best_score: 0, total_answers: 0 },
  charts: {
    trend: { labels: [], scores: [] },
    radar: { labels: [], scores: [] },
    distribution: { labels: ['0-20', '20-40', '40-60', '60-80', '80-100'], counts: [0, 0, 0, 0, 0] },
    weekly: { labels: [], counts: [] },
  },
  recent_sessions: [],
};

const EMPTY_AI_ANALYTICS = {
  total_sessions: 0,
  avg_score: 0,
  by_round_type: {
    hr: { count: 0, avg: 0 },
    technical: { count: 0, avg: 0 },
    behavioral: { count: 0, avg: 0 },
  },
  recent_scores: [],
};

const EMPTY_CODING_ANALYTICS = {
  total_problems: 0,
  problems_solved: 0,
  completion: 0,
  easy: { total: 0, solved: 0 },
  medium: { total: 0, solved: 0 },
  hard: { total: 0, solved: 0 },
};

const EMPTY_RESUME_ANALYTICS = {
  total_resumes: 0,
  total_analyses: 0,
  best_score: 0,
  avg_score: 0,
  latest_scores: null,
  score_history: [],
};

const EMPTY_DASHBOARD = {
  interview: EMPTY_INTERVIEW_ANALYTICS,
  aiInterview: EMPTY_AI_ANALYTICS,
  coding: EMPTY_CODING_ANALYTICS,
  resume: EMPTY_RESUME_ANALYTICS,
  jobMatchHistory: [],
  savedCompanies: [],
};

export default function Dashboard() {
  const { user } = useAuth();
  const mountedRef = useRef(false);
  const [analytics, setAnalytics] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    const [
      interview,
      aiInterview,
      coding,
      resume,
      jobMatchHistory,
      savedCompanies,
    ] = await Promise.all([
      fetchAnalytics('/interview/analytics'),
      fetchAnalytics('/ai-interview/analytics'),
      fetchAnalytics('/coding/analytics'),
      fetchAnalytics('/resume/analytics/summary'),
      fetchAnalytics('/job-match/history'),
      fetchAnalytics('/job-match/favorites/list'),
    ]);

    if (!mountedRef.current) return;

    setAnalytics({
      interview: normalizeInterviewAnalytics(interview),
      aiInterview: normalizeAiAnalytics(aiInterview),
      coding: normalizeCodingAnalytics(coding),
      resume: normalizeResumeAnalytics(resume),
      jobMatchHistory: toArray(jobMatchHistory).map(normalizeJobMatch),
      savedCompanies: toArray(savedCompanies),
    });

    if (!interview && !aiInterview && !coding && !resume && !jobMatchHistory && !savedCompanies) {
      setError('Unable to load dashboard analytics. Please refresh and try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadDashboard();
    return () => { mountedRef.current = false; };
  }, [loadDashboard]);

  const model = useMemo(() => buildDashboardModel(analytics), [analytics]);
  const userName = user?.name || user?.displayName || user?.email?.split('@')[0] || 'there';
  const greeting = getGreeting();
  const currentDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <>
      <Navbar />
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <main className="dashboard-shell">
        <header className="dashboard-header animate-slide-up">
          <div>
            <p className="dashboard-kicker">{greeting}</p>
            <h1>Welcome back, <span className="text-gradient">{userName}</span>.</h1>
            <p className="dashboard-subtitle">Keep improving your interview skills every day.</p>
          </div>
          <div className="date-chip">
            <CalendarDays size={14} />
            {currentDate}
          </div>
        </header>

        {loading && <DashboardSkeleton />}

        {!loading && error && (
          <div className="glass-card animate-slide-up dashboard-error">
            <span>{error}</span>
            <button type="button" className="retry-button" onClick={loadDashboard}>
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {!loading && !model.hasAnyAnalytics && (
          <EmptyAnalyticsState />
        )}

        {!loading && model.hasAnyAnalytics && (
          <>
            <section className="stats-grid animate-slide-up" aria-label="Top career statistics">
              {model.stats.map((stat, index) => (
                <StatCard key={stat.label} {...stat} delay={index * 0.04} />
              ))}
            </section>

            <section aria-labelledby="performance-title">
              <SectionTitle id="performance-title" title="Performance Analytics" />
              {model.hasCharts ? (
                <div className="analytics-grid">
                {hasPositiveSeries(model.charts.trend.scores) && (
                  <ChartCard
                    title="Interview Score Trend"
                    icon={<TrendingUp size={14} />}
                    className="chart-wide"
                    delay={0.12}
                  >
                    <Line
                      data={{
                        labels: model.charts.trend.labels,
                        datasets: [{
                          label: 'Score',
                          data: model.charts.trend.scores,
                          borderColor: '#6c63ff',
                          backgroundColor: 'rgba(108,99,255,0.08)',
                          fill: true,
                          tension: 0.4,
                          pointBackgroundColor: '#6c63ff',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2,
                          pointRadius: 4,
                        }],
                      }}
                      options={CHART_OPTS}
                    />
                  </ChartCard>
                )}

                {hasPositiveSeries(model.charts.weekly.counts) && (
                  <ChartCard title="Weekly Activity" icon={<BarChart3 size={14} />} delay={0.16}>
                    <Bar
                      data={{
                        labels: model.charts.weekly.labels,
                        datasets: [{
                          data: model.charts.weekly.counts,
                          backgroundColor: 'rgba(108,99,255,0.55)',
                          borderColor: '#6c63ff',
                          borderWidth: 1,
                          borderRadius: 6,
                        }],
                      }}
                      options={CHART_OPTS}
                    />
                  </ChartCard>
                )}

                {hasPositiveSeries(model.charts.coding.values) && (
                  <ChartCard title="Coding Progress" icon={<Code2 size={14} />} delay={0.2}>
                    <Bar
                      data={{
                        labels: model.charts.coding.labels,
                        datasets: [{
                          data: model.charts.coding.values,
                          backgroundColor: ['rgba(16,185,129,0.65)', 'rgba(245,158,11,0.65)', 'rgba(239,68,68,0.65)'],
                          borderRadius: 6,
                        }],
                      }}
                      options={CHART_OPTS}
                    />
                  </ChartCard>
                )}

                {hasPositiveSeries(model.charts.resume.scores) && (
                  <ChartCard title="Resume Score Trend" icon={<FileText size={14} />} delay={0.24}>
                    <Line
                      data={{
                        labels: model.charts.resume.labels,
                        datasets: [{
                          label: 'Resume Score',
                          data: model.charts.resume.scores,
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16,185,129,0.08)',
                          fill: true,
                          tension: 0.35,
                          pointBackgroundColor: '#10b981',
                        }],
                      }}
                      options={CHART_OPTS}
                    />
                  </ChartCard>
                )}

                {hasPositiveSeries(model.charts.jobMatch.scores) && (
                  <ChartCard title="Job Match Trend" icon={<Briefcase size={14} />} delay={0.28}>
                    <Bar
                      data={{
                        labels: model.charts.jobMatch.labels,
                        datasets: [{
                          data: model.charts.jobMatch.scores,
                          backgroundColor: 'rgba(20,184,166,0.65)',
                          borderRadius: 6,
                        }],
                      }}
                      options={CHART_OPTS}
                    />
                  </ChartCard>
                )}
                </div>
              ) : (
                <WidgetEmptyState message="No analytics available yet." />
              )}
            </section>

            <section className="dashboard-lower-grid">
              <div className="glass-card animate-slide-up dashboard-panel" style={{ animationDelay: '0.28s' }}>
                <PanelTitle icon={<Lightbulb size={14} />} title="AI Career Insights" />
                {model.insights.hasInsights ? (
                  <div className="insight-groups">
                    <InsightGroup title="Strengths" items={model.insights.strengths} />
                    <InsightGroup title="Weaknesses" items={model.insights.weaknesses} />
                    <InsightGroup title="Recommendations" items={model.insights.recommendations} />
                    <InsightGroup title="Next Best Action" items={model.insights.nextBestAction ? [model.insights.nextBestAction] : []} />
                  </div>
                ) : (
                  <p className="muted-copy">Complete more activities to receive AI-powered career insights.</p>
                )}
              </div>

              <div className="glass-card animate-slide-up dashboard-panel" style={{ animationDelay: '0.32s' }}>
                <PanelTitle icon={<CheckCircle2 size={14} />} title="Goals & Progress" />
                {model.goals.length > 0 ? (
                  <div className="progress-list">
                    {model.goals.map((goal) => (
                      <ProgressRow key={goal.label} {...goal} />
                    ))}
                  </div>
                ) : (
                  <p className="muted-copy">Progress tracking will appear as you use more features.</p>
                )}
              </div>
            </section>

            <section className="glass-card animate-slide-up dashboard-panel" style={{ animationDelay: '0.36s' }}>
              <PanelTitle icon={<CalendarDays size={14} />} title="Recent Activity" />
              {model.activities.length > 0 ? (
                <div className="activity-list">
                  {model.activities.map((activity) => (
                    <div key={activity.id} className="activity-row">
                      <div className="activity-icon">{activity.icon}</div>
                      <div>
                        <p>{activity.title}</p>
                        <span>{activity.meta}</span>
                      </div>
                      <time>{activity.dateLabel}</time>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted-copy">No recent activity.</p>
              )}
            </section>
          </>
        )}
      </main>

      <style>{`
        .dashboard-shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
          position: relative;
          z-index: 10;
        }
        .dashboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .dashboard-kicker {
          font-size: 13px;
          color: rgba(255,255,255,0.38);
          margin-bottom: 5px;
        }
        .dashboard-header h1 {
          font-size: clamp(25px, 4vw, 34px);
          font-weight: 800;
          letter-spacing: 0;
          line-height: 1.15;
        }
        .dashboard-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          margin-top: 7px;
        }
        .date-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.55);
          font-size: 12px;
          white-space: nowrap;
        }
        .dashboard-error {
          padding: 18px;
          margin-bottom: 20px;
          color: #fca5a5;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .retry-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(252,165,165,0.24);
          background: rgba(252,165,165,0.08);
          color: #fecaca;
          border-radius: 9px;
          padding: 8px 11px;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s;
        }
        .retry-button:hover,
        .retry-button:focus-visible {
          border-color: rgba(252,165,165,0.44);
          background: rgba(252,165,165,0.13);
          outline: none;
        }
        .section-title {
          font-size: 13px;
          font-weight: 800;
          color: rgba(255,255,255,0.72);
          margin: 2px 0 12px;
          letter-spacing: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-card {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          min-width: 0;
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-value {
          font-size: 22px;
          font-weight: 800;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }
        .stat-label {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          margin-top: 2px;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .chart-wide {
          grid-column: span 2;
        }
        .chart-card {
          padding: 20px;
          min-height: 230px;
        }
        .chart-head {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
        }
        .chart-body {
          height: 180px;
        }
        .dashboard-lower-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .dashboard-panel {
          padding: 20px;
        }
        .panel-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.68);
          margin-bottom: 14px;
        }
        .insight-groups {
          display: grid;
          gap: 12px;
        }
        .insight-group {
          padding-left: 14px;
          border-left: 2px solid rgba(108,99,255,0.55);
        }
        .insight-group h3 {
          font-size: 11px;
          font-weight: 800;
          color: rgba(255,255,255,0.68);
          margin: 0 0 5px;
        }
        .insight-group ul {
          padding: 0;
          margin: 0;
          list-style: none;
        }
        .insight-group li {
          font-size: 13px;
          line-height: 1.45;
          color: rgba(255,255,255,0.58);
          margin-top: 4px;
        }
        .progress-list {
          display: grid;
          gap: 14px;
        }
        .progress-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.58);
          margin-bottom: 7px;
        }
        .progress-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #6c63ff, #a855f7);
        }
        .activity-list {
          display: grid;
          gap: 2px;
        }
        .activity-row {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .activity-row:last-child {
          border-bottom: none;
        }
        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(108,99,255,0.13);
          color: #a78bfa;
        }
        .activity-row p {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.72);
          margin: 0 0 2px;
        }
        .activity-row span,
        .activity-row time,
        .muted-copy {
          font-size: 12px;
          color: rgba(255,255,255,0.38);
        }
        .activity-row time {
          white-space: nowrap;
        }
        .empty-state {
          padding: 58px 28px;
          text-align: center;
        }
        .empty-icon {
          width: 54px;
          height: 54px;
          margin: 0 auto 16px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(108,99,255,0.12);
          color: #a78bfa;
          border: 1px solid rgba(108,99,255,0.22);
        }
        .empty-state h2 {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .empty-state p {
          max-width: 560px;
          margin: 0 auto;
          color: rgba(255,255,255,0.45);
          font-size: 14px;
          line-height: 1.6;
        }
        .widget-empty {
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: rgba(255,255,255,0.42);
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
        }
        .dashboard-loading {
          display: grid;
          gap: 16px;
        }
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 12px;
        }
        .skeleton-chart-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .skeleton-card {
          min-height: 74px;
          border-radius: 12px;
          background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04));
          background-size: 220% 100%;
          border: 1px solid rgba(255,255,255,0.06);
          animation: dashboard-pulse 1.4s ease-in-out infinite;
        }
        .skeleton-header {
          max-width: 520px;
          min-height: 88px;
        }
        .skeleton-chart {
          min-height: 230px;
        }
        @keyframes dashboard-pulse {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
        @media (max-width: 980px) {
          .analytics-grid,
          .dashboard-lower-grid,
          .skeleton-chart-grid {
            grid-template-columns: 1fr;
          }
          .chart-wide {
            grid-column: auto;
          }
        }
        @media (max-width: 640px) {
          .dashboard-shell {
            padding: 24px 14px;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          .chart-card,
          .dashboard-panel {
            padding: 16px;
          }
          .activity-row {
            grid-template-columns: auto minmax(0, 1fr);
          }
          .activity-row time {
            grid-column: 2;
            white-space: normal;
          }
        }
        @media (max-width: 420px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

async function fetchAnalytics(path) {
  try {
    const response = await authFetch(path);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function buildDashboardModel(data) {
  const totalInterviews = data.interview.stats.total_sessions + data.aiInterview.total_sessions;
  const interviewScores = [
    ...toArray(data.interview.charts.trend.scores),
    ...toArray(data.aiInterview.recent_scores).map((item) => item.score),
  ].map((score) => toNumber(score)).filter((score) => score > 0);
  const avgScore = interviewScores.length
    ? Math.round(interviewScores.reduce((sum, score) => sum + score, 0) / interviewScores.length)
    : 0;
  const bestScore = Math.max(data.interview.stats.best_score, ...interviewScores, 0);
  const resumeScore = toNumber(data.resume.latest_scores?.overall || data.resume.avg_score);
  const resumeAtsScore = toNumber(data.resume.latest_scores?.ats);
  const companiesPrepared = countCompaniesPrepared(data);
  const latestJobMatch = Math.max(...data.jobMatchHistory.map((item) => item.top_match_score), 0);
  const codingCompletion = clamp(data.coding.completion);

  const stats = [
    { icon: <Mic size={18} />, label: 'Interviews Completed', value: totalInterviews, color: '#6c63ff' },
    { icon: <Code2 size={18} />, label: 'Coding Problems Solved', value: data.coding.problems_solved, color: '#3b82f6' },
    { icon: <FileText size={18} />, label: 'Resume Score', value: formatScore(resumeScore), color: '#10b981' },
    { icon: <Briefcase size={18} />, label: 'Job Matches', value: data.jobMatchHistory.length, color: '#14b8a6' },
    { icon: <Building2 size={18} />, label: 'Companies Prepared', value: companiesPrepared, color: '#f59e0b' },
  ];

  const activities = buildActivities(data);
  const charts = buildPerformanceCharts(data);
  const insights = buildInsights(data, {
    avgScore,
    bestScore,
    resumeScore,
    resumeAtsScore,
    codingCompletion,
    latestJobMatch,
    trendScores: charts.trend.scores,
  });
  const goals = buildGoals({
    avgScore,
    codingCompletion,
    latestJobMatch,
    resumeScore,
    weeklyProgress: weeklyTargetProgress(charts.weekly.counts),
  });

  return {
    stats,
    activities,
    charts,
    insights,
    goals,
    hasAnyAnalytics: Boolean(
      totalInterviews ||
      data.coding.problems_solved ||
      data.resume.total_analyses ||
      data.resume.total_resumes ||
      data.jobMatchHistory.length ||
      data.savedCompanies.length
    ),
    hasCharts: [
      charts.trend.scores,
      charts.weekly.counts,
      charts.coding.values,
      charts.resume.scores,
      charts.jobMatch.scores,
    ].some(hasPositiveSeries),
  };
}

function buildPerformanceCharts(data) {
  const aiScoresAscending = [...data.aiInterview.recent_scores]
    .filter((item) => item.score > 0)
    .reverse();

  const trendLabels = [...data.interview.charts.trend.labels];
  const trendScores = [...data.interview.charts.trend.scores];
  aiScoresAscending.forEach((item) => {
    trendLabels.push(item.date ? formatDate(item.date) : capitalize(item.type));
    trendScores.push(item.score);
  });

  const weekly = buildWeeklyActivity(data);
  const coding = buildCodingProgress(data);
  const resume = buildResumeScoreTrend(data);
  const jobMatch = buildJobMatchTrend(data);

  return {
    trend: {
      labels: trendLabels.slice(-10),
      scores: trendScores.slice(-10),
    },
    weekly,
    coding,
    resume,
    jobMatch,
  };
}

function buildWeeklyActivity(data) {
  const fallbackLabels = data.interview.charts.weekly.labels.length
    ? data.interview.charts.weekly.labels
    : lastSevenDayLabels();
  const counts = normalizeFixedLength(data.interview.charts.weekly.counts, fallbackLabels.length);

  const datedItems = [
    ...data.aiInterview.recent_scores.map((item) => item.date),
    ...data.resume.score_history.map((item) => item.date),
    ...data.jobMatchHistory.map((item) => item.created_at),
    ...data.savedCompanies.map((item) => item.saved_at),
  ];

  datedItems.forEach((value) => {
    const date = parseDate(value);
    if (!date) return;
    const diff = daysAgo(date);
    if (diff >= 0 && diff < counts.length) {
      counts[counts.length - 1 - diff] += 1;
    }
  });

  return { labels: fallbackLabels, counts };
}

function buildCodingProgress(data) {
  if (data.coding.problems_solved <= 0) {
    return { labels: [], values: [] };
  }

  return {
    labels: ['Easy', 'Medium', 'Hard'],
    values: [
      data.coding.easy.solved,
      data.coding.medium.solved,
      data.coding.hard.solved,
    ],
  };
}

function buildResumeScoreTrend(data) {
  const history = data.resume.score_history
    .filter((item) => item.overall > 0 || item.ats > 0)
    .slice(-10);

  return {
    labels: history.map((item) => formatDate(item.date)),
    scores: history.map((item) => item.overall || item.ats),
  };
}

function buildJobMatchTrend(data) {
  const history = [...data.jobMatchHistory]
    .filter((item) => item.top_match_score > 0)
    .reverse()
    .slice(-10);

  return {
    labels: history.map((item) => item.top_match_company || formatDate(item.created_at)),
    scores: history.map((item) => item.top_match_score),
  };
}

function buildActivities(data) {
  const activities = [];

  data.aiInterview.recent_scores.forEach((item, index) => {
    activities.push({
      id: `ai-${index}`,
      title: 'Interview Completed',
      meta: `${capitalize(item.type)} interview${item.company ? ` at ${item.company}` : ''}`,
      date: parseDate(item.date),
      dateLabel: formatDate(item.date),
      icon: <Mic size={15} />,
    });
  });

  data.interview.recent_sessions.forEach((item, index) => {
    activities.push({
      id: `classic-${index}`,
      title: 'Interview Completed',
      meta: `${item.category || 'Practice'} interview`,
      date: parseDate(item.date),
      dateLabel: item.date || 'Recent',
      icon: <Award size={15} />,
    });
  });

  data.resume.score_history.slice(-3).forEach((item, index) => {
    activities.push({
      id: `resume-${index}`,
      title: 'Resume Updated',
      meta: `ATS score ${formatScore(item.ats)}`,
      date: parseDate(item.date),
      dateLabel: formatDate(item.date),
      icon: <FileText size={15} />,
    });
  });

  data.jobMatchHistory.slice(0, 5).forEach((item, index) => {
    activities.push({
      id: `job-match-${index}`,
      title: 'Job Match Generated',
      meta: item.top_match_company ? `${item.top_match_company} - ${formatScore(item.top_match_score)}` : 'Job matching report',
      date: parseDate(item.created_at),
      dateLabel: formatDate(item.created_at),
      icon: <Briefcase size={15} />,
    });
  });

  data.savedCompanies.slice(0, 5).forEach((item, index) => {
    activities.push({
      id: `company-${index}`,
      title: 'Company Prepared',
      meta: item.company || 'Saved company',
      date: parseDate(item.saved_at),
      dateLabel: formatDate(item.saved_at),
      icon: <Building2 size={15} />,
    });
  });

  return activities
    .filter((item) => item.date || item.dateLabel)
    .sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0))
    .slice(0, 8);
}

function buildGoals(metrics) {
  return [
    metrics.avgScore > 0 && { label: 'Interview Goal', value: metrics.avgScore },
    metrics.codingCompletion > 0 && { label: 'Coding Goal', value: metrics.codingCompletion },
    metrics.resumeScore > 0 && { label: 'Resume Score Progress', value: metrics.resumeScore },
    metrics.latestJobMatch > 0 && { label: 'Job Match Readiness', value: metrics.latestJobMatch },
    metrics.weeklyProgress > 0 && { label: 'Weekly Target', value: metrics.weeklyProgress },
  ].filter(Boolean);
}

function buildInsights(data, metrics) {
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];
  const trend = toArray(metrics.trendScores).filter((score) => score > 0);
  const firstTrend = trend[0];
  const lastTrend = trend[trend.length - 1];
  const aiTypes = data.aiInterview.by_round_type;

  if (trend.length >= 2 && lastTrend > firstTrend) {
    strengths.push('Interview scores are improving across recent practice sessions.');
  }
  if (aiTypes.hr.avg > 0 && aiTypes.technical.avg > 0 && aiTypes.hr.avg > aiTypes.technical.avg) {
    strengths.push('HR interview performance is stronger than technical interview performance.');
    weaknesses.push('Technical interview performance trails HR interview performance.');
  }
  if (aiTypes.technical.avg > 0 && aiTypes.technical.avg < 60) {
    weaknesses.push('Technical interview average is below 60%.');
    recommendations.push('Prioritize technical interview practice before the next mock session.');
  }
  if (metrics.codingCompletion > 0 && metrics.codingCompletion < 50) {
    weaknesses.push('Coding completion is still below 50%.');
    recommendations.push('Increase DSA practice volume to improve coding readiness.');
  }
  if (metrics.resumeAtsScore > 0 && metrics.resumeAtsScore < 75) {
    weaknesses.push('Resume ATS score is below 75%.');
    recommendations.push('Improve resume keywords and section completeness to raise ATS performance.');
  }
  if (data.jobMatchHistory.length > 0 && metrics.resumeAtsScore === 0) {
    recommendations.push('Analyze your resume to improve job matching confidence.');
  }
  if (metrics.avgScore > 0 && metrics.avgScore >= 75) {
    strengths.push('Interview average is strong and above 75%.');
    recommendations.push('Keep practicing to maintain interview consistency.');
  }

  return {
    strengths: strengths.slice(0, 2),
    weaknesses: weaknesses.slice(0, 2),
    recommendations: recommendations.slice(0, 2),
    nextBestAction: chooseNextBestAction(metrics, data),
    hasInsights: Boolean(strengths.length || weaknesses.length || recommendations.length || chooseNextBestAction(metrics, data)),
  };
}

function chooseNextBestAction(metrics, data) {
  if (metrics.resumeAtsScore > 0 && metrics.resumeAtsScore < 75) {
    return 'Update and re-analyze your resume.';
  }
  if (metrics.codingCompletion > 0 && metrics.codingCompletion < 50) {
    return 'Complete another coding practice session.';
  }
  if (metrics.avgScore > 0 && metrics.avgScore < 70) {
    return 'Complete another AI interview to improve consistency.';
  }
  if (data.jobMatchHistory.length > 0 && metrics.latestJobMatch < 70) {
    return 'Review job match gaps before applying.';
  }
  if (metrics.avgScore >= 75 || metrics.resumeScore >= 75 || metrics.latestJobMatch >= 75) {
    return 'Maintain momentum with one focused practice activity this week.';
  }
  return '';
}

function EmptyAnalyticsState() {
  return (
    <div className="glass-card animate-slide-up empty-state">
      <div className="empty-icon">
        <BarChart3 size={24} />
      </div>
      <h2>No analytics available yet.</h2>
      <p>
        Complete your first interview, prepare a company or upload a resume to start tracking your progress.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-loading" aria-label="Loading dashboard analytics">
      <div className="skeleton-card skeleton-header" />
      <div className="skeleton-grid">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton-card" />
        ))}
      </div>
      <div className="skeleton-chart-grid">
        <div className="skeleton-card skeleton-chart chart-wide" />
        <div className="skeleton-card skeleton-chart" />
      </div>
    </div>
  );
}

function SectionTitle({ id, title }) {
  return (
    <h2 id={id} className="section-title">
      {title}
    </h2>
  );
}

function WidgetEmptyState({ message }) {
  return (
    <div className="glass-card animate-slide-up widget-empty">
      <BarChart3 size={18} />
      <p>{message}</p>
    </div>
  );
}

function InsightGroup({ title, items }) {
  if (!items.length) return null;
  return (
    <section className="insight-group" aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function PanelTitle({ icon, title }) {
  return (
    <h2 className="panel-title">
      {icon}
      {title}
    </h2>
  );
}

function ChartCard({ title, icon, children, className = '', delay = 0 }) {
  return (
    <div className={`glass-card animate-slide-up chart-card ${className}`} style={{ animationDelay: `${delay}s` }}>
      <h2 className="chart-head">
        {icon}
        {title}
      </h2>
      <div className="chart-body">{children}</div>
    </div>
  );
}

function ProgressRow({ label, value }) {
  const safeValue = clamp(value);
  return (
    <div>
      <div className="progress-top">
        <span>{label}</span>
        <strong>{safeValue}%</strong>
      </div>
      <div className="progress-track" aria-label={`${label}: ${safeValue}%`}>
        <div className="progress-fill" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }) {
  return (
    <div
      className="glass-card animate-slide-up stat-card"
      style={{ animationDelay: `${delay}s` }}
      onMouseEnter={(event) => { event.currentTarget.style.borderColor = `${color}40`; }}
      onMouseLeave={(event) => { event.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div className="stat-icon" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
        {icon}
      </div>
      <div>
        <div className="stat-value">{value ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function normalizeInterviewAnalytics(payload = {}) {
  const trend = normalizeSeries(payload?.charts?.trend?.labels, payload?.charts?.trend?.scores);
  const radar = normalizeSeries(payload?.charts?.radar?.labels, payload?.charts?.radar?.scores);
  const distribution = normalizeSeries(
    payload?.charts?.distribution?.labels ?? EMPTY_INTERVIEW_ANALYTICS.charts.distribution.labels,
    payload?.charts?.distribution?.counts ?? EMPTY_INTERVIEW_ANALYTICS.charts.distribution.counts,
  );
  const weekly = normalizeSeries(payload?.charts?.weekly?.labels, payload?.charts?.weekly?.counts);

  return {
    stats: {
      total_sessions: toNumber(payload?.stats?.total_sessions),
      avg_score: toNumber(payload?.stats?.avg_score),
      best_score: toNumber(payload?.stats?.best_score),
      total_answers: toNumber(payload?.stats?.total_answers),
    },
    charts: {
      trend: { labels: trend.labels, scores: trend.values },
      radar: { labels: radar.labels, scores: radar.values },
      distribution: { labels: distribution.labels, counts: distribution.values },
      weekly: { labels: weekly.labels, counts: weekly.values },
    },
    recent_sessions: toArray(payload?.recent_sessions),
  };
}

function normalizeAiAnalytics(payload = {}) {
  return {
    total_sessions: toNumber(payload?.total_sessions),
    avg_score: toNumber(payload?.avg_score),
    by_round_type: {
      hr: normalizeRound(payload?.by_round_type?.hr),
      technical: normalizeRound(payload?.by_round_type?.technical),
      behavioral: normalizeRound(payload?.by_round_type?.behavioral),
    },
    recent_scores: toArray(payload?.recent_scores).map((score) => ({
      ...score,
      type: score?.type || 'general',
      score: toNumber(score?.score),
    })),
  };
}

function normalizeCodingAnalytics(payload = {}) {
  return {
    total_problems: toNumber(payload?.total_problems),
    problems_solved: toNumber(payload?.problems_solved),
    completion: clamp(payload?.completion),
    easy: normalizeCodingBucket(payload?.easy),
    medium: normalizeCodingBucket(payload?.medium),
    hard: normalizeCodingBucket(payload?.hard),
  };
}

function normalizeCodingBucket(bucket = {}) {
  return {
    total: toNumber(bucket?.total),
    solved: toNumber(bucket?.solved),
  };
}

function normalizeResumeAnalytics(payload = {}) {
  return {
    total_resumes: toNumber(payload?.total_resumes),
    total_analyses: toNumber(payload?.total_analyses),
    best_score: toNumber(payload?.best_score),
    avg_score: toNumber(payload?.avg_score),
    latest_scores: payload?.latest_scores || null,
    score_history: toArray(payload?.score_history).map((item) => ({
      ...item,
      overall: toNumber(item?.overall),
      ats: toNumber(item?.ats),
      technical: toNumber(item?.technical),
    })),
  };
}

function normalizeJobMatch(item = {}) {
  return {
    ...item,
    top_match_score: toNumber(item?.top_match_score),
    hiring_probability: toNumber(item?.hiring_probability),
  };
}

function normalizeRound(round = {}) {
  return {
    count: toNumber(round?.count),
    avg: toNumber(round?.avg),
  };
}

function normalizeSeries(labels, values) {
  const safeLabels = toArray(labels).map((label) => String(label ?? ''));
  const safeValues = toArray(values).map((value) => toNumber(value));
  const length = Math.max(safeLabels.length, safeValues.length);

  return {
    labels: Array.from({ length }, (_, index) => safeLabels[index] || `Item ${index + 1}`),
    values: Array.from({ length }, (_, index) => safeValues[index] ?? 0),
  };
}

function countCompaniesPrepared(data) {
  const names = new Set();
  data.aiInterview.recent_scores.forEach((item) => {
    if (item.company) names.add(String(item.company).toLowerCase());
  });
  data.savedCompanies.forEach((item) => {
    if (item.company) names.add(String(item.company).toLowerCase());
  });
  return names.size;
}

function weeklyTargetProgress(counts) {
  const completed = toArray(counts).reduce((sum, count) => sum + toNumber(count), 0);
  return clamp((completed / 5) * 100);
}

function normalizeFixedLength(values, length) {
  return Array.from({ length }, (_, index) => toNumber(toArray(values)[index]));
}

function lastSevenDayLabels() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
  });
}

function daysAgo(date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOfToday - startOfDate) / 86400000);
}

function hasPositiveSeries(series) {
  return toArray(series).some((value) => toNumber(value) > 0);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(toNumber(value))));
}

function formatScore(value) {
  return `${clamp(value)}%`;
}

function capitalize(value) {
  const text = String(value || 'general');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function parseDate(value) {
  if (!value || value === '—') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return 'Recent';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
