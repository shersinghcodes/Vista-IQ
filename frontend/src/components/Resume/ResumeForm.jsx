import { useState } from "react";

/* ── Reusable Primitives ── */
const Label = ({ children }) => (
    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
        {children}
    </label>
);

const Input = ({ value, onChange, placeholder, type = "text", ...props }) => (
    <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all"
        {...props}
    />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
    <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all resize-none"
    />
);

const SectionHeader = ({ icon, label, count }) => (
    <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold text-white/80 tracking-tight">{label}</h3>
        {count !== undefined && (
            <span className="ml-auto text-xs text-white/30 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                {count}
            </span>
        )}
    </div>
);

const AddButton = ({ onClick, label }) => (
    <button
        onClick={onClick}
        className="w-full mt-3 py-2 rounded-lg border border-dashed border-purple-500/30 text-xs text-purple-400/70 hover:border-purple-400/60 hover:text-purple-300 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2"
    >
        <span className="text-base leading-none">+</span>
        {label}
    </button>
);

const RemoveButton = ({ onClick }) => (
    <button
        onClick={onClick}
        className="text-xs text-white/20 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
    >
        ✕
    </button>
);

const Card = ({ children, className = "" }) => (
    <div className={`bg-white/[0.03] border border-white/8 rounded-xl p-4 ${className}`}>
        {children}
    </div>
);

/* ── Section Panels ── */

