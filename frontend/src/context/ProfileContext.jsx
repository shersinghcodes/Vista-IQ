/**
 * ProfileContext.jsx
 *
 * Central data layer for the Vista IQ Profile module.
 *
 * HOW IT CONNECTS TO YOUR BACKEND:
 * ─────────────────────────────────
 * Replace the `MOCK_*` constants below with real API calls,
 * Firebase listeners, or Redux selectors — all consumer components
 * read from this context so you only change one file.
 *
 * Example Firebase swap:
 *   const snap = await getDoc(doc(db, "users", uid));
 *   setProfile(snap.data());
 *
 * Example REST swap:
 *   const res = await fetch(`/api/profile/${uid}`);
 *   setProfile(await res.json());
 *
 * Data that already lives in other modules (Resume Builder, Coding,
 * Interview, Roadmap) is read from localStorage keys those modules
 * write.  Override `readModuleData()` to pull from your real store.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

// ─── local-storage keys written by other Vista IQ modules ────────────────────
const LS_KEYS = {
  RESUME: "vistaiq_resume_v1",
  RESUME_LEGACY: "vistaiq_resume",
  CODING: "vistaiq_coding",
  INTERVIEW: "vistaiq_interview",
  ROADMAP: "vistaiq_roadmap",
  PROFILE: "vistaiq_profile",
};

const getProfileKey = (uid) => `vistaiq_profile_${uid || "guest"}`;

export const PROFILE_UPDATED_EVENT = "vistaiq_profile_updated";

// ─── fallback / seed data (shown when backend is unavailable) ─────────────────
const FALLBACK_PROFILE = {
  uid: null,
  name: "",
  email: "",
  photoURL: "",
  role: "Student",
  location: "",
  linkedin: "",
  github: "",
  bio: "",
  tier: "Free",
  visibility: "public",   // "public" | "private"
  skills: {
    technical: [],
    soft: [],
    languages: [],
    tools: [],
  },
  certifications: [],
  internships: [],
  trainings: [],
  achievements: [],
};

const FALLBACK_MODULE_DATA = {
  resumeScore: 0,
  atsScore: 0,
  interviewsDone: 0,
  problemsSolved: 0,
  roadmapsDone: 0,
  roadmapsTotal: 0,
  jobApplications: 0,
  internshipsDone: 0,
  trainingsDone: 0,
  certificationsDone: 0,
  achievementCount: 0,
  currentStreak: 0,
  practiceHours: 0,
  codingBreakdown: {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  },
  recentActivity: [],
  interviews: [],
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
}

function firstValue(...values) {
  return values.find((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    return value !== undefined && value !== null;
  });
}

function readResumeData() {
  return readLS(LS_KEYS.RESUME, null) ?? readLS(LS_KEYS.RESUME_LEGACY, {});
}

function mergeProfileSources(currentUser, storedProfile) {
  return {
    ...FALLBACK_PROFILE,
    ...storedProfile,

    uid: firstValue(
      currentUser?.id,
      currentUser?.uid,
      storedProfile.uid,
      FALLBACK_PROFILE.uid
    ),

    // Account se
    name: firstValue(
      storedProfile.name,
      currentUser?.name,
      currentUser?.displayName,
      FALLBACK_PROFILE.name
    ),

    email: firstValue(
      storedProfile.email,
      currentUser?.email,
      FALLBACK_PROFILE.email
    ),

    photoURL: firstValue(
      currentUser?.avatar_url,
      currentUser?.photoURL,
      storedProfile.photoURL,
      ""
    ),

    // Sirf Profile se
    title: firstValue(
      storedProfile.title,
      storedProfile.role,
      FALLBACK_PROFILE.role
    ),

    role: firstValue(
      storedProfile.role,
      storedProfile.title,
      FALLBACK_PROFILE.role
    ),

    phone: firstValue(storedProfile.phone, ""),
    location: firstValue(storedProfile.location, ""),
    linkedin: firstValue(storedProfile.linkedin, ""),
    github: firstValue(storedProfile.github, ""),
    portfolio: firstValue(storedProfile.portfolio, ""),
    website: firstValue(storedProfile.website, ""),
    bio: firstValue(storedProfile.bio, ""),
    dob: firstValue(storedProfile.dob, ""),
    gender: firstValue(storedProfile.gender, ""),
    languagesText: firstValue(
      storedProfile.languagesText,
      storedProfile.languages,
      ""
    ),

    skills: storedProfile.skills ?? FALLBACK_PROFILE.skills,
    certifications:
      storedProfile.certifications ?? FALLBACK_PROFILE.certifications,
    internships:
      storedProfile.internships ?? FALLBACK_PROFILE.internships,
    trainings:
      storedProfile.trainings ?? FALLBACK_PROFILE.trainings,
    achievements:
      storedProfile.achievements ?? FALLBACK_PROFILE.achievements,
  };
}

/** Pull aggregated stats from module localStorage entries */
function readModuleData() {
  const resume = readResumeData();
  const coding = readLS(LS_KEYS.CODING, {});
  const interview = readLS(LS_KEYS.INTERVIEW, {});
  const roadmap = readLS(LS_KEYS.ROADMAP, {});

  // Merge whatever fields modules provide; fall back to seed values
  return {
    ...FALLBACK_MODULE_DATA,
    resumeScore: resume.score ?? FALLBACK_MODULE_DATA.resumeScore,
    atsScore: resume.atsScore ?? FALLBACK_MODULE_DATA.atsScore,
    problemsSolved: coding.solved ?? FALLBACK_MODULE_DATA.problemsSolved,
    currentStreak: coding.streak ?? FALLBACK_MODULE_DATA.currentStreak,
    interviewsDone: interview.completed ?? FALLBACK_MODULE_DATA.interviewsDone,
    roadmapsDone: roadmap.completed ?? FALLBACK_MODULE_DATA.roadmapsDone,
    codingBreakdown: coding.breakdown ?? FALLBACK_MODULE_DATA.codingBreakdown,
  };
}

