/* ResumePreview.jsx
 * Renders a clean, ATS-optimized resume from the resumeData state.
 * White background, black typography — no decorative elements that
 * confuse ATS parsers. Intentional type scale using system serif stack.
 */

const isEmpty = (val) => !val || (typeof val === "string" && val.trim() === "");

/* ── Section Divider ── */
const SectionTitle = ({ children }) => (
    <div className="mb-2">
        <h2
            style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#1a1a2e",
                borderBottom: "1.5px solid #1a1a2e",
                paddingBottom: "3px",
                marginBottom: "8px",
            }}
        >
            {children}
        </h2>
    </div>
);

/* ── Entry Header Row ── */
const EntryHeader = ({ left, right }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: "700", fontSize: "11.5px", color: "#111" }}>{left}</span>
        <span style={{ fontSize: "10.5px", color: "#444", whiteSpace: "nowrap", marginLeft: "8px" }}>
            {right}
        </span>
    </div>
);

const EntrySubHeader = ({ left, right }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "11px", fontStyle: "italic", color: "#333" }}>{left}</span>
        {right && (
            <span style={{ fontSize: "10px", color: "#555", whiteSpace: "nowrap", marginLeft: "8px" }}>
                {right}
            </span>
        )}
    </div>
);

/* ── Section Wrapper ── */
const Section = ({ children }) => (
    <div style={{ marginBottom: "14px" }}>{children}</div>
);

/* ── Bullet List ── */
const BulletList = ({ bullets }) => {
    const filtered = bullets?.filter((b) => b.trim() !== "") ?? [];
    if (!filtered.length) return null;
    return (
        <ul style={{ margin: "4px 0 0 0", paddingLeft: "14px", listStyleType: "disc" }}>
            {filtered.map((b, i) => (
                <li
                    key={i}
                    style={{
                        fontSize: "10.5px",
                        color: "#222",
                        lineHeight: "1.55",
                        marginBottom: "2px",
                    }}
                >
                    {b}
                </li>
            ))}
        </ul>
    );
};


/* ── Skill Pill ── */
const SkillGroup = ({ label, value }) => {
    if (isEmpty(value)) return null;
    return (
        <div style={{ marginBottom: "5px" }}>
            <span
                style={{
                    fontSize: "10.5px",
                    fontWeight: "700",
                    color: "#1a1a2e",
                    marginRight: "6px",
                }}
            >
                {label}:
            </span>
            <span style={{ fontSize: "10.5px", color: "#222" }}>{value}</span>
        </div>
    );
};

