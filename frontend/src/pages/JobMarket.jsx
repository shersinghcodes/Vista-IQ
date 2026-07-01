import Navbar from "../components/Navbar";
import { useState } from "react";
import { searchJobs } from "../api";

function JobMarket() {
    const [role, setRole] = useState("");
    const [location, setLocation] = useState("");
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);
    const [activeTab, setActiveTab] = useState("recommended");
    const [expandedJobs, setExpandedJobs] = useState({});

    const getCurrentLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLat(position.coords.latitude);
                setLng(position.coords.longitude);

                fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                )
                    .then(res => res.json())
                    .then(data => {
                        const city =
                            data.address.city ||
                            data.address.town ||
                            data.address.village ||
                            "";

                        setLocation(city);

                    })
                    .catch(() => {});
            },
            () => {}
        );
    };

    const handleSearch = async (currentPage = 1) => {

        setLoading(true);

        try {
            const data = await searchJobs(
                role,
                location,
                lat,
                lng,
                currentPage
            );

            setJobs(data.results || []);
            setTotalJobs(data.count || 0);
            setPage(currentPage);

        } catch {
            alert("Failed to fetch jobs");
        }

        setLoading(false);
    };

    const displayedJobs = [...jobs].sort((a, b) => {

        if (activeTab === "near") {
            return (
                (a.distance_km ?? 999999) -
                (b.distance_km ?? 999999)
            );
        }

        if (activeTab === "salary") {
            return (
                (b.salary_max ?? 0) -
                (a.salary_max ?? 0)
            );
        }

        if (activeTab === "latest") {
            return (
                new Date(b.created || 0) -
                new Date(a.created || 0)
            );
        }

        return 0;
    });

    return (
        <>
            <Navbar />

            <div className="bg-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>

            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "32px 24px",
                    position: "relative",
                    zIndex: 10,
                }}
            >

                {/* Header */}
                <div
                    className="animate-slide-up"
                    style={{
                        marginBottom: "28px",
                    }}
                >
                    <p
                        style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.35)",
                            marginBottom: "4px",
                        }}
                    >
                        Live Job Insights
                    </p>

                    <h1
                        style={{
                            fontSize: "30px",
                            fontWeight: 800,
                            letterSpacing: "-0.5px",
                            lineHeight: 1.2,
                        }}
                    >
                        Job Market
                        <span className="text-gradient">
                            {" "}Intelligence
                        </span>
                    </h1>

                    <p
                        style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.4)",
                            marginTop: "4px",
                        }}
                    >
                        Search real-time jobs by role and location
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "20px",
                    }}
                >
                    {[
                        ["recommended", "Recommended"],
                        ["near", "Near Me"],
                        ["salary", "Highest Paying"],
                        ["latest", "Latest"],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={
                                activeTab === key
                                    ? "btn-gradient"
                                    : "glass-card"
                            }
                            style={{
                                padding: "10px 16px",
                                borderRadius: "999px",
                                fontWeight: 600,
                                border: "none",
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Search Card */}
                <div
                    className="glass-card animate-slide-up"
                    style={{
                        padding: "20px",
                        marginBottom: "20px",
                    }}
                >

                    <div className="grid md:grid-cols-4 gap-4">

                        <div className="relative">

                            <span className="absolute left-3 top-3">
                                🔎
                            </span>

                            <input
                                type="text"
                                placeholder="Search Role..."
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3"
                            />

                        </div>

                        <div className="relative">

                            <span className="absolute left-3 top-3">
                                📍
                            </span>

                            <input
                                type="text"
                                placeholder="Search Location..."
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3"
                            />

                        </div>

                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            style={{
                                padding: "12px 22px",
                                borderRadius: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                border: lat && lng
                                    ? "1px solid rgba(34,197,94,0.45)"
                                    : "1px solid rgba(59,130,246,0.45)",
                                background: lat && lng
                                    ? "rgba(34,197,94,0.15)"
                                    : "rgba(59,130,246,0.15)",
                                color: lat && lng
                                    ? "#86efac"
                                    : "#93c5fd",
                                transition: "all 0.25s ease",
                            }}
                        >
                            {lat && lng
                                ? "✅ Location Detected"
                                : "📍 Use My Location"}
                        </button>

                        <button
                            onClick={() => handleSearch(1)}
                            className="btn-gradient"
                            style={{
                                padding: "12px 22px",
                                borderRadius: "12px",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Search Jobs
                        </button>

                    </div>

                </div>

                {/* Stats */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill,minmax(170px,1fr))",
                        gap: "12px",
                        marginBottom: "20px",
                    }}
                >
                    <StatCard
                        label="Jobs Found"
                        value={totalJobs}
                        color="#6c63ff"
                    />

                    <StatCard
                        label="Search Role"
                        value={role || "-"}
                        color="#a855f7"
                    />

                    <StatCard
                        label="Location"
                        value={location || "All"}
                        color="#ec4899"
                    />

                    <StatCard
                        label="Current Page"
                        value={page}
                        color="#3b82f6"
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-10">
                        Loading jobs...
                    </div>
                )}

                {/* Empty */}
                {!loading && jobs.length === 0 && (
                    <div
                        className="glass-card animate-slide-up"
                        style={{
                            padding: "60px",
                            textAlign: "center",
                        }}
                    >
                        <h2 className="text-2xl font-semibold mb-2">
                            Search Any Role
                        </h2>

                        <p className="text-slate-400">
                            Software Engineer, Data Analyst,
                            AI Engineer, Frontend Developer...
                        </p>
                    </div>
                )}

                {/* Jobs */}
                <div className="grid gap-5">

                    {displayedJobs.map((job, index) => (
                        <div
                            key={index}
                            className="glass-card animate-slide-up"
                            style={{
                                padding: "20px",
                            }}
                        >
                            <h2 className="text-2xl font-bold mb-2">
                                {job.title}
                            </h2>

                            <p className="text-purple-400 mb-4 font-semibold">
                                🏢 {job.company?.display_name}
                            </p>

                            <div className="grid md:grid-cols-3 gap-4 mb-4">

                                <div>
                                    <p className="text-slate-500 text-sm">
                                        Location
                                    </p>

                                    <p>
                                        {job.location?.display_name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500 text-sm">
                                        Salary
                                    </p>

                                    <p className="font-semibold text-green-400">
                                        {
                                            job.salary_min || job.salary_max
                                                ? `₹${(
                                                    (job.salary_min || job.salary_max) / 100000
                                                ).toFixed(1)}L - ₹${(
                                                    (job.salary_max || job.salary_min) / 100000
                                                ).toFixed(1)}L`
                                                : "Salary not disclosed"
                                        }
                                    </p>

                                    {job.distance_km !== null && (
                                        <p className="inline-block mt-2 bg-cyan-900/40 px-3 py-1 rounded-full text-cyan-300 text-sm">
                                            📏 {job.distance_km} km away
                                        </p>
                                    )}

                                </div>

                                <div>
                                    <p className="text-slate-500 text-sm">
                                        Posted
                                    </p>

                                    <p className="text-yellow-400">
                                        📅 {job.created
                                            ? (() => {

                                                const diff = Math.max(
                                                    0,
                                                    Math.floor(
                                                        (Date.now() -
                                                            new Date(job.created).getTime()) /
                                                        86400000
                                                    )
                                                );

                                                if (diff === 0)
                                                    return "Today";

                                                if (diff === 1)
                                                    return "Yesterday";

                                                return `${diff} days ago`;

                                            })()
                                            : "Unknown"}
                                    </p>
                                </div>

                            </div>

                            {job.description && (
                                <>
                                    <p
                                        className={`text-slate-300 mb-2 ${expandedJobs[index]
                                            ? ""
                                            : "line-clamp-3"
                                            }`}
                                    >
                                        {job.description}
                                    </p>

                                    <button
                                        onClick={() =>
                                            setExpandedJobs(prev => ({
                                                ...prev,
                                                [index]: !prev[index]
                                            }))
                                        }
                                        className="text-cyan-400 text-sm hover:underline mb-4"
                                    >
                                        {expandedJobs[index]
                                            ? "Show Less ▲"
                                            : "Read More ▼"}
                                    </button>
                                </>
                            )}

                            <a
                                href={job.redirect_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-gradient"
                                style={{
                                    padding: "12px 20px",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                }}
                            >
                                Apply Now →
                            </a>
                        </div>
                    ))}

                </div>

                {/* Pagination */}
                {jobs.length > 0 && (
                    <div className="flex justify-center gap-4 mt-8">

                        <button
                            disabled={page <= 1}
                            onClick={() => handleSearch(page - 1)}
                            className="glass-card"
                            style={{
                                padding: "10px 18px",
                                opacity: page <= 1 ? 0.4 : 1,
                            }}
                        >
                            Previous
                        </button>

                        <span
                            className="glass-card"
                            style={{
                                padding: "10px 18px",
                            }}
                        >
                            Page {page}
                        </span>

                        <button
                            onClick={() => handleSearch(page + 1)}
                            className="glass-card"
                            style={{
                                padding: "10px 18px",
                            }}
                        >
                            Next
                        </button>

                    </div>
                )}

            </div>
        </>
    );
}

function StatCard({
    label,
    value,
    color
}) {
    return (
        <div
            className="glass-card animate-slide-up"
            style={{
                padding: "16px",
            }}
        >
            <div
                style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color,
                }}
            >
                {value}
            </div>

            <div
                style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.35)",
                    marginTop: "4px",
                }}
            >
                {label}
            </div>
        </div>
    );
}

export default JobMarket;
