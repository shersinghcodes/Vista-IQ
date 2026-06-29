import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Briefcase,
  Calendar,
  Camera,
  Download,
  FileText,
  Globe,
  GraduationCap,
  Languages as LanguagesIcon,
  Link as LinkIcon,
  MapPin,
  RotateCcw,
  Save,
  Share2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";

const getProfileKey = (uid) => `vistaiq_profile_${uid || "guest"}`;

const readLS = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const firstValue = (...values) => values.find((value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null;
});

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
};

const toText = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value ?? "";
};

const mergeExistingProfile = (authUser, profile) => {
  const uid = authUser?.id || authUser?.uid;

  const saved = readLS(getProfileKey(uid), {});

  // New user -> blank profile
  if (Object.keys(saved).length === 0) {
    return {
      photoURL: authUser?.avatar_url || authUser?.photoURL || "",
      coverPhoto: "",

      name: authUser?.name || authUser?.displayName || "",
      email: authUser?.email || "",

      title: "",
      phone: "",
      location: "",
      bio: "",
      dob: "",
      gender: "",
      languages: "",
      linkedin: "",
      github: "",
      portfolio: "",
      website: "",
    };
  }

  // Existing user -> load saved profile
  return {
    ...saved,

    photoURL:
      saved.photoURL ||
      authUser?.avatar_url ||
      authUser?.photoURL ||
      "",

    coverPhoto: saved.coverPhoto || "",

    name: authUser?.name || authUser?.displayName || saved.name || "",
    email: authUser?.email || saved.email || "",

    title: saved.title || "",
    phone: saved.phone || "",
    location: saved.location || "",
    bio: saved.bio || "",
    dob: saved.dob || "",
    gender: saved.gender || "",
    languages: saved.languages || saved.languagesText || "",
    linkedin: saved.linkedin || "",
    github: saved.github || "",
    portfolio: saved.portfolio || "",
    website: saved.website || "",
  };
};

function ProfileInput({ label, value, onChange, placeholder, type = "text", error }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-wider mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.07] transition-all ${error ? "border-red-500/40" : "border-white/10"}`}
      />
      {error && <p className="text-[11px] text-red-300/80 mt-1">{error}</p>}
    </div>
  );
}

function ReadOnlyField({ label, value, placeholder }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="w-full min-h-[42px] bg-white/[0.025] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/70 flex items-center">
        {value || <span className="text-white/20">{placeholder}</span>}
      </div>
    </div>
  );
}

function ProfileTextarea({ label, value, onChange, placeholder, error }) {
  return (
    <div className="md:col-span-2">
      <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-wider mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        maxLength={500}
        aria-invalid={Boolean(error)}
        className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.07] transition-all resize-none ${error ? "border-red-500/40" : "border-white/10"}`}
      />
      <div className="flex items-center justify-between mt-1">
        {error ? <p className="text-[11px] text-red-300/80">{error}</p> : <span />}
        <p className="text-[11px] text-white/25">{value.length}/500</p>
      </div>
    </div>
  );
}

function ProfileSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-wider mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/60 focus:bg-[#171725] transition-all"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#171725]">
            {option || "Prefer not to say"}
          </option>
        ))}
      </select>
    </div>
  );
}

function UploadButton({ label, onUpload, onError }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (!file.type.startsWith("image/")) {
            onError?.("Please upload an image file.");
            e.target.value = "";
            return;
          }
          if (file.size > 3 * 1024 * 1024) {
            onError?.("Image must be smaller than 3 MB.");
            e.target.value = "";
            return;
          }

          const reader = new FileReader();
          setUploading(true);
          reader.onload = () => {
            onUpload(reader.result);
            setUploading(false);
          };
          reader.onerror = () => {
            onError?.("Image upload failed. Try another image.");
            setUploading(false);
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white/75 bg-white/10 border border-white/10 hover:bg-white/15 hover:text-white transition-all disabled:opacity-60"
        aria-label={label}
      >
        <Camera size={13} />
        {uploading ? "Uploading..." : label}
      </button>
    </>
  );
}

function SummaryCard({ icon: Icon, title, count }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-500/12 border border-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
            <Icon size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white/80 truncate">{title}</h3>
            <p className="text-xs text-white/35 mt-0.5">{count} item{count === 1 ? "" : "s"}</p>
          </div>
        </div>
        <span className="text-lg font-extrabold text-white">{count}</span>
      </div>
      <Link
        to="/resume-builder"
        className="text-xs text-purple-300/80 hover:text-purple-200 font-semibold inline-flex items-center gap-1"
      >
        Edit in Resume Builder
        <LinkIcon size={11} />
      </Link>
    </div>
  );
}

function ActivityItem({ item }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.06] last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/50 shrink-0">
        <Sparkles size={13} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-white/70">{item.text}</p>
        <p className="text-xs text-white/30 mt-0.5">
          {item.ts ? new Date(item.ts).toLocaleDateString() : item.date ?? "Recently"}
        </p>
      </div>
    </div>
  );
}

