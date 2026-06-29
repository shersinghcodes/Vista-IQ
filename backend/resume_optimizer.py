"""
Resume Optimizer — Company-specific AI rewriting engine using Gemini.
Generates genuinely tailored resume content, not generic keyword stuffing.
"""

import json
from backend.gemini_service import HAS_GEMINI, generate_json_response

# ─── Company DNA Profiles ─────────────────────────────────────────────────────

COMPANY_DNA = {
    "Google": {
        "accent": "#4285F4",
        "tone": "engineering excellence, algorithmic depth, and massive scale",
        "values": [
            "Focus on algorithmic complexity and system design principles",
            "Emphasize scalability (billions of users / petabytes of data)",
            "Highlight measurable engineering impact with precise metrics",
            "Showcase open-source contributions, publications, or patents",
            "Use terms: distributed systems, low-latency, fault-tolerant, O(n) complexity",
        ],
        "keywords": [
            "distributed systems", "scalability", "algorithms", "data structures",
            "system design", "microservices", "Kubernetes", "Go", "C++", "Python",
            "machine learning", "infrastructure", "reliability", "SLO", "SLA",
            "MapReduce", "BigQuery", "Spanner", "TensorFlow", "open source",
        ],
        "ats_boost": ["algorithms", "scalability", "distributed", "system design", "engineering depth"],
        "avoid": ["generic teamwork statements", "vague impact descriptions", "buzzword-only bullets"],
    },
    "Amazon": {
        "accent": "#FF9900",
        "tone": "customer obsession, ownership, and data-driven impact",
        "values": [
            "Frame every achievement around customer impact or business outcome",
            "Use Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action, Frugality)",
            "Quantify EVERYTHING — revenue impact, latency improvements, cost savings",
            "Emphasize ownership: 'I owned', 'I led', 'I drove' rather than 'I contributed to'",
            "Use STAR format implicitly in bullet points (Situation context → Action → Result)",
        ],
        "keywords": [
            "AWS", "customer obsession", "ownership", "bias for action", "frugality",
            "dive deep", "deliver results", "S3", "Lambda", "EC2", "DynamoDB",
            "microservices", "CI/CD", "cost optimization", "operational excellence",
            "high availability", "fault tolerance", "two-pizza team", "working backwards",
        ],
        "ats_boost": ["AWS", "customer impact", "ownership", "operational excellence", "metrics-driven"],
        "avoid": ["passive voice", "team accomplishments without your specific contribution", "vague timelines"],
    },
    "Microsoft": {
        "accent": "#00A4EF",
        "tone": "growth mindset, collaboration, and enterprise-scale impact",
        "values": [
            "Emphasize growth mindset and continuous learning",
            "Highlight cross-team collaboration and influence without authority",
            "Focus on enterprise-scale products and Azure cloud integration",
            "Show impact on developer productivity, tooling, or platform reliability",
            "Use terms: inclusive design, accessibility, developer experience, enterprise",
        ],
        "keywords": [
            "Azure", "C#", ".NET", "TypeScript", "React", "developer experience",
            "growth mindset", "collaboration", "enterprise", "accessibility",
            "Power Platform", "DevOps", "GitHub", "VS Code", "Teams", "inclusive",
            "cloud-native", "hybrid cloud", "security", "compliance", "governance",
        ],
        "ats_boost": ["Azure", "growth mindset", "enterprise", "collaboration", "developer tools"],
        "avoid": ["isolated individual contributions with no team context", "non-cloud architectures without reason"],
    },
    "Netflix": {
        "accent": "#E50914",
        "tone": "freedom and responsibility, backend scalability, and engineering autonomy",
        "values": [
            "Emphasize high autonomy and independent decision-making",
            "Focus on backend scalability, streaming infrastructure, distributed systems",
            "Highlight performance optimization (sub-100ms latency, 99.99% uptime)",
            "Show judgment over process: 'I chose X over Y because of Z trade-off'",
            "Use terms: chaos engineering, resilience, eventual consistency, high throughput",
        ],
        "keywords": [
            "distributed systems", "high throughput", "low latency", "chaos engineering",
            "microservices", "Java", "Python", "Kafka", "Cassandra", "Elasticsearch",
            "A/B testing", "experimentation", "resilience", "observability", "Prometheus",
            "Grafana", "container orchestration", "API gateway", "CDN optimization",
        ],
        "ats_boost": ["distributed systems", "resilience", "high throughput", "low latency", "observability"],
        "avoid": ["process-heavy language", "committee-driven decisions", "rigid hierarchies"],
    },
    "Meta": {
        "accent": "#1877F2",
        "tone": "move fast, product-centric thinking, and billions-scale infrastructure",
        "values": [
            "Show speed of shipping: 'Built and deployed in 2 weeks', 'shipped to 100M users'",
            "Emphasize product thinking alongside engineering — feature impact on engagement",
            "Highlight data-driven decision making: A/B tests, funnels, conversion metrics",
            "Focus on infrastructure at billions-scale: ads, feeds, real-time systems",
            "Use terms: News Feed, Ads Platform, React, PyTorch, Hack, Thrift, GraphQL",
        ],
        "keywords": [
            "React", "GraphQL", "PyTorch", "Hack", "Thrift", "data pipeline",
            "A/B testing", "product metrics", "engagement", "real-time", "feed ranking",
            "ads optimization", "infrastructure", "billions of users", "Messenger",
            "WhatsApp", "Instagram", "move fast", "product impact", "ML infrastructure",
        ],
        "ats_boost": ["React", "GraphQL", "product impact", "A/B testing", "data-driven"],
        "avoid": ["slow waterfall processes", "lack of product context in technical work"],
    },
    "Apple": {
        "accent": "#555555",
        "tone": "craft, polish, user experience, and hardware-software integration",
        "values": [
            "Emphasize obsessive attention to detail and product polish",
            "Show intersection of engineering and design thinking",
            "Highlight performance optimization on constrained hardware (iOS, macOS)",
            "Demonstrate privacy-first engineering practices",
            "Use terms: Xcode, Swift, Core Data, UIKit, SwiftUI, Instruments, performance profiling",
        ],
        "keywords": [
            "Swift", "Objective-C", "SwiftUI", "UIKit", "Xcode", "Core Data",
            "Metal", "ARKit", "Core ML", "privacy", "performance", "accessibility",
            "human interface guidelines", "App Store", "iOS", "macOS", "watchOS",
            "user experience", "design system", "instruments", "memory optimization",
        ],
        "ats_boost": ["Swift", "SwiftUI", "performance", "privacy", "user experience", "iOS"],
        "avoid": ["generic web-only experience without mobile context", "privacy-unfriendly data practices"],
    },
    "TCS": {
        "accent": "#5C0057",
        "tone": "client delivery, communication excellence, and broad technology competence",
        "values": [
            "Highlight client-facing communication and stakeholder management",
            "Show adaptability across multiple technologies and domains",
            "Emphasize process adherence: Agile, SDLC, ITIL, Six Sigma",
            "Focus on delivery reliability, SLA adherence, and on-time project completion",
            "Use terms: client delivery, onsite-offshore model, BFSI, SAP, Oracle, ERP",
        ],
        "keywords": [
            "Agile", "Scrum", "SDLC", "client delivery", "stakeholder management",
            "Java", "Python", "SQL", "SAP", "Oracle", "ERP", "BFSI", "healthcare",
            "retail", "SLA", "on-time delivery", "documentation", "testing", "QA",
            "communication", "cross-functional", "offshore", "digital transformation",
        ],
        "ats_boost": ["client delivery", "Agile", "SDLC", "stakeholder management", "on-time"],
        "avoid": ["overly niche startup jargon", "only emphasizing research over delivery"],
    },
    "Infosys": {
        "accent": "#007CC3",
        "tone": "adaptability, breadth of technology, and collaborative problem-solving",
        "values": [
            "Show breadth across multiple tech domains and industries",
            "Emphasize collaborative problem-solving and teamwork",
            "Highlight continuous learning and certifications",
            "Focus on client value delivery and business impact",
            "Use terms: digital transformation, cloud migration, automation, DevSecOps",
        ],
        "keywords": [
            "digital transformation", "cloud migration", "automation", "DevSecOps",
            "Java", "Python", "Salesforce", "ServiceNow", "AWS", "Azure", "GCP",
            "Agile", "DevOps", "CI/CD", "microservices", "API integration",
            "data analytics", "Power BI", "Tableau", "problem solving", "teamwork",
        ],
        "ats_boost": ["digital transformation", "cloud migration", "automation", "Agile", "DevOps"],
        "avoid": ["purely academic language without industry application"],
    },
}