// ─── context ─────────────────────────────────────────────────────────────────
const ProfileCtx = createContext(null);

export function ProfileProvider({ children, currentUser = null }) {
  const [profile, setProfileState] =
    useState(() =>
      mergeProfileSources(
        currentUser,
        readLS(
          getProfileKey(currentUser?.id || currentUser?.uid),
          {}
        )
      )
    );
  const [moduleData, setModuleData] = useState(readModuleData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync currentUser prop into profile (e.g. from Firebase Auth)
  useEffect(() => {
    if (!currentUser) return;

    const saved = readLS(
      getProfileKey(currentUser.id || currentUser.uid),
      {}
    );

    setProfileState(
      mergeProfileSources(currentUser, saved)
    );
  }, [currentUser]);

  // Re-read module data when window gains focus (other tabs may have updated)
  useEffect(() => {
    const handler = () => setModuleData(readModuleData());
    const profileHandler = (event) => {
      setProfileState(prev => mergeProfileSources(currentUser, event.detail ?? prev));
      setModuleData(readModuleData());
    };
    window.addEventListener("focus", handler);
    window.addEventListener("storage", handler);
    window.addEventListener(PROFILE_UPDATED_EVENT, profileHandler);
    return () => {
      window.removeEventListener("focus", handler);
      window.removeEventListener("storage", handler);
      window.removeEventListener(PROFILE_UPDATED_EVENT, profileHandler);
    };
  }, [currentUser]);

  /** Persist profile changes locally (swap for API call as needed) */
  const saveProfile = useCallback(async (patch) => {
    setSaving(true);
    try {
      // ── REPLACE with real API call ──
      // await updateDoc(doc(db, "users", profile.uid), patch);
      setProfileState((prev) => {
        const uid = prev.uid;

        const next = {
          ...prev,
          ...patch,
          uid,
        };

        writeLS(getProfileKey(uid), next);

        window.dispatchEvent(
          new CustomEvent(PROFILE_UPDATED_EVENT, {
            detail: next,
          })
        );

        return next;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  /** Update a single skill list */
  const updateSkills = useCallback((category, skills) => {
    saveProfile({ skills: { ...profile.skills, [category]: skills } });
  }, [profile.skills, saveProfile]);

  /** Computed profile-completion percentage */
  const completionPct = useMemo(() => {
    const fields = [
      profile.name, profile.email, profile.photoURL,
      profile.title ?? profile.role, profile.location, profile.linkedin,
      profile.github, profile.bio, profile.phone,
      profile.coverPhoto, profile.dob, profile.gender,
      profile.languagesText ?? profile.languages,
      profile.skills.technical.length > 0,
      profile.certifications.length > 0,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const value = useMemo(() => ({
    profile,
    moduleData,
    loading,
    saving,
    error,
    completionPct,
    saveProfile,
    updateSkills,
    setModuleData,
  }), [profile, moduleData, loading, saving, error, completionPct, saveProfile, updateSkills]);

  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