function ProfilePageContent() {
  const { user, updateUser } = useAuth();
  const { profile, moduleData, saveProfile, saving } = useProfile();
  const [form, setForm] = useState(() =>
    mergeExistingProfile(user, profile)
  );
  const [savedForm, setSavedForm] = useState(form);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const setField = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus("");
    setError("");
    setDirty(true);
  };

  useEffect(() => {
    if (dirty) return;
    const next = mergeExistingProfile(user, profile);
    setForm(next);
    setSavedForm(next);
  }, [dirty, profile, user]);

  const completion = useMemo(() => {
    const fields = [
      form.photoURL,
      form.coverPhoto,
      form.name,
      form.title,
      form.email,
      form.phone,
      form.location,
      form.bio,
      form.dob,
      form.gender,
      form.languages,
      form.linkedin,
      form.github,
      form.portfolio,
      form.website,
    ];
    const filled = fields.filter(hasValue).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const validation = useMemo(() => {
    const errors = {};
    if (form.phone && !/^[0-9+\-()\s]{7,20}$/.test(form.phone.trim())) {
      errors.phone = "Use a valid phone number.";
    }
    if (form.linkedin && !/^(https?:\/\/)?([\w-]+\.)?linkedin\.com\/.+/i.test(form.linkedin.trim())) {
      errors.linkedin = "Use a valid LinkedIn URL.";
    }
    if (form.github && !/^(https?:\/\/)?([\w-]+\.)?github\.com\/.+/i.test(form.github.trim())) {
      errors.github = "Use a valid GitHub URL.";
    }
    if (form.portfolio && !/^((https?:\/\/)?[\w.-]+\.[a-z]{2,})(\/.*)?$/i.test(form.portfolio.trim())) {
      errors.portfolio = "Use a valid portfolio URL.";
    }
    if (form.website && !/^((https?:\/\/)?[\w.-]+\.[a-z]{2,})(\/.*)?$/i.test(form.website.trim())) {
      errors.website = "Use a valid website URL.";
    }
    if (form.bio && form.bio.length > 500) {
      errors.bio = "Bio must be 500 characters or less.";
    }
    return errors;
  }, [form]);

  const hasErrors = Object.keys(validation).length > 0;

  const sectionCounts = useMemo(() => ([
    { icon: Briefcase, title: "Experience", count: 0 },
    { icon: GraduationCap, title: "Education", count: 0 },
    { icon: Sparkles, title: "Skills", count: 0 },
    { icon: FileText, title: "Projects", count: 0 },
    { icon: Briefcase, title: "Internship", count: 0 },
    { icon: Calendar, title: "Training", count: 0 },
    { icon: Award, title: "Achievement", count: 0 },
    { icon: Award, title: "Certificates", count: 0 },
  ]), []);

  const handleSave = async () => {
    if (hasErrors) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }

    try {
      await saveProfile({ ...form, languagesText: form.languages });
      updateUser?.({
        name: form.name,
        email: form.email,
        avatar_url: form.photoURL,
      });
      setSavedForm(form);
      setDirty(false);
      setStatus("Profile saved");
    } catch {
      setError("Profile save failed. Please try again.");
    }
  };

  const handleCancel = () => {
    setForm(savedForm);
    setDirty(false);
    setError("");
    setStatus("Changes cancelled");
  };

  const handleReset = async () => {
    localStorage.removeItem(
      getProfileKey(user?.id || user?.uid)
    );
    const fresh = mergeExistingProfile(user, {});
    setForm(fresh);
    setSavedForm(fresh);
    await saveProfile({ ...fresh, languagesText: fresh.languages });
    updateUser?.({
      name: fresh.name,
      email: fresh.email,
      avatar_url: fresh.photoURL,
    });
    setDirty(false);
    setError("");
    setStatus("Profile reset successfully");
  };

  const handleShareResume = async () => {
    const shareText = `${form.name || "My"} resume is available in Vista IQ.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${form.name || "Vista IQ"} Resume`,
          text: shareText,
          url: window.location.origin + "/resume-builder",
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin + "/resume-builder");
      }
      setStatus("Resume link ready to share");
    } catch {
      setError("Share cancelled or unavailable.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <main className="min-h-screen relative z-10 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="glass-card overflow-hidden animate-slide-up">
            <div
              className="h-40 sm:h-48 bg-white/[0.04] border-b border-white/8 relative"
              style={{
                backgroundImage: form.coverPhoto
                  ? `linear-gradient(rgba(8,8,15,0.12), rgba(8,8,15,0.58)), url(${form.coverPhoto})`
                  : "linear-gradient(135deg, rgba(108,99,255,0.32), rgba(168,85,247,0.18), rgba(236,72,153,0.16))",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute right-3 top-3 sm:right-5 sm:top-5">
                <UploadButton label="Cover Upload" onUpload={setField("coverPhoto")} onError={setError} />
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-5 sm:pb-6">
              <div className="-mt-12 sm:-mt-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-end gap-3 sm:gap-4 min-w-0">
                  <div className="relative">
                    <div
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-[#10101c] bg-[#171725] overflow-hidden flex items-center justify-center text-white/45"
                      style={{
                        backgroundImage: form.photoURL ? `url(${form.photoURL})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {!form.photoURL && <User size={36} />}
                    </div>
                    <div className="absolute -right-2 bottom-2">
                      <UploadButton label="Photo" onUpload={setField("photoURL")} onError={setError} />
                    </div>
                  </div>

                  <div className="pb-2 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                      {form.name || "Your Profile"}
                    </h1>
                    <p className="text-sm text-white/45 mt-1 truncate">
                      {form.title || "Add a professional title"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pb-2 w-full sm:w-auto">
                  <button
                    onClick={handleShareResume}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/8 border border-white/10 text-white/70 hover:text-white hover:bg-white/12 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <Share2 size={13} />
                    Share Resume
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <section className="glass-card p-5 animate-slide-up" style={{ animationDelay: "0.05s" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-white/85">Personal Information</h2>
                  <p className="text-xs text-white/35 mt-1">Name and email come from your account.
                    All other information is managed independently in your profile.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={!dirty || saving}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-white/55 hover:text-white border border-white/10 hover:bg-white/5 transition-all inline-flex items-center gap-2 disabled:opacity-40"
                  >
                    <X size={13} />
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-white/55 hover:text-white border border-white/10 hover:bg-white/5 transition-all inline-flex items-center gap-2 disabled:opacity-40"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !dirty || hasErrors}
                    className="btn-gradient px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={13} />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {status && (
                <div role="status" className="mb-4 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  {status}
                </div>
              )}
              {error && (
                <div role="alert" className="mb-4 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Name" value={form.name} placeholder="Auto-filled from your account" />
                <ReadOnlyField label="Professional Title" value={form.title} placeholder="Saved in your profile" />
                <ReadOnlyField label="Email" value={form.email} placeholder="Auto-filled from account" />
                <ProfileInput label="Phone" value={form.phone} onChange={setField("phone")} placeholder="+1 (555) 000-0000" error={validation.phone} />
                <ProfileInput label="Location" value={form.location} onChange={setField("location")} placeholder="City, State" />
                <ProfileInput label="DOB" value={form.dob} onChange={setField("dob")} type="date" />
                <ProfileSelect label="Gender" value={form.gender} onChange={setField("gender")} options={["", "Female", "Male", "Non-binary", "Prefer not to say"]} />
                <ProfileInput label="Languages" value={form.languages} onChange={setField("languages")} placeholder="English, Hindi" />
                <ProfileInput label="LinkedIn" value={form.linkedin} onChange={setField("linkedin")} placeholder="linkedin.com/in/you" error={validation.linkedin} />
                <ProfileInput label="GitHub" value={form.github} onChange={setField("github")} placeholder="github.com/you" error={validation.github} />
                <ProfileInput label="Portfolio" value={form.portfolio} onChange={setField("portfolio")} placeholder="portfolio.example.com" error={validation.portfolio} />
                <ProfileInput label="Website" value={form.website} onChange={setField("website")} placeholder="yourwebsite.com" error={validation.website} />
                <ProfileTextarea label="Bio" value={form.bio} onChange={setField("bio")} placeholder="A short professional bio..." error={validation.bio} />
              </div>
            </section>

            <aside className="space-y-6">
              <section className="glass-card p-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white/80">Profile Completion</h2>
                  <span className="text-lg font-extrabold text-white">{completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6c63ff] via-[#a855f7] to-[#ec4899] transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/[0.04] border border-white/8 rounded-xl p-3">
                    <p className="text-xs text-white/35">Resume Score</p>
                    <p className="text-xl font-extrabold mt-1">{moduleData.resumeScore ?? "—"}</p>
                  </div>
                  <div className="bg-white/[0.04] border border-white/8 rounded-xl p-3">
                    <p className="text-xs text-white/35">ATS Score</p>
                    <p className="text-xl font-extrabold mt-1">{moduleData.atsScore ?? "—"}</p>
                  </div>
                </div>
              </section>

              <section className="glass-card p-5 animate-slide-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-sm font-bold text-white/80 mb-3">Contact Summary</h2>
                <div className="space-y-3 text-sm text-white/60">
                  <div className="flex items-center gap-2"><MapPin size={14} /> {form.location || "Location not added"}</div>
                  <div className="flex items-center gap-2"><LanguagesIcon size={14} /> {form.languages || "Languages not added"}</div>
                  <div className="flex items-center gap-2"><Globe size={14} /> {form.github || "GitHub not added"}</div>
                  <div className="flex items-center gap-2"><Globe size={14} /> {form.website || form.portfolio || "Website not added"}</div>
                </div>
              </section>
            </aside>
          </div>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white/85">Resume Summary</h2>
                <p className="text-xs text-white/35 mt-1">These sections are display-only here.</p>
              </div>
              <Link to="/resume-builder" className="btn-gradient px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2">
                <FileText size={13} />
                Edit in Resume Builder
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {sectionCounts.map((section) => (
                <SummaryCard key={section.title} {...section} />
              ))}
            </div>
          </section>

          <section className="glass-card p-5 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <h2 className="text-base font-bold text-white/85 mb-2">Recent Activity</h2>
            <div>
              {(moduleData.recentActivity ?? []).slice(0, 6).map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default function Profile() {
  return <ProfilePageContent />;
}