ROLE_FOCUS = {
    "Frontend Developer":   "UI/UX implementation, component architecture, performance optimization, accessibility, responsive design",
    "Backend Developer":    "API design, database optimization, server-side logic, security, scalability, microservices",
    "Full Stack Developer":  "end-to-end feature ownership, frontend + backend integration, database design, deployment pipelines",
    "AI Engineer":          "model development, ML pipelines, training infrastructure, model optimization, deployment, MLOps",
    "Data Engineer":        "data pipelines, ETL, data warehousing, streaming systems, data quality, orchestration",
    "SDE":                  "software design, algorithms, data structures, system design, clean code, testing, code review",
}


# ─── Main Optimization Function ──────────────────────────────────────────────

async def optimize_resume(
    parsed_data: dict,
    target_company: str,
    target_role: str,
    original_analysis: dict,
) -> dict:
    """
    Generate a company-specific optimized version of the resume using Gemini.
    Falls back to rule-based optimization if Gemini is unavailable.
    """
    if HAS_GEMINI:
        try:
            result = await _gemini_optimize(parsed_data, target_company, target_role, original_analysis)
            result["source"] = "gemini"
            return result
        except Exception as e:
            print(f"[Optimizer] Gemini failed: {e}, using fallback")

    return _fallback_optimize(parsed_data, target_company, target_role, original_analysis)