/* ── Main Preview Component ── */
const SimpleEntrySection = ({ title, entries }) => {
    const filtered = entries?.filter((item) => !isEmpty(item.title)) ?? [];
    if (!filtered.length) return null;
    return (
        <Section>
            <SectionTitle>{title}</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filtered.map((item) => (
                    <div key={item.id}>
                        <EntryHeader left={item.title} right={item.date} />
                        <EntrySubHeader left={item.organization} />
                        {!isEmpty(item.description) && (
                            <p style={{ fontSize: "10.5px", color: "#222", margin: "3px 0 0 0", lineHeight: "1.55" }}>
                                {item.description}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </Section>
    );
};

export default function ResumePreview({ resumeData }) {
    const {
        personal,
        experience,
        internships,
        education,
        skills,
        projects,
        trainings,
        achievements,
        certifications,
        volunteerExperience,
        extraCurricular,
        interests,
        publications,
    } = resumeData;

    const hasExperience = experience?.some(
        (e) => !isEmpty(e.company) || !isEmpty(e.title)
    );
    const hasInternships = internships?.some(
        (i) => !isEmpty(i.company) || !isEmpty(i.title)
    );
    const hasEducation = education?.some(
        (e) => !isEmpty(e.institution) || !isEmpty(e.degree)
    );
    const hasSkills =
        !isEmpty(skills?.technical) ||
        !isEmpty(skills?.soft) ||
        !isEmpty(skills?.languages) ||
        !isEmpty(skills?.programmingLanguages) ||
        !isEmpty(skills?.tools) ||
        !isEmpty(skills?.frameworks) ||
        !isEmpty(skills?.databases);
    const hasProjects = projects?.some((p) => !isEmpty(p.name));
    const hasTrainings = trainings?.some(
        (t) => !isEmpty(t.title) || !isEmpty(t.organization)
    );
    const hasAchievements = achievements?.some((a) => !isEmpty(a.title));
    const hasCerts = certifications?.some((c) => !isEmpty(c.name));
    const hasVolunteerExperience = volunteerExperience?.some((item) => !isEmpty(item.title));
    const hasActivities = extraCurricular?.some((item) => !isEmpty(item.title));
    const hasPublications = publications?.some((item) => !isEmpty(item.title));
    const hasInterests = !isEmpty(interests);

    const contactLine = [
        personal.email,
        personal.phone,
        personal.location || [personal.city, personal.state, personal.country].filter(Boolean).join(", "),
        personal.linkedin,
        personal.github,
        personal.portfolio,
        personal.website,
    ]
        .filter(Boolean)
        .filter((v) => v.trim() !== "");

    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                fontFamily: "Arial, Helvetica, sans-serif",
                padding: "36px 44px",
                minHeight: "1056px",
                color: "#111",
                lineHeight: "1.4",
            }}
        >
            {/* ── Header ── */}
            <div style={{ marginBottom: "14px", textAlign: "center" }}>
                {!isEmpty(personal.fullName) && (
                    <h1
                        style={{
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#0f0f1a",
                            margin: "0 0 3px 0",
                            letterSpacing: "0.01em",
                        }}
                    >
                        {personal.fullName}
                    </h1>
                )}

                {!isEmpty(personal.title) && (
                    <p
                        style={{
                            fontSize: "12px",
                            color: "#1a1a2e",
                            fontWeight: "600",
                            margin: "0 0 8px 0",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                        }}
                    >
                        {personal.title}
                    </p>
                )}

                {contactLine.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            gap: "4px 12px",
                            borderTop: "1px solid #e5e5e5",
                            borderBottom: "1px solid #e5e5e5",
                            paddingTop: "6px",
                            paddingBottom: "6px",
                        }}
                    >
                        {contactLine.map((item, i) => (
                            <span key={i} style={{ fontSize: "10px", color: "#333" }}>
                                {item}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Summary ── */}
            {!isEmpty(personal.summary) && (
                <Section>
                    <SectionTitle>Professional Summary</SectionTitle>
                    <p style={{ fontSize: "10.5px", color: "#222", lineHeight: "1.6", margin: 0 }}>
                        {personal.summary}
                    </p>
                </Section>
            )}

            {!isEmpty(personal.careerObjective) && (
                <Section>
                    <SectionTitle>Career Objective</SectionTitle>
                    <p style={{ fontSize: "10.5px", color: "#222", lineHeight: "1.6", margin: 0 }}>
                        {personal.careerObjective}
                    </p>
                </Section>
            )}

            {/* ── Experience ── */}
            {hasExperience && (
                <Section>
                    <SectionTitle>Professional Experience</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {experience
                            .filter((e) => !isEmpty(e.company) || !isEmpty(e.title))
                            .map((job) => {
                                const dateRange = [
                                    job.startDate,
                                    job.current ? "Present" : job.endDate,
                                ]
                                    .filter(Boolean)
                                    .join(" – ");

                                return (
                                    <div key={job.id}>
                                        <EntryHeader left={job.company} right={dateRange} />
                                        <EntrySubHeader
                                            left={job.title}
                                            right={job.location}
                                        />
                                        <BulletList bullets={job.bullets} />
                                    </div>
                                );
                            })}
                    </div>
                </Section>
            )}

            {/* ── Internships ── */}
            {hasInternships && (
                <Section>
                    <SectionTitle>Internships</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {internships
                            .filter((i) => !isEmpty(i.company) || !isEmpty(i.title))
                            .map((internship) => {
                                const dateRange = [
                                    internship.startDate,
                                    internship.current ? "Present" : internship.endDate,
                                ]
                                    .filter(Boolean)
                                    .join(" – ");

                                return (
                                    <div key={internship.id}>
                                        <EntryHeader left={internship.company} right={dateRange} />
                                        <EntrySubHeader
                                            left={internship.title}
                                            right={internship.location}
                                        />
                                        <BulletList bullets={internship.bullets} />
                                    </div>
                                );
                            })}
                    </div>
                </Section>
            )}

            {/* ── Projects ── */}
            {hasProjects && (
                <Section>
                    <SectionTitle>Projects</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {projects
                            .filter((p) => !isEmpty(p.name))
                            .map((proj) => (
                                <div key={proj.id}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <span style={{ fontWeight: "700", fontSize: "11px", color: "#111" }}>
                                            {proj.name}
                                        </span>
                                        {!isEmpty(proj.url) && (
                                            <span style={{ fontSize: "10px", color: "#555" }}>{proj.url}</span>
                                        )}
                                    </div>
                                    {!isEmpty(proj.description) && (
                                        <p
                                            style={{
                                                fontSize: "10.5px",
                                                color: "#222",
                                                margin: "3px 0 0 0",
                                                lineHeight: "1.55",
                                            }}
                                        >
                                            {proj.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                    </div>
                </Section>
            )}

            {/* ── Training ── */}
            {hasTrainings && (
                <Section>
                    <SectionTitle>Training</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {trainings
                            .filter((t) => !isEmpty(t.title) || !isEmpty(t.organization))
                            .map((training) => {
                                const duration = [training.startDate, training.endDate]
                                    .filter(Boolean)
                                    .join(" – ");

                                return (
                                    <div key={training.id}>
                                        <EntryHeader left={training.title} right={duration} />
                                        <EntrySubHeader
                                            left={training.organization}
                                            right={training.location}
                                        />
                                        {!isEmpty(training.description) && (
                                            <p
                                                style={{
                                                    fontSize: "10.5px",
                                                    color: "#222",
                                                    margin: "3px 0 0 0",
                                                    lineHeight: "1.55",
                                                }}
                                            >
                                                {training.description}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </Section>
            )}

            {/* ── Education ── */}
            {hasEducation && (
                <Section>
                    <SectionTitle>Education</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {education
                            .filter((e) => !isEmpty(e.institution) || !isEmpty(e.degree))
                            .map((edu) => {
                                const dateRange = [edu.startDate, edu.endDate]
                                    .filter(Boolean)
                                    .join(" – ");
                                const meta = [
                                    edu.gpa ? `GPA: ${edu.gpa}` : null,
                                    edu.honors,
                                ]
                                    .filter(Boolean)
                                    .join("  ·  ");

                                return (
                                    <div key={edu.id}>
                                        <EntryHeader left={edu.institution} right={dateRange} />
                                        <EntrySubHeader left={edu.degree} right={edu.location} />
                                        {!isEmpty(meta) && (
                                            <p
                                                style={{
                                                    fontSize: "10px",
                                                    color: "#555",
                                                    margin: "2px 0 0 0",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {meta}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </Section>
            )}

            {/* ── Achievements ── */}
            {hasAchievements && (
                <Section>
                    <SectionTitle>Achievements</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {achievements
                            .filter((a) => !isEmpty(a.title))
                            .map((achievement) => (
                                <div key={achievement.id}>
                                    <EntryHeader left={achievement.title} right={achievement.date} />
                                    <EntrySubHeader left={achievement.issuer} />
                                    {!isEmpty(achievement.description) && (
                                        <p
                                            style={{
                                                fontSize: "10.5px",
                                                color: "#222",
                                                margin: "3px 0 0 0",
                                                lineHeight: "1.55",
                                            }}
                                        >
                                            {achievement.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                    </div>
                </Section>
            )}

            {/* ── Certifications ── */}
            <SimpleEntrySection title="Volunteer Experience" entries={volunteerExperience} />
            <SimpleEntrySection title="Activities" entries={extraCurricular} />
            <SimpleEntrySection title="Publications" entries={publications} />

            {hasCerts && (
                <Section>
                    <SectionTitle>Certifications</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {certifications
                            .filter((c) => !isEmpty(c.name))
                            .map((cert) => (
                                <div
                                    key={cert.id}
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
                                >
                                    <span style={{ fontSize: "10.5px", color: "#111" }}>
                                        <span style={{ fontWeight: "700" }}>{cert.name}</span>
                                        {!isEmpty(cert.issuer) && (
                                            <span style={{ color: "#555", fontWeight: "400" }}>
                                                {" "}
                                                — {cert.issuer}
                                            </span>
                                        )}
                                    </span>
                                    {!isEmpty(cert.date) && (
                                        <span style={{ fontSize: "10px", color: "#555", whiteSpace: "nowrap", marginLeft: "8px" }}>
                                            {cert.date}
                                        </span>
                                    )}
                                </div>
                            ))}
                    </div>
                </Section>
            )}

            {/* ── Skills ── */}
            {hasSkills && (
                <Section>
                    <SectionTitle>Skills</SectionTitle>
                    <SkillGroup label="Technical" value={skills.technical} />
                    <SkillGroup label="Programming Languages" value={skills.programmingLanguages} />
                    <SkillGroup label="Tools" value={skills.tools} />
                    <SkillGroup label="Frameworks" value={skills.frameworks} />
                    <SkillGroup label="Databases" value={skills.databases} />
                    <SkillGroup label="Soft Skills" value={skills.soft} />
                    <SkillGroup label="Languages" value={skills.languages} />
                </Section>
            )}

            {hasInterests && (
                <Section>
                    <SectionTitle>Interests</SectionTitle>
                    <p style={{ fontSize: "10.5px", color: "#222", lineHeight: "1.6", margin: 0 }}>{interests}</p>
                </Section>
            )}

            {/* Empty state */}
            {!personal.fullName &&
                !hasExperience &&
                !hasInternships &&
                !hasEducation &&
                !hasSkills &&
                !hasProjects &&
                !hasTrainings &&
                !hasAchievements &&
                !hasCerts &&
                !hasVolunteerExperience &&
                !hasActivities &&
                !hasPublications &&
                !hasInterests && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "400px",
                            color: "#bbb",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: "32px", marginBottom: "12px" }}>📄</div>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "#999" }}>
                            Your resume will appear here
                        </p>
                        <p style={{ fontSize: "11px", color: "#bbb", marginTop: "4px" }}>
                            Start filling in the form on the left
                        </p>
                    </div>
                )}
        </div>
    );
}