function PersonalSection({ data, onChange }) {
    const set = (key) => (val) => onChange({ ...data, [key]: val });

    return (
        <div className="space-y-4">
            <SectionHeader icon="👤" label="Personal Information" />
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <Label>Full Name</Label>
                    <Input value={data.fullName} onChange={set("fullName")} placeholder="Enter Full Name" />
                </div>
                <div className="col-span-2">
                    <Label>Professional Title</Label>
                    <Input value={data.title} onChange={set("title")} placeholder="Enter Professional Title" />
                </div>
                <div>
                    <Label>Email</Label>
                    <Input value={data.email} onChange={set("email")} placeholder="you@email.com" type="email" />
                </div>
                <div>
                    <Label>Phone</Label>
                    <Input value={data.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                    <Label>Location</Label>
                    <Input value={data.location} onChange={set("location")} placeholder="City, State" />
                </div>
                <div>
                    <Label>Country</Label>
                    <Input value={data.country} onChange={set("country")} placeholder="Country" />
                </div>
                <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={data.address} onChange={set("address")} placeholder="Street address" />
                </div>
                <div>
                    <Label>City</Label>
                    <Input value={data.city} onChange={set("city")} placeholder="City" />
                </div>
                <div>
                    <Label>State</Label>
                    <Input value={data.state} onChange={set("state")} placeholder="State" />
                </div>
                <div>
                    <Label>Website</Label>
                    <Input value={data.website} onChange={set("website")} placeholder="yoursite.com" />
                </div>
                <div>
                    <Label>GitHub</Label>
                    <Input value={data.github} onChange={set("github")} placeholder="github.com/yourname" />
                </div>
                <div className="col-span-2">
                    <Label>Portfolio</Label>
                    <Input value={data.portfolio} onChange={set("portfolio")} placeholder="portfolio link" />
                </div>
                <div className="col-span-2">
                    <Label>LinkedIn</Label>
                    <Input value={data.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/yourname" />
                </div>
                <div className="col-span-2">
                    <Label>Professional Summary</Label>
                    <Textarea
                        value={data.summary}
                        onChange={set("summary")}
                        placeholder="2–3 sentences highlighting your experience and impact..."
                        rows={4}
                    />
                </div>
                <div className="col-span-2">
                    <Label>Career Objective</Label>
                    <Textarea
                        value={data.careerObjective}
                        onChange={set("careerObjective")}
                        placeholder="Target role, goals, and career direction..."
                        rows={3}
                    />
                </div>
            </div>
        </div>
    );
}

function ExperienceSection({ data, onChange }) {
    const addJob = () => {
        onChange([
            ...data,
            {
                id: `exp-${Date.now()}`,
                company: "",
                title: "",
                location: "",
                startDate: "",
                endDate: "",
                current: false,
                bullets: [""],
            },
        ]);
    };

    const updateJob = (id, updates) => {
        onChange(data.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    };

    const removeJob = (id) => onChange(data.filter((j) => j.id !== id));

    const addBullet = (id) => {
        const job = data.find((j) => j.id === id);
        updateJob(id, { bullets: [...job.bullets, ""] });
    };

    const updateBullet = (id, idx, val) => {
        const job = data.find((j) => j.id === id);
        const bullets = [...job.bullets];
        bullets[idx] = val;
        updateJob(id, { bullets });
    };

    const removeBullet = (id, idx) => {
        const job = data.find((j) => j.id === id);
        updateJob(id, { bullets: job.bullets.filter((_, i) => i !== idx) });
    };

    return (
        <div>
            <SectionHeader icon="💼" label="Work Experience" count={data.length} />
            <div className="space-y-3">
                {data.map((job, jobIdx) => (
                    <Card key={job.id}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-purple-400/70 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5">
                                Position {jobIdx + 1}
                            </span>
                            <RemoveButton onClick={() => removeJob(job.id)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Company</Label>
                                <Input
                                    value={job.company}
                                    onChange={(v) => updateJob(job.id, { company: v })}
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div>
                                <Label>Job Title</Label>
                                <Input
                                    value={job.title}
                                    onChange={(v) => updateJob(job.id, { title: v })}
                                    placeholder="Software Engineer"
                                />
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input
                                    value={job.location}
                                    onChange={(v) => updateJob(job.id, { location: v })}
                                    placeholder="City, State"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Label>Start Date</Label>
                                    <Input
                                        value={job.startDate}
                                        onChange={(v) => updateJob(job.id, { startDate: v })}
                                        placeholder="Jan 2022"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label>End Date</Label>
                                    <Input
                                        value={job.current ? "Present" : job.endDate}
                                        onChange={(v) => updateJob(job.id, { endDate: v })}
                                        placeholder="Dec 2024"
                                        disabled={job.current}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                                <button
                                    onClick={() => updateJob(job.id, { current: !job.current })}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${job.current
                                        ? "bg-purple-500 border-purple-500"
                                        : "border-white/20 bg-transparent"
                                        }`}
                                >
                                    {job.current && <span className="text-white text-xs">✓</span>}
                                </button>
                                <span className="text-xs text-white/50">Currently working here</span>
                            </div>
                        </div>

                        {/* Bullet Points */}
                        <div className="mt-3">
                            <Label>Accomplishments</Label>
                            <div className="space-y-2">
                                {job.bullets.map((bullet, bIdx) => (
                                    <div key={bIdx} className="flex gap-2 items-start">
                                        <span className="text-purple-400/60 mt-2.5 text-xs">•</span>
                                        <div className="flex-1">
                                            <Textarea
                                                value={bullet}
                                                onChange={(v) => updateBullet(job.id, bIdx, v)}
                                                placeholder="Led initiative that reduced latency by 40%..."
                                                rows={2}
                                            />
                                        </div>
                                        {job.bullets.length > 1 && (
                                            <button
                                                onClick={() => removeBullet(job.id, bIdx)}
                                                className="text-white/20 hover:text-red-400 transition-colors mt-1.5 text-xs"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => addBullet(job.id)}
                                className="mt-2 text-xs text-purple-400/60 hover:text-purple-300 transition-colors flex items-center gap-1"
                            >
                                <span>+</span> Add bullet
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            <AddButton onClick={addJob} label="Add Position" />
        </div>
    );
}

function EducationSection({ data, onChange }) {
    const addEdu = () => {
        onChange([
            ...data,
            {
                id: `edu-${Date.now()}`,
                institution: "",
                degree: "",
                location: "",
                startDate: "",
                endDate: "",
                gpa: "",
                honors: "",
            },
        ]);
    };

    const updateEdu = (id, updates) => {
        onChange(data.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    };

    const removeEdu = (id) => onChange(data.filter((e) => e.id !== id));

    return (
        <div>
            <SectionHeader icon="🎓" label="Education" count={data.length} />
            <div className="space-y-3">
                {data.map((edu, idx) => (
                    <Card key={edu.id}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-blue-400/70 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">
                                School {idx + 1}
                            </span>
                            <RemoveButton onClick={() => removeEdu(edu.id)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Institution</Label>
                                <Input
                                    value={edu.institution}
                                    onChange={(v) => updateEdu(edu.id, { institution: v })}
                                    placeholder="College / University Name"
                                />
                            </div>
                            <div>
                                <Label>Degree</Label>
                                <Input
                                    value={edu.degree}
                                    onChange={(v) => updateEdu(edu.id, { degree: v })}
                                    placeholder="Degree"
                                />
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input
                                    value={edu.location}
                                    onChange={(v) => updateEdu(edu.id, { location: v })}
                                    placeholder="City, State"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label>Start</Label>
                                    <Input
                                        value={edu.startDate}
                                        onChange={(v) => updateEdu(edu.id, { startDate: v })}
                                        placeholder="2018"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label>End</Label>
                                    <Input
                                        value={edu.endDate}
                                        onChange={(v) => updateEdu(edu.id, { endDate: v })}
                                        placeholder="2022"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>GPA (optional)</Label>
                                <Input
                                    value={edu.gpa}
                                    onChange={(v) => updateEdu(edu.id, { gpa: v })}
                                    placeholder="3.8"
                                />
                            </div>
                            <div>
                                <Label>Honors (optional)</Label>
                                <Input
                                    value={edu.honors}
                                    onChange={(v) => updateEdu(edu.id, { honors: v })}
                                    placeholder="Dean's List"
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <AddButton onClick={addEdu} label="Add Education" />
        </div>
    );
}

function SkillsSection({ data, onChange }) {
    const set = (key) => (val) => onChange({ ...data, [key]: val });

    return (
        <div>
            <SectionHeader icon="⚡" label="Skills" />
            <div className="space-y-3">
                <div>
                    <Label>Technical Skills</Label>
                    <Textarea
                        value={data.technical}
                        onChange={set("technical")}
                        placeholder="React, TypeScript, Node.js, Python, AWS..."
                        rows={2}
                    />
                    <p className="text-xs text-white/25 mt-1">Separate with commas</p>
                </div>
                <div>
                    <Label>Soft Skills</Label>
                    <Textarea
                        value={data.soft}
                        onChange={set("soft")}
                        placeholder="Leadership, Cross-functional collaboration..."
                        rows={2}
                    />
                </div>
                <div>
                    <Label>Languages</Label>
                    <Input
                        value={data.languages}
                        onChange={set("languages")}
                        placeholder="English (Native), Spanish (Fluent)"
                    />
                </div>
                <div>
                    <Label>Programming Languages</Label>
                    <Textarea
                        value={data.programmingLanguages}
                        onChange={set("programmingLanguages")}
                        placeholder="Python, JavaScript, Java..."
                        rows={2}
                    />
                </div>
                <div>
                    <Label>Tools</Label>
                    <Textarea
                        value={data.tools}
                        onChange={set("tools")}
                        placeholder="Git, Docker, Jira, Postman..."
                        rows={2}
                    />
                </div>
                <div>
                    <Label>Frameworks</Label>
                    <Textarea
                        value={data.frameworks}
                        onChange={set("frameworks")}
                        placeholder="React, FastAPI, Django..."
                        rows={2}
                    />
                </div>
                <div>
                    <Label>Databases</Label>
                    <Textarea
                        value={data.databases}
                        onChange={set("databases")}
                        placeholder="MongoDB, PostgreSQL, MySQL..."
                        rows={2}
                    />
                </div>
            </div>
        </div>
    );
}

function ProjectsSection({ data, onChange }) {
    const addProject = () => {
        onChange([
            ...data,
            {
                id: `proj-${Date.now()}`,
                name: "",
                url: "",
                description: "",
            },
        ]);
    };

    const updateProject = (id, updates) => {
        onChange(data.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    };

    const removeProject = (id) => onChange(data.filter((p) => p.id !== id));

    return (
        <div>
            <SectionHeader icon="🚀" label="Projects" count={data.length} />
            <div className="space-y-3">
                {data.map((proj, idx) => (
                    <Card key={proj.id}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                                Project {idx + 1}
                            </span>
                            <RemoveButton onClick={() => removeProject(proj.id)} />
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Project Name</Label>
                                    <Input
                                        value={proj.name}
                                        onChange={(v) => updateProject(proj.id, { name: v })}
                                        placeholder="Project Name"
                                    />
                                </div>
                                <div>
                                    <Label>URL (optional)</Label>
                                    <Input
                                        value={proj.url}
                                        onChange={(v) => updateProject(proj.id, { url: v })}
                                        placeholder="github.com/you/repo"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={proj.description}
                                    onChange={(v) => updateProject(proj.id, { description: v })}
                                    placeholder="Brief description of the project and its impact..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <AddButton onClick={addProject} label="Add Project" />
        </div>
    );
}

function InternshipsSection({ data, onChange }) {
    const addInternship = () => {
        onChange([
            ...data,
            {
                id: `intern-${Date.now()}`,
                company: "",
                title: "",
                location: "",
                startDate: "",
                endDate: "",
                current: false,
                bullets: [""],
            },
        ]);
    };

    const updateInternship = (id, updates) => {
        onChange(data.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    };

    const removeInternship = (id) => onChange(data.filter((i) => i.id !== id));

    const addBullet = (id) => {
        const internship = data.find((i) => i.id === id);
        updateInternship(id, { bullets: [...internship.bullets, ""] });
    };

    const updateBullet = (id, idx, val) => {
        const internship = data.find((i) => i.id === id);
        const bullets = [...internship.bullets];
        bullets[idx] = val;
        updateInternship(id, { bullets });
    };

    const removeBullet = (id, idx) => {
        const internship = data.find((i) => i.id === id);
        updateInternship(id, { bullets: internship.bullets.filter((_, i) => i !== idx) });
    };

    return (
        <div>
            <SectionHeader icon="🧑‍💻" label="Internship" count={data.length} />
            <div className="space-y-3">
                {data.map((internship, internshipIdx) => (
                    <Card key={internship.id}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-purple-400/70 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5">
                                Internship {internshipIdx + 1}
                            </span>
                            <RemoveButton onClick={() => removeInternship(internship.id)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Company</Label>
                                <Input
                                    value={internship.company}
                                    onChange={(v) => updateInternship(internship.id, { company: v })}
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div>
                                <Label>Role</Label>
                                <Input
                                    value={internship.title}
                                    onChange={(v) => updateInternship(internship.id, { title: v })}
                                    placeholder="Software Engineering Intern"
                                />
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input
                                    value={internship.location}
                                    onChange={(v) => updateInternship(internship.id, { location: v })}
                                    placeholder="City, State"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Label>Start Date</Label>
                                    <Input
                                        value={internship.startDate}
                                        onChange={(v) => updateInternship(internship.id, { startDate: v })}
                                        placeholder="Jun 2023"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label>End Date</Label>
                                    <Input
                                        value={internship.current ? "Present" : internship.endDate}
                                        onChange={(v) => updateInternship(internship.id, { endDate: v })}
                                        placeholder="Aug 2023"
                                        disabled={internship.current}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                                <button
                                    onClick={() => updateInternship(internship.id, { current: !internship.current })}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${internship.current
                                        ? "bg-purple-500 border-purple-500"
                                        : "border-white/20 bg-transparent"
                                        }`}
                                >
                                    {internship.current && <span className="text-white text-xs">✓</span>}
                                </button>
                                <span className="text-xs text-white/50">Currently interning here</span>
                            </div>
                        </div>

                        {/* Bullet Points */}
                        <div className="mt-3">
                            <Label>Accomplishments</Label>
                            <div className="space-y-2">
                                {internship.bullets.map((bullet, bIdx) => (
                                    <div key={bIdx} className="flex gap-2 items-start">
                                        <span className="text-purple-400/60 mt-2.5 text-xs">•</span>
                                        <div className="flex-1">
                                            <Textarea
                                                value={bullet}
                                                onChange={(v) => updateBullet(internship.id, bIdx, v)}
                                                placeholder="Built feature that improved onboarding completion..."
                                                rows={2}
                                            />
                                        </div>
                                        {internship.bullets.length > 1 && (
                                            <button
                                                onClick={() => removeBullet(internship.id, bIdx)}
                                                className="text-white/20 hover:text-red-400 transition-colors mt-1.5 text-xs"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => addBullet(internship.id)}
                                className="mt-2 text-xs text-purple-400/60 hover:text-purple-300 transition-colors flex items-center gap-1"
                            >
                                <span>+</span> Add bullet
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            <AddButton onClick={addInternship} label="Add Internship" />
        </div>
    );
}

function CertificationsSection({ data, onChange }) {
    const addCert = () => {
        onChange([
            ...data,
            {
                id: `cert-${Date.now()}`,
                name: "",
                issuer: "",
                date: "",
            },
        ]);
    };

    const updateCert = (id, updates) => {
        onChange(data.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    };

    const removeCert = (id) => onChange(data.filter((c) => c.id !== id));

    return (
        <div>
            <SectionHeader icon="🏅" label="Certifications" count={data.length} />
            <div className="space-y-3">
                {data.map((cert, idx) => (
                    <Card key={cert.id}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                                Cert {idx + 1}
                            </span>
                            <RemoveButton onClick={() => removeCert(cert.id)} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <Label>Certification Name</Label>
                                <Input
                                    value={cert.name}
                                    onChange={(v) => updateCert(cert.id, { name: v })}
                                    placeholder="Certification Name"
                                />
                            </div>
                            <div>
                                <Label>Year</Label>
                                <Input
                                    value={cert.date}
                                    onChange={(v) => updateCert(cert.id, { date: v })}
                                    placeholder="2024"
                                />
                            </div>
                            <div className="col-span-3">
                                <Label>Issuing Organization</Label>
                                <Input
                                    value={cert.issuer}
                                    onChange={(v) => updateCert(cert.id, { issuer: v })}
                                    placeholder="Issuing Organization"
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <AddButton onClick={addCert} label="Add Certification" />
        </div>
    );
}

function TrainingSection({ data, onChange }) {
    const addTraining = () => {
        onChange([
            ...data,
            {
                id: `training-${Date.now()}`,
                title: "",
                organization: "",
                location: "",
                startDate: "",
                endDate: "",
                certificate: "",
                description: "",
            },
        ]);
    };

    const updateTraining = (id, updates) => {
        onChange(data.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    };

    const removeTraining = (id) => onChange(data.filter((t) => t.id !== id));

    return (
        <div>
            <SectionHeader icon="📚" label="Training" count={data.length} />
            <div className="space-y-3">
                {data.map((training, idx) => (
                    <Card key={training.id}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                                Training {idx + 1}
                            </span>
                            <RemoveButton onClick={() => removeTraining(training.id)} />
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Training Title</Label>
                                    <Input
                                        value={training.title}
                                        onChange={(v) => updateTraining(training.id, { title: v })}
                                        placeholder="Training Title"
                                    />
                                </div>
                                <div>
                                    <Label>Organization</Label>
                                    <Input
                                        value={training.organization}
                                        onChange={(v) => updateTraining(training.id, { organization: v })}
                                        placeholder="Training Provider"
                                    />
                                </div>
                                <div>
                                    <Label>Location</Label>
                                    <Input
                                        value={training.location}
                                        onChange={(v) => updateTraining(training.id, { location: v })}
                                        placeholder="Online"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Label>Start Date</Label>
                                        <Input
                                            value={training.startDate}
                                            onChange={(v) => updateTraining(training.id, { startDate: v })}
                                            placeholder="Jan 2024"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label>End Date</Label>
                                        <Input
                                            value={training.endDate}
                                            onChange={(v) => updateTraining(training.id, { endDate: v })}
                                            placeholder="Mar 2024"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label>Certificate Link</Label>
                                <Input
                                    value={training.certificate}
                                    onChange={(v) => updateTraining(training.id, { certificate: v })}
                                    placeholder="coursera.org/verify/..."
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={training.description}
                                    onChange={(v) => updateTraining(training.id, { description: v })}
                                    placeholder="Briefly describe the topics covered and skills gained..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <AddButton onClick={addTraining} label="Add Training" />
        </div>
    );
}

function AchievementsSection({ data, onChange }) {
    const addAchievement = () => {
        onChange([
            ...data,
            {
                id: `achievement-${Date.now()}`,
                title: "",
                issuer: "",
                date: "",
                description: "",
            },
        ]);
    };

    const updateAchievement = (id, updates) => {
        onChange(data.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    };

    const removeAchievement = (id) => onChange(data.filter((a) => a.id !== id));

    return (
        <div>
            <SectionHeader icon="🏆" label="Achievement" count={data.length} />
            <div className="space-y-3">
                {data.map((achievement, idx) => (
                    <Card key={achievement.id}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                                Achievement {idx + 1}
                            </span>
                            <RemoveButton onClick={() => removeAchievement(achievement.id)} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <Label>Title</Label>
                                <Input
                                    value={achievement.title}
                                    onChange={(v) => updateAchievement(achievement.id, { title: v })}
                                    placeholder="Achievement Title"
                                />
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input
                                    value={achievement.date}
                                    onChange={(v) => updateAchievement(achievement.id, { date: v })}
                                    placeholder="2024"
                                />
                            </div>
                            <div className="col-span-3">
                                <Label>Issuer</Label>
                                <Input
                                    value={achievement.issuer}
                                    onChange={(v) => updateAchievement(achievement.id, { issuer: v })}
                                    placeholder="Organization"
                                />
                            </div>
                            <div className="col-span-3">
                                <Label>Description</Label>
                                <Textarea
                                    value={achievement.description}
                                    onChange={(v) => updateAchievement(achievement.id, { description: v })}
                                    placeholder="Briefly describe the achievement and why it matters..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <AddButton onClick={addAchievement} label="Add Achievement" />
        </div>
    );
}

/* ── Nav Tabs ── */
function SimpleEntriesSection({ data = [], onChange, icon, label, addLabel, prefix }) {
    const addEntry = () => {
        onChange([
            ...data,
            { id: `${prefix}-${Date.now()}`, title: "", organization: "", date: "", description: "" },
        ]);
    };

    const updateEntry = (id, updates) => {
        onChange(data.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    };

    const removeEntry = (id) => onChange(data.filter((item) => item.id !== id));

    return (
        <div>
            <SectionHeader icon={icon} label={label} count={data.length} />
            <div className="space-y-3">
                {data.map((item, idx) => (
                    <Card key={item.id}>
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-xs font-medium text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                                {label} {idx + 1}
                            </span>
                            <RemoveButton onClick={() => removeEntry(item.id)} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <Label>Title</Label>
                                <Input value={item.title} onChange={(v) => updateEntry(item.id, { title: v })} placeholder="Title" />
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input value={item.date} onChange={(v) => updateEntry(item.id, { date: v })} placeholder="2024" />
                            </div>
                            <div className="col-span-3">
                                <Label>Organization</Label>
                                <Input value={item.organization} onChange={(v) => updateEntry(item.id, { organization: v })} placeholder="Organization / venue" />
                            </div>
                            <div className="col-span-3">
                                <Label>Description</Label>
                                <Textarea value={item.description} onChange={(v) => updateEntry(item.id, { description: v })} placeholder="Brief details..." rows={2} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            <AddButton onClick={addEntry} label={addLabel} />
        </div>
    );
}

function InterestsSection({ data, onChange }) {
    return (
        <div>
            <SectionHeader icon="*" label="Interests" />
            <Textarea
                value={data}
                onChange={onChange}
                placeholder="Open source, chess, technical writing..."
                rows={4}
            />
        </div>
    );
}

const NAV = [
    { id: "personal", label: "Personal", icon: "👤" },
    { id: "experience", label: "Experience", icon: "💼" },
    { id: "education", label: "Education", icon: "🎓" },
    { id: "skills", label: "Skills", icon: "⚡" },
    { id: "projects", label: "Projects", icon: "🚀" },
    { id: "internships", label: "Internship", icon: "🧑‍💻" },
    { id: "certifications", label: "Certs", icon: "🏅" },
    { id: "trainings", label: "Training", icon: "📚" },
    { id: "achievements", label: "Achievement", icon: "🏆" },
    { id: "volunteerExperience", label: "Volunteer", icon: "+" },
    { id: "extraCurricular", label: "Activities", icon: "*" },
    { id: "publications", label: "Publications", icon: "#" },
    { id: "interests", label: "Interests", icon: "*" },
];

/* ── Main Export ── */
export default function ResumeForm({ resumeData, updateSection, activeSection, setActiveSection }) {
    return (
        <div className="resume-form-panel flex flex-col h-full">
            {/* Section Nav */}
            <nav className="sticky top-0 z-10 bg-[#0d0d14]/95 backdrop-blur border-b border-white/8 px-4 pt-4 pb-0">
                <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0">
                    {NAV.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 ${activeSection === tab.id
                                ? "text-white border-purple-500 bg-white/5"
                                : "text-white/40 border-transparent hover:text-white/60 hover:bg-white/3"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Section Body */}
            <div className="flex-1 p-5 overflow-y-auto">
                {activeSection === "personal" && (
                    <PersonalSection
                        data={resumeData.personal}
                        onChange={(d) => updateSection("personal", d)}
                    />
                )}
                {activeSection === "experience" && (
                    <ExperienceSection
                        data={resumeData.experience}
                        onChange={(d) => updateSection("experience", d)}
                    />
                )}
                {activeSection === "education" && (
                    <EducationSection
                        data={resumeData.education}
                        onChange={(d) => updateSection("education", d)}
                    />
                )}
                {activeSection === "skills" && (
                    <SkillsSection
                        data={resumeData.skills}
                        onChange={(d) => updateSection("skills", d)}
                    />
                )}
                {activeSection === "projects" && (
                    <ProjectsSection
                        data={resumeData.projects}
                        onChange={(d) => updateSection("projects", d)}
                    />
                )}
                {activeSection === "internships" && (
                    <InternshipsSection
                        data={resumeData.internships ?? []}
                        onChange={(d) => updateSection("internships", d)}
                    />
                )}
                {activeSection === "certifications" && (
                    <CertificationsSection
                        data={resumeData.certifications}
                        onChange={(d) => updateSection("certifications", d)}
                    />
                )}
                {activeSection === "trainings" && (
                    <TrainingSection
                        data={resumeData.trainings ?? []}
                        onChange={(d) => updateSection("trainings", d)}
                    />
                )}
                {activeSection === "achievements" && (
                    <AchievementsSection
                        data={resumeData.achievements ?? []}
                        onChange={(d) => updateSection("achievements", d)}
                    />
                )}
                {activeSection === "volunteerExperience" && (
                    <SimpleEntriesSection
                        data={resumeData.volunteerExperience ?? []}
                        onChange={(d) => updateSection("volunteerExperience", d)}
                        icon="+"
                        label="Volunteer Experience"
                        addLabel="Add Volunteer Experience"
                        prefix="volunteer"
                    />
                )}
                {activeSection === "extraCurricular" && (
                    <SimpleEntriesSection
                        data={resumeData.extraCurricular ?? []}
                        onChange={(d) => updateSection("extraCurricular", d)}
                        icon="*"
                        label="Extra Curricular"
                        addLabel="Add Activity"
                        prefix="activity"
                    />
                )}
                {activeSection === "publications" && (
                    <SimpleEntriesSection
                        data={resumeData.publications ?? []}
                        onChange={(d) => updateSection("publications", d)}
                        icon="#"
                        label="Publications"
                        addLabel="Add Publication"
                        prefix="publication"
                    />
                )}
                {activeSection === "interests" && (
                    <InterestsSection
                        data={resumeData.interests ?? ""}
                        onChange={(d) => updateSection("interests", d)}
                    />
                )}
            </div>
            <style>{`
                @media (max-width: 768px) {
                    .resume-form-panel .grid {
                        grid-template-columns: minmax(0, 1fr) !important;
                    }
                    .resume-form-panel [class*="col-span-"] {
                        grid-column: 1 / -1 !important;
                    }
                }
            `}</style>
        </div>
    );
}