async def _gemini_optimize(parsed_data, target_company, target_role, original_analysis):
    dna = COMPANY_DNA.get(target_company, COMPANY_DNA["Google"])
    role_focus = ROLE_FOCUS.get(target_role, ROLE_FOCUS["SDE"])
    original_ats = original_analysis.get("ats_score", 50)

    prompt = f"""You are an elite resume coach who has helped 10,000+ engineers land offers at top tech companies.

Optimize this resume specifically for **{target_company}** — **{target_role}** role.

## Company Culture & Values
{target_company} hiring emphasizes: {dna['tone']}

Specific optimization rules for {target_company}:
{chr(10).join(f'- {v}' for v in dna['values'])}

## Role Focus
For **{target_role}**, emphasize: {role_focus}

## Current Resume Data
Summary: {parsed_data.get('summary', '(none)')}

Skills: {json.dumps(parsed_data.get('skills', [])[:20])}

Technologies: {json.dumps([t['name'] for t in parsed_data.get('technologies', [])[:20]])}

Experience:
{json.dumps(parsed_data.get('experience', []), indent=2)}

Projects:
{json.dumps(parsed_data.get('projects', []), indent=2)}

Education: {json.dumps(parsed_data.get('education', []))}

Certifications: {json.dumps(parsed_data.get('certifications', []))}

## Current ATS Score: {original_ats}/100

## Your Task
Rewrite the resume content to be genuinely tailored for {target_company}. Do NOT just add keywords — make the language, tone, and framing authentic to how {target_company} thinks.

Important rules:
1. Preserve all FACTS (dates, company names, project names, technologies used)
2. Only REWRITE descriptions, bullet points, summaries — not facts
3. Add {target_company}-relevant keywords naturally into descriptions
4. Each project bullet should start with a strong action verb
5. Quantify impact wherever possible (even estimated metrics)
6. Summary should reference {target_company}'s values without mentioning the company name directly

Respond with this exact JSON structure:
{{
    "optimized_summary": "rewritten 2-3 sentence professional summary tailored for {target_company}/{target_role}",
    "optimized_skills": ["skill1 (reordered/augmented to prioritize {target_company} keywords)", "skill2", ...],
    "optimized_projects": [
        {{
            "name": "original project name",
            "original_description": "original description",
            "optimized_description": "rewritten description with {target_company} lens",
            "added_keywords": ["keyword1", "keyword2"]
        }}
    ],
    "optimized_experience": [
        {{
            "title": "original title",
            "original_bullets": ["bullet1", "bullet2"],
            "optimized_bullets": ["rewritten bullet1", "rewritten bullet2"]
        }}
    ],
    "modifications": [
        {{
            "section": "summary|skills|project|experience",
            "type": "rewritten|added|improved|keyword_injected",
            "original": "original text snippet",
            "optimized": "optimized text snippet",
            "reason": "why this change helps for {target_company}"
        }}
    ],
    "added_keywords": ["list", "of", "ats", "keywords", "injected"],
    "company_tips": [
        "Specific tip 1 for applying to {target_company} as {target_role}",
        "Specific tip 2",
        "Specific tip 3"
    ],
    "estimated_ats_improvement": <number between 5 and 30 — realistic ATS score improvement>,
    "optimization_summary": "2-sentence explanation of the key changes made and why"
}}"""

    system_instruction = (
        f"You are an expert resume optimizer specializing in {target_company} hiring. "
        "Always respond with valid, complete JSON. Never truncate the response."
    )

    result = await generate_json_response(prompt, system_instruction=system_instruction)
    
    # Compute final scores
    ats_boost = result.get("estimated_ats_improvement", 12)
    optimized_ats = min(original_ats + ats_boost, 97)
    
    result["original_ats_score"] = original_ats
    result["optimized_ats_score"] = round(optimized_ats, 1)
    result["ats_improvement"] = round(optimized_ats - original_ats, 1)
    result["company"] = target_company
    result["role"] = target_role
    result["company_accent"] = dna["accent"]
    
    return result


def _fallback_optimize(parsed_data, target_company, target_role, original_analysis):
    """Rule-based optimization when Gemini is unavailable."""
    dna = COMPANY_DNA.get(target_company, COMPANY_DNA["Google"])
    original_ats = original_analysis.get("ats_score", 50)
    role_focus = ROLE_FOCUS.get(target_role, ROLE_FOCUS["SDE"])

    # Build optimized skills — prepend company keywords
    existing_techs = [t["name"] for t in parsed_data.get("technologies", [])]
    existing_skills = parsed_data.get("skills", [])
    company_kws = dna["keywords"]
    
    # Add missing company keywords to front of skills
    missing_kws = [k for k in company_kws[:8] if k.lower() not in " ".join(existing_skills + existing_techs).lower()]
    optimized_skills = missing_kws + existing_skills[:15]

    # Rewrite summary
    original_summary = parsed_data.get("summary", "")
    if original_summary:
        optimized_summary = (
            f"Results-driven {target_role} with strong foundation in {', '.join(existing_techs[:3])}. "
            f"Experienced in {role_focus.split(',')[0].strip()} with focus on {dna['tone'].split(',')[0].strip()}. "
            f"Passionate about delivering high-impact engineering solutions."
        )
    else:
        optimized_summary = (
            f"Motivated {target_role} with hands-on experience in {', '.join(existing_techs[:4])}. "
            f"Skilled in {role_focus.split(',')[0].strip()}, with a focus on {dna['tone'].split(',')[0].strip()}."
        )

    # Simple project optimization (inject keywords)
    optimized_projects = []
    for proj in parsed_data.get("projects", []):
        original_desc = proj.get("description", "")
        # Inject 2-3 company keywords naturally
        inject = [k for k in company_kws[:5] if k.lower() not in original_desc.lower()][:2]
        new_desc = original_desc
        if inject and original_desc:
            new_desc = original_desc.rstrip(".") + f". Leveraged {' and '.join(inject)} principles for optimal performance."
        optimized_projects.append({
            "name": proj.get("name", ""),
            "original_description": original_desc,
            "optimized_description": new_desc,
            "added_keywords": inject,
        })

    # Experience optimization
    action_verbs = ["Architected", "Engineered", "Delivered", "Optimized", "Scaled", "Automated"]
    optimized_experience = []
    for i, exp in enumerate(parsed_data.get("experience", [])):
        bullets = exp.get("details", [])
        new_bullets = []
        for j, bullet in enumerate(bullets):
            verb = action_verbs[(i + j) % len(action_verbs)]
            if not any(bullet.startswith(v) for v in action_verbs):
                new_bullets.append(f"{verb} {bullet[0].lower()}{bullet[1:]}")
            else:
                new_bullets.append(bullet)
        optimized_experience.append({
            "title": exp.get("title", ""),
            "original_bullets": bullets,
            "optimized_bullets": new_bullets,
        })

    modifications = [
        {
            "section": "summary",
            "type": "rewritten",
            "original": original_summary[:100] if original_summary else "(no summary)",
            "optimized": optimized_summary[:100],
            "reason": f"Tailored tone for {target_company}'s emphasis on {dna['tone'].split(',')[0]}"
        },
        {
            "section": "skills",
            "type": "keyword_injected",
            "original": ", ".join(existing_skills[:5]),
            "optimized": ", ".join(optimized_skills[:5]),
            "reason": f"Prioritized {target_company}-relevant keywords for ATS"
        },
    ]

    ats_boost = 10
    optimized_ats = min(original_ats + ats_boost, 97)

    return {
        "optimized_summary": optimized_summary,
        "optimized_skills": optimized_skills,
        "optimized_projects": optimized_projects,
        "optimized_experience": optimized_experience,
        "modifications": modifications,
        "added_keywords": missing_kws,
        "company_tips": [
            f"Tailor your cover letter to reference {target_company}'s core values explicitly.",
            f"Prepare STAR-format answers for behavioral rounds at {target_company}.",
            f"Research recent {target_company} engineering blog posts and reference them in interviews.",
        ],
        "estimated_ats_improvement": ats_boost,
        "original_ats_score": original_ats,
        "optimized_ats_score": round(optimized_ats, 1),
        "ats_improvement": round(optimized_ats - original_ats, 1),
        "optimization_summary": f"Resume reframed with {target_company}'s {dna['tone'].split(',')[0]} lens. Added {len(missing_kws)} company-specific keywords.",
        "company": target_company,
        "role": target_role,
        "company_accent": dna["accent"],
        "source": "fallback",
    }
