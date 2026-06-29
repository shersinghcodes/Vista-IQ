"""Resume AI Engine — PDF parsing, AI analysis, feedback & question generation."""

import os
import re
import json
import random

# PDF text extraction
try:
    from PyPDF2 import PdfReader
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

from backend.gemini_service import HAS_GEMINI, generate_json_response

# ─── 1. PDF Text Extraction ──────────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file."""
    if not HAS_PYPDF2:
        raise RuntimeError("PyPDF2 is not installed. Run: pip install PyPDF2")

    reader = PdfReader(file_path)
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts)


# ─── 2. Section Extraction (NLP/Regex) ───────────────────────────────────────

# Common section header patterns
SECTION_PATTERNS = {
    "summary": r"(?i)(?:summary|objective|profile|about\s*me|career\s*objective|professional\s*summary)",
    "education": r"(?i)(?:education|academic|qualification|degree|university|college)",
    "experience": r"(?i)(?:experience|employment|work\s*history|professional\s*experience|internship)",
    "skills": r"(?i)(?:skills|technical\s*skills|core\s*competencies|competencies|expertise|proficiency)",
    "projects": r"(?i)(?:projects|personal\s*projects|academic\s*projects|key\s*projects)",
    "certifications": r"(?i)(?:certification|certifications|certificates|licenses|accreditation)",
    "achievements": r"(?i)(?:achievement|achievements|awards|honors|accomplishments|recognition)",
}

# Common technology keywords
TECH_KEYWORDS = {
    "languages": ["python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
                  "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql",
                  "html", "css", "sass", "less"],
    "frameworks": ["react", "angular", "vue", "next.js", "nextjs", "nuxt", "svelte", "django",
                   "flask", "fastapi", "express", "spring", "laravel", ".net", "rails",
                   "flutter", "react native", "electron", "tailwind", "bootstrap"],
    "databases": ["mongodb", "postgresql", "mysql", "sqlite", "redis", "elasticsearch",
                  "dynamodb", "cassandra", "firebase", "supabase", "neo4j"],
    "cloud": ["aws", "azure", "gcp", "google cloud", "heroku", "vercel", "netlify",
              "docker", "kubernetes", "terraform", "jenkins", "ci/cd", "github actions"],
    "ai_ml": ["machine learning", "deep learning", "tensorflow", "pytorch", "keras",
              "scikit-learn", "nlp", "computer vision", "opencv", "pandas", "numpy",
              "hugging face", "langchain", "openai", "llm"],
    "tools": ["git", "github", "gitlab", "jira", "figma", "postman", "linux",
              "nginx", "apache", "webpack", "vite", "babel"],
}


def extract_resume_sections(text: str) -> dict:
    """Extract structured sections from resume text using regex/NLP."""
    lines = text.split("\n")
    sections = {
        "summary": "",
        "education": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "certifications": [],
        "achievements": [],
        "technologies": [],
        "raw_text": text,
    }

    # Identify section boundaries
    section_boundaries = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        for section_name, pattern in SECTION_PATTERNS.items():
            if re.search(pattern, stripped) and len(stripped) < 60:
                section_boundaries.append((i, section_name))
                break

    # Extract content between section boundaries
    for idx, (line_num, section_name) in enumerate(section_boundaries):
        next_line = section_boundaries[idx + 1][0] if idx + 1 < len(section_boundaries) else len(lines)
        content_lines = lines[line_num + 1:next_line]
        content = "\n".join(l.strip() for l in content_lines if l.strip())

        if section_name == "summary":
            sections["summary"] = content
        elif section_name == "education":
            sections["education"] = _parse_education(content)
        elif section_name == "experience":
            sections["experience"] = _parse_experience(content)
        elif section_name == "skills":
            sections["skills"] = _parse_skills(content)
        elif section_name == "projects":
            sections["projects"] = _parse_projects(content)
        elif section_name == "certifications":
            sections["certifications"] = _parse_list_items(content)
        elif section_name == "achievements":
            sections["achievements"] = _parse_list_items(content)

    # Extract technologies from entire text
    sections["technologies"] = _extract_technologies(text)

    # If skills section is empty, try to extract from technologies
    if not sections["skills"] and sections["technologies"]:
        sections["skills"] = [t["name"] for t in sections["technologies"]]

    return sections


def _parse_skills(content: str) -> list:
    """Parse skills from content — handles comma/pipe separated and bullet lists."""
    skills = []
    # Try comma or pipe separated
    for sep in [",", "|", "•", "·", "►", "●"]:
        if sep in content:
            parts = [p.strip().strip("-").strip("•").strip() for p in content.split(sep)]
            skills.extend([p for p in parts if p and len(p) < 50])

    if not skills:
        # Line-by-line
        for line in content.split("\n"):
            cleaned = line.strip().strip("-").strip("•").strip("*").strip()
            if cleaned and len(cleaned) < 60:
                skills.append(cleaned)

    return list(dict.fromkeys(skills))  # deduplicate preserving order


def _parse_education(content: str) -> list:
    """Parse education entries."""
    entries = []
    current = {}
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            if current:
                entries.append(current)
                current = {}
            continue

        # Detect degree patterns
        degree_match = re.search(r"(?i)(b\.?(?:tech|sc|e|a|s)|m\.?(?:tech|sc|s|a|ba)|ph\.?d|bachelor|master|associate|diploma)", line)
        year_match = re.search(r"(20\d{2}|19\d{2})", line)

        if degree_match and not current.get("degree"):
            current["degree"] = line
            if year_match:
                current["year"] = year_match.group(1)
        elif not current.get("institution") and (len(line) > 5):
            if current.get("degree"):
                current["institution"] = line
            else:
                current["degree"] = line
        if year_match and not current.get("year"):
            current["year"] = year_match.group(1)

    if current:
        entries.append(current)

    return entries if entries else [{"degree": content.strip()[:200]}]


def _parse_experience(content: str) -> list:
    """Parse work experience entries."""
    entries = []
    current = {"title": "", "details": []}
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            if current["title"]:
                entries.append(current)
                current = {"title": "", "details": []}
            continue

        # Likely a job title/company line (contains dates or is short)
        has_date = bool(re.search(r"(20\d{2}|19\d{2}|present|current)", line, re.IGNORECASE))
        is_bullet = line.startswith(("-", "•", "*", "►", "●"))

        if (has_date or (not is_bullet and not current["title"])):
            if current["title"]:
                entries.append(current)
                current = {"title": "", "details": []}
            current["title"] = line
        else:
            detail = line.lstrip("-•*►● ").strip()
            if detail:
                current["details"].append(detail)

    if current["title"]:
        entries.append(current)

    return entries


def _parse_projects(content: str) -> list:
    """Parse project entries."""
    entries = []
    current = {"name": "", "description": []}
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            if current["name"]:
                entries.append({
                    "name": current["name"],
                    "description": " ".join(current["description"])
                })
                current = {"name": "", "description": []}
            continue

        is_bullet = line.startswith(("-", "•", "*", "►", "●"))
        if not is_bullet and not current["name"]:
            current["name"] = line
        elif not is_bullet and len(line) < 80 and not current["description"]:
            # Possibly a project name on next block
            if current["name"]:
                entries.append({
                    "name": current["name"],
                    "description": " ".join(current["description"])
                })
            current = {"name": line, "description": []}
        else:
            detail = line.lstrip("-•*►● ").strip()
            if detail:
                current["description"].append(detail)

    if current["name"]:
        entries.append({
            "name": current["name"],
            "description": " ".join(current["description"])
        })

    return entries


def _parse_list_items(content: str) -> list:
    """Parse simple list items (for certifications, achievements)."""
    items = []
    for line in content.split("\n"):
        cleaned = line.strip().lstrip("-•*►● ").strip()
        if cleaned and len(cleaned) > 3:
            items.append(cleaned)
    return items


def _extract_technologies(text: str) -> list:
    """Extract technology mentions from entire resume text."""
    text_lower = text.lower()
    found = []
    for category, techs in TECH_KEYWORDS.items():
        for tech in techs:
            if tech.lower() in text_lower:
                found.append({"name": tech, "category": category})
    return found


# ─── 3. AI Resume Analysis ──────────────────────────────────────────────────

async def analyze_resume(parsed_data: dict, target_role: str = None, target_company: str = None) -> dict:
    """Analyze resume quality using Gemini or fallback scoring."""
    if HAS_GEMINI:
        try:
            prompt = _build_analysis_prompt(parsed_data, target_role, target_company)
            system_instruction = "You are an expert resume analyst and career coach. Always respond with valid JSON."
            
            result = await generate_json_response(prompt, system_instruction=system_instruction)
            result["source"] = "gemini"
            return result
        except Exception:
            pass  # Fall through to fallback

    return _fallback_analysis(parsed_data, target_role)


def _build_analysis_prompt(parsed_data: dict, target_role: str = None, target_company: str = None) -> str:
    """Build the AI analysis prompt."""
    role_ctx = f" for a {target_role} position" if target_role else ""
    company_ctx = f" at {target_company}" if target_company else ""

    return f"""Analyze this resume{role_ctx}{company_ctx} and provide a comprehensive assessment.

Resume Data:
- Skills: {json.dumps(parsed_data.get('skills', []))}
- Education: {json.dumps(parsed_data.get('education', []))}
- Experience: {json.dumps(parsed_data.get('experience', []))}
- Projects: {json.dumps(parsed_data.get('projects', []))}
- Certifications: {json.dumps(parsed_data.get('certifications', []))}
- Technologies: {json.dumps([t['name'] for t in parsed_data.get('technologies', [])])}
- Achievements: {json.dumps(parsed_data.get('achievements', []))}
- Summary: {parsed_data.get('summary', '')}

Respond with JSON:
{{
    "overall_score": <0-100>,
    "ats_score": <0-100>,
    "technical_score": <0-100>,
    "project_score": <0-100>,
    "communication_score": <0-100>,
    "missing_sections": ["list of missing/weak resume sections"],
    "weak_areas": ["list of technical weaknesses"],
    "ats_issues": ["list of ATS compatibility issues"],
    "suggestions": [
        {{"title": "suggestion title", "description": "detailed suggestion", "priority": "high|medium|low", "category": "skills|experience|projects|formatting|ats"}}
    ],
    "keyword_analysis": {{
        "present": ["keywords found"],
        "missing": ["important keywords missing"],
        "relevance_score": <0-100>
    }}
}}"""


# ─── Role-Specific Skill Databases ────────────────────────────────────────────

ROLE_SKILL_MAP = {
    "frontend": ["react", "javascript", "typescript", "html", "css", "vue", "angular", "next.js",
                  "tailwind", "webpack", "redux", "graphql", "jest", "figma", "responsive design"],
    "backend": ["python", "java", "node.js", "express", "django", "fastapi", "sql", "postgresql",
                "mongodb", "redis", "docker", "rest api", "microservices", "git", "linux"],
    "fullstack": ["react", "node.js", "javascript", "typescript", "python", "sql", "mongodb",
                   "docker", "git", "rest api", "html", "css", "express", "postgresql", "aws"],
    "data_science": ["python", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",
                      "sql", "matplotlib", "jupyter", "machine learning", "deep learning",
                      "statistics", "r", "nlp", "data visualization"],
    "devops": ["docker", "kubernetes", "aws", "terraform", "jenkins", "ci/cd", "linux",
               "ansible", "monitoring", "git", "python", "bash", "nginx", "prometheus", "grafana"],
    "mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android", "firebase",
               "rest api", "git", "figma", "typescript", "redux", "app store", "ui/ux"],
    "ml_engineer": ["python", "tensorflow", "pytorch", "scikit-learn", "docker", "mlops",
                     "aws", "kubernetes", "sql", "pandas", "numpy", "deep learning",
                     "nlp", "computer vision", "hugging face"],
    "general": ["python", "javascript", "sql", "git", "docker", "react", "node.js",
                "html", "css", "rest api", "linux", "aws", "mongodb", "postgresql"],
}


def _detect_role(target_role: str, tech_names: list) -> str:
    """Auto-detect the best matching role from resume technologies."""
    if target_role:
        role_lower = target_role.lower()
        if any(k in role_lower for k in ["front", "ui", "react", "angular", "vue"]): return "frontend"
        if any(k in role_lower for k in ["back", "server", "api", "django", "flask"]): return "backend"
        if any(k in role_lower for k in ["full", "mern", "mean"]): return "fullstack"
        if any(k in role_lower for k in ["data sci", "analyst", "data eng"]): return "data_science"
        if any(k in role_lower for k in ["devops", "sre", "cloud", "infra"]): return "devops"
        if any(k in role_lower for k in ["mobile", "ios", "android", "flutter"]): return "mobile"
        if any(k in role_lower for k in ["ml", "machine", "ai ", "deep"]): return "ml_engineer"

    # Auto-detect from technologies
    scores = {}
    for role, skills in ROLE_SKILL_MAP.items():
        scores[role] = sum(1 for s in skills if any(s.lower() in t for t in tech_names))
    best = max(scores, key=scores.get) if scores else "general"
    return best if scores.get(best, 0) >= 3 else "general"


def _count_syllables(word: str) -> int:
    """Estimate syllable count for readability scoring."""
    word = word.lower().strip(".,!?;:-")
    if len(word) <= 2: return 1
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for ch in word:
        is_vowel = ch in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if word.endswith("e") and count > 1:
        count -= 1
    return max(count, 1)


def _build_advanced_suggestions(parsed, role_key, matched, missing_skills, verb_hits, quant_patterns, has_link):
    """Build intelligent, prioritized suggestions."""
    s = []
    if not parsed.get("summary"):
        s.append({"title": "Add a Professional Summary", "description": f"Write a 2-3 sentence summary targeting the {role_key} role. Include your top 3 skills and years of experience. ATS systems weight the summary section heavily.", "priority": "high", "category": "ats", "impact": "+8-12 ATS points"})
    if missing_skills:
        top = ", ".join(missing_skills[:5])
        s.append({"title": f"Add Missing {role_key.title()} Skills", "description": f"Your resume is missing key skills for {role_key}: {top}. Add these to your Skills section and weave them into project descriptions.", "priority": "high", "category": "skills", "impact": f"+{min(len(missing_skills)*3, 20)} ATS points"})
    if len(parsed.get("projects", [])) < 3:
        s.append({"title": "Add More Projects with Tech Stack", "description": "Include 3-4 projects. Each should mention: problem solved, tech used, quantified outcome (e.g., '40% faster load time').", "priority": "high", "category": "projects", "impact": "+10-15 project score"})
    if verb_hits < 5:
        s.append({"title": "Use Strong Action Verbs", "description": "Start every bullet point with impact verbs: Developed, Architected, Optimized, Deployed, Scaled, Reduced, Automated, Integrated.", "priority": "medium", "category": "formatting", "impact": "+5-10 communication score"})
    if len(quant_patterns) < 3:
        s.append({"title": "Quantify Your Impact", "description": "Add numbers: 'Reduced load time by 40%', 'Served 10K+ users', 'Automated 5 workflows saving 20hrs/week'. Recruiters scan for metrics.", "priority": "high", "category": "experience", "impact": "+8-15 overall score"})
    if not has_link:
        s.append({"title": "Add GitHub & LinkedIn Links", "description": "Include links to your GitHub, LinkedIn, and portfolio. 87% of recruiters check candidates' online profiles.", "priority": "medium", "category": "ats", "impact": "+5 ATS points"})
    if not parsed.get("certifications"):
        s.append({"title": "Add Industry Certifications", "description": "Add relevant certifications (AWS Certified, Google Cloud, Meta Frontend, HackerRank). Even free certifications show initiative.", "priority": "medium", "category": "skills", "impact": "+5-8 confidence score"})
    if not parsed.get("achievements"):
        s.append({"title": "Add Awards & Achievements", "description": "Include hackathon wins, academic honors, open-source contributions, or any recognitions. They differentiate you from other candidates.", "priority": "medium", "category": "experience", "impact": "+5-10 overall score"})
    return s


def _build_roadmap(overall, ats, tech, project, missing_skills, missing_sections):
    """Build a step-by-step improvement roadmap."""
    steps = []
    if missing_sections:
        steps.append({"step": 1, "title": "Fix Missing Sections", "description": f"Add: {', '.join(missing_sections[:3])}. This is the fastest way to boost your score.", "effort": "30 min", "impact": "high"})
    if ats < 60:
        steps.append({"step": len(steps)+1, "title": "Optimize for ATS", "description": "Add a skills section with role-specific keywords. Use standard section headings. Remove fancy formatting.", "effort": "1 hour", "impact": "high"})
    if missing_skills:
        steps.append({"step": len(steps)+1, "title": "Close Skill Gaps", "description": f"Learn and add: {', '.join(missing_skills[:3])}. Even basic knowledge counts — mention them in projects.", "effort": "1-2 weeks", "impact": "high"})
    if project < 50:
        steps.append({"step": len(steps)+1, "title": "Strengthen Projects", "description": "Add detailed descriptions with tech stack, your role, and measurable outcomes for each project.", "effort": "2 hours", "impact": "medium"})
    if tech < 50:
        steps.append({"step": len(steps)+1, "title": "Build Technical Depth", "description": "Work on projects using in-demand technologies. Document them on GitHub with README files.", "effort": "2-4 weeks", "impact": "high"})
    steps.append({"step": len(steps)+1, "title": "Get Feedback", "description": "Have a peer or mentor review your resume. Fresh eyes catch issues you'll miss.", "effort": "1 day", "impact": "medium"})
    return steps


def _fallback_analysis(parsed_data: dict, target_role: str = None) -> dict:
    """Advanced NLP-based resume analysis with semantic scoring."""
    skills = parsed_data.get("skills", [])
    education = parsed_data.get("education", [])
    experience = parsed_data.get("experience", [])
    projects = parsed_data.get("projects", [])
    certifications = parsed_data.get("certifications", [])
    technologies = parsed_data.get("technologies", [])
    achievements = parsed_data.get("achievements", [])
    summary = parsed_data.get("summary", "")
    raw_text = parsed_data.get("raw_text", "")
    word_count = len(raw_text.split())
    tech_names = [t["name"].lower() for t in technologies]
    tech_cats = set(t.get("category") for t in technologies)

    # ═══════════════════════════════════════════════════════════════════════════
    # 1. ROLE-SPECIFIC SKILL MATCHING (semantic / TF-IDF style)
    # ═══════════════════════════════════════════════════════════════════════════
    role_key = _detect_role(target_role, tech_names)
    role_skills = ROLE_SKILL_MAP.get(role_key, ROLE_SKILL_MAP["general"])
    matched = [s for s in role_skills if any(s.lower() in t for t in tech_names)]
    match_ratio = len(matched) / max(len(role_skills), 1)

    # ═══════════════════════════════════════════════════════════════════════════
    # 2. READABILITY & COMMUNICATION ANALYSIS
    # ═══════════════════════════════════════════════════════════════════════════
    sentences = re.split(r'[.!?]+', raw_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    avg_sent_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)

    # Flesch-Kincaid inspired readability
    syllable_count = sum(_count_syllables(w) for w in raw_text.split())
    fk_grade = max(0.39 * (word_count / max(len(sentences), 1)) + 11.8 * (syllable_count / max(word_count, 1)) - 15.59, 0)
    readability_score = max(min(100 - abs(fk_grade - 10) * 5, 95), 15)

    # Action verb analysis
    action_verbs = {"developed", "implemented", "designed", "built", "created", "led", "managed",
                    "optimized", "improved", "architected", "deployed", "automated", "integrated",
                    "delivered", "launched", "reduced", "increased", "scaled", "engineered",
                    "configured", "maintained", "resolved", "analyzed", "collaborated", "mentored",
                    "spearheaded", "streamlined", "refactored", "migrated", "orchestrated"}
    text_words = set(raw_text.lower().split())
    verb_hits = len(action_verbs & text_words)
    verb_density = verb_hits / max(word_count / 100, 1)

    # Quantification metrics (numbers = impact)
    quant_patterns = re.findall(r'\d+[%+x]|\$[\d,.]+k?m?|\d+\+|\d{2,}(?:\s*(?:users|customers|clients|requests|transactions|downloads))', raw_text, re.IGNORECASE)
    quant_score = min(len(quant_patterns) * 12, 50)

    comm_score = int(min(
        25 + (readability_score * 0.2) + (verb_density * 10) + quant_score +
        (15 if summary and len(summary) > 50 else 0) +
        (10 if achievements else 0),
    95))

    # ═══════════════════════════════════════════════════════════════════════════
    # 3. TECHNICAL SCORE (weighted by role relevance)
    # ═══════════════════════════════════════════════════════════════════════════
    base_tech = min(15 + len(technologies) * 4, 50)
    diversity_bonus = min(len(tech_cats) * 6, 20)
    role_match_bonus = int(match_ratio * 30)
    tech_score = min(base_tech + diversity_bonus + role_match_bonus, 95)

    # ═══════════════════════════════════════════════════════════════════════════
    # 4. PROJECT QUALITY SCORE
    # ═══════════════════════════════════════════════════════════════════════════
    project_score = 15
    if projects:
        project_score += min(len(projects) * 10, 30)
        rich_descs = sum(1 for p in projects if len(p.get("description", "")) > 40)
        project_score += min(rich_descs * 12, 30)
        # Bonus for projects mentioning tech stack
        tech_mentions = sum(1 for p in projects if any(t in p.get("description", "").lower() for t in tech_names[:10]))
        project_score += min(tech_mentions * 5, 15)
    project_score = min(project_score, 95)

    # ═══════════════════════════════════════════════════════════════════════════
    # 5. EXPERIENCE QUALITY SCORE
    # ═══════════════════════════════════════════════════════════════════════════
    exp_score = 15
    if experience:
        exp_score += min(len(experience) * 12, 30)
        detailed = sum(1 for e in experience if len(e.get("details", [])) >= 2)
        exp_score += min(detailed * 10, 25)
        # Check for impact-driven bullet points
        impact_bullets = sum(1 for e in experience for d in e.get("details", []) if re.search(r'\d+[%+x]|\$\d+', d))
        exp_score += min(impact_bullets * 8, 20)
    exp_score = min(exp_score, 95)

    # ═══════════════════════════════════════════════════════════════════════════
    # 6. ADVANCED ATS SCORE (multi-factor)
    # ═══════════════════════════════════════════════════════════════════════════
    ats_format = 0   # /25 — formatting & structure
    ats_kw = 0       # /30 — keyword optimization
    ats_section = 0  # /20 — section completeness
    ats_contact = 0  # /15 — contact information
    ats_read = 0     # /10 — readability for parsers

    # Format scoring
    if 300 < word_count < 1200: ats_format += 10
    elif word_count >= 1200: ats_format += 5
    if not re.search(r'[│┃║╔╗╚╝═─┌┐└┘]', raw_text): ats_format += 5  # no fancy chars
    if len(re.findall(r'\n{3,}', raw_text)) < 3: ats_format += 5  # not too sparse
    bullet_lines = len(re.findall(r'^[\s]*[-•*►●]', raw_text, re.MULTILINE))
    if bullet_lines >= 5: ats_format += 5

    # Keyword scoring (role-matched)
    kw_found = len(matched)
    ats_kw = min(int(kw_found / max(len(role_skills), 1) * 30), 30)

    # Section completeness
    section_checks = [bool(summary), bool(skills), bool(education), bool(experience), bool(projects)]
    ats_section = int(sum(section_checks) / len(section_checks) * 20)

    # Contact info
    has_email = bool(re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text))
    has_phone = bool(re.search(r'\b\d{10}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\+\d{1,3}\s?\d+', raw_text))
    has_link = bool(re.search(r'(?:github|linkedin|portfolio|http)', raw_text, re.IGNORECASE))
    if has_email: ats_contact += 5
    if has_phone: ats_contact += 5
    if has_link: ats_contact += 5

    # Readability for parsers
    if avg_sent_len < 25: ats_read += 5
    if fk_grade < 14: ats_read += 5

    ats_score = ats_format + ats_kw + ats_section + ats_contact + ats_read
    ats_score = max(min(ats_score, 95), 5)

    ats_breakdown = {
        "formatting": {"score": ats_format, "max": 25, "label": "Format & Structure"},
        "keywords": {"score": ats_kw, "max": 30, "label": "Keyword Optimization"},
        "sections": {"score": ats_section, "max": 20, "label": "Section Completeness"},
        "contact": {"score": ats_contact, "max": 15, "label": "Contact Information"},
        "readability": {"score": ats_read, "max": 10, "label": "Parser Readability"},
    }

    # ═══════════════════════════════════════════════════════════════════════════
    # 7. OVERALL SCORE & CONFIDENCE
    # ═══════════════════════════════════════════════════════════════════════════
    overall = int(
        tech_score * 0.20 + project_score * 0.15 + ats_score * 0.25 +
        comm_score * 0.10 + exp_score * 0.15 + readability_score * 0.05 +
        (match_ratio * 10)  # role-fit bonus
    )
    overall = max(min(overall, 95), 5)

    # Confidence = probability of getting shortlisted
    confidence = int(
        overall * 0.4 + ats_score * 0.3 + match_ratio * 20 +
        (10 if certifications else 0) + (5 if has_link else 0)
    )
    confidence = max(min(confidence, 95), 5)

    # ═══════════════════════════════════════════════════════════════════════════
    # 8. SKILL GAP ANALYSIS
    # ═══════════════════════════════════════════════════════════════════════════
    missing_role_skills = [s for s in role_skills if not any(s.lower() in t for t in tech_names)]
    skill_gap = {
        "target_role": role_key,
        "required_skills": role_skills,
        "matched_skills": matched,
        "missing_skills": missing_role_skills,
        "match_percentage": round(match_ratio * 100, 1),
        "skill_categories": {cat: len([t for t in technologies if t.get("category") == cat]) for cat in tech_cats},
    }

    # ═══════════════════════════════════════════════════════════════════════════
    # 9. STRENGTHS & WEAKNESSES
    # ═══════════════════════════════════════════════════════════════════════════
    strengths_list = []
    weaknesses_list = []

    if tech_score >= 65: strengths_list.append({"area": "Technical Skills", "detail": f"Strong tech stack with {len(technologies)} technologies across {len(tech_cats)} categories", "score": tech_score})
    else: weaknesses_list.append({"area": "Technical Skills", "detail": f"Only {len(technologies)} technologies detected — expand your stack", "score": tech_score})

    if project_score >= 60: strengths_list.append({"area": "Projects", "detail": f"{len(projects)} projects with detailed descriptions show practical experience", "score": project_score})
    else: weaknesses_list.append({"area": "Projects", "detail": "Projects section needs more detail and tech stack mentions", "score": project_score})

    if exp_score >= 60: strengths_list.append({"area": "Experience", "detail": "Well-documented experience with impact-driven descriptions", "score": exp_score})
    else: weaknesses_list.append({"area": "Experience", "detail": "Add more detail to experience with quantified achievements", "score": exp_score})

    if ats_score >= 65: strengths_list.append({"area": "ATS Compatibility", "detail": "Resume is well-optimized for ATS parsing", "score": ats_score})
    else: weaknesses_list.append({"area": "ATS Compatibility", "detail": "Resume needs ATS optimization — missing keywords and sections", "score": ats_score})

    if comm_score >= 65: strengths_list.append({"area": "Communication", "detail": f"Good use of action verbs ({verb_hits}) and quantified impact", "score": comm_score})
    else: weaknesses_list.append({"area": "Communication", "detail": "Use more action verbs and quantify your achievements", "score": comm_score})

    if match_ratio >= 0.5: strengths_list.append({"area": "Role Fit", "detail": f"{round(match_ratio*100)}% skill match for {role_key} role", "score": int(match_ratio*100)})
    else: weaknesses_list.append({"area": "Role Fit", "detail": f"Only {round(match_ratio*100)}% match for {role_key} — add: {', '.join(missing_role_skills[:4])}", "score": int(match_ratio*100)})

    # ═══════════════════════════════════════════════════════════════════════════
    # 10. MISSING SECTIONS, ISSUES, SUGGESTIONS, ROADMAP
    # ═══════════════════════════════════════════════════════════════════════════
    missing = []
    if not summary: missing.append("Professional Summary / Objective")
    if not education: missing.append("Education")
    if not experience: missing.append("Work Experience / Internships")
    if not projects: missing.append("Projects")
    if not certifications: missing.append("Certifications")
    if not achievements: missing.append("Achievements / Awards")
    if not skills: missing.append("Skills Section")
    if not has_link: missing.append("GitHub / LinkedIn / Portfolio Link")

    ats_issues = []
    if not has_email: ats_issues.append({"issue": "No email address", "severity": "critical", "fix": "Add professional email at the top"})
    if not has_phone: ats_issues.append({"issue": "No phone number", "severity": "high", "fix": "Add phone number in contact section"})
    if not summary: ats_issues.append({"issue": "Missing professional summary", "severity": "high", "fix": "Add a 2-3 line summary with target keywords"})
    if not skills: ats_issues.append({"issue": "No skills section", "severity": "critical", "fix": "Add a dedicated skills section with role-relevant keywords"})
    if word_count < 200: ats_issues.append({"issue": "Resume too short", "severity": "high", "fix": "Expand to 400-800 words with detailed descriptions"})
    if word_count > 1500: ats_issues.append({"issue": "Resume too long", "severity": "medium", "fix": "Trim to 1-2 pages; remove irrelevant information"})
    if verb_hits < 3: ats_issues.append({"issue": "Few action verbs", "severity": "medium", "fix": "Start bullets with: Developed, Implemented, Designed, Led, Optimized"})
    if len(quant_patterns) < 2: ats_issues.append({"issue": "No quantified achievements", "severity": "high", "fix": "Add metrics: '40% faster', '$10K saved', '1000+ users'"})
    if missing_role_skills: ats_issues.append({"issue": f"Missing {len(missing_role_skills)} role keywords", "severity": "high", "fix": f"Add: {', '.join(missing_role_skills[:5])}"})

    suggestions = _build_advanced_suggestions(parsed_data, role_key, matched, missing_role_skills, verb_hits, quant_patterns, has_link)

    roadmap = _build_roadmap(overall, ats_score, tech_score, project_score, missing_role_skills, missing)

    kw_analysis = {
        "present": [t["name"] for t in technologies[:20]],
        "missing": missing_role_skills[:10],
        "relevance_score": round(match_ratio * 100, 1),
        "density": round(len(matched) / max(word_count / 100, 1), 2),
        "role_keywords": role_skills,
    }

    weak_areas = []
    if "cloud" not in tech_cats: weak_areas.append("No cloud/DevOps skills (AWS, Docker, Kubernetes)")
    if "databases" not in tech_cats: weak_areas.append("No database technologies mentioned")
    if not experience: weak_areas.append("No work experience — add internships or freelance")
    if len(skills) < 5: weak_areas.append("Very few skills — aim for 10-15 relevant skills")
    if not certifications: weak_areas.append("No certifications — add relevant ones")

    return {
        "overall_score": overall, "ats_score": ats_score, "technical_score": tech_score,
        "project_score": project_score, "communication_score": comm_score,
        "readability_score": round(readability_score, 1), "experience_score": exp_score,
        "confidence_score": confidence,
        "missing_sections": missing, "weak_areas": weak_areas,
        "ats_issues": ats_issues, "suggestions": suggestions,
        "keyword_analysis": kw_analysis, "skill_gap_analysis": skill_gap,
        "strengths": strengths_list, "weaknesses": weaknesses_list,
        "ats_breakdown": ats_breakdown, "improvement_roadmap": roadmap,
        "source": "advanced_nlp",
    }


# ─── 4. Interview Question Generation ────────────────────────────────────────

async def generate_interview_questions(parsed_data: dict, target_role: str = None) -> list:
    """Generate personalized interview questions from resume data."""
    if HAS_GEMINI:
        try:
            prompt = _build_question_prompt(parsed_data, target_role)
            system_instruction = "You are a technical interviewer. Generate interview questions based on a candidate's resume. Always respond with valid JSON."
            
            questions = await generate_json_response(prompt, system_instruction=system_instruction)
            
            for q in questions:
                q["source"] = "gemini"
            return questions
        except Exception:
            pass

    return _fallback_questions(parsed_data, target_role)


def _build_question_prompt(parsed_data: dict, target_role: str = None) -> str:
    role_ctx = f" for a {target_role} position" if target_role else ""
    return f"""Based on this candidate's resume{role_ctx}, generate 15 personalized interview questions.

Resume Data:
- Skills: {json.dumps(parsed_data.get('skills', [])[:15])}
- Projects: {json.dumps([p.get('name', '') for p in parsed_data.get('projects', [])])}
- Technologies: {json.dumps([t['name'] for t in parsed_data.get('technologies', [])[:15]])}
- Experience: {json.dumps([e.get('title', '') for e in parsed_data.get('experience', [])])}

Generate questions in this JSON array format:
[
    {{
        "question_text": "the question",
        "category": "technical|hr|behavioral|project|coding",
        "difficulty": "easy|medium|hard",
        "source_section": "skills|projects|experience|education",
        "source_detail": "specific skill or project name"
    }}
]

Include: 4 technical, 3 HR, 3 behavioral, 3 project-based, 2 coding questions."""


def _fallback_questions(parsed_data: dict, target_role: str = None) -> list:
    """Generate questions from resume data without AI."""
    questions = []
    skills = parsed_data.get("skills", [])
    projects = parsed_data.get("projects", [])
    technologies = parsed_data.get("technologies", [])
    experience = parsed_data.get("experience", [])

    # ── Technical questions from skills/technologies ──
    tech_templates = [
        "Explain how {tech} works and when you would use it.",
        "What are the advantages and disadvantages of {tech}?",
        "Describe a challenging problem you solved using {tech}.",
        "How does {tech} compare to its alternatives?",
        "What are the best practices when working with {tech}?",
    ]
    tech_names = [t["name"] for t in technologies[:10]] if technologies else skills[:10]
    for i, tech in enumerate(tech_names[:4]):
        template = tech_templates[i % len(tech_templates)]
        questions.append({
            "question_text": template.format(tech=tech),
            "category": "technical",
            "difficulty": random.choice(["easy", "medium", "hard"]),
            "source_section": "skills",
            "source_detail": tech,
        })

    # ── Project-based questions ──
    project_templates = [
        "Walk me through your '{project}' project. What was the architecture?",
        "What was the most challenging part of building '{project}'?",
        "How would you scale '{project}' to handle 10x more users?",
        "What would you do differently if you rebuilt '{project}' today?",
    ]
    for i, proj in enumerate(projects[:3]):
        name = proj.get("name", f"Project {i+1}")
        template = project_templates[i % len(project_templates)]
        questions.append({
            "question_text": template.format(project=name),
            "category": "project",
            "difficulty": "medium",
            "source_section": "projects",
            "source_detail": name,
        })

    # ── HR questions ──
    hr_questions = [
        {"question_text": "Tell me about yourself and your journey into software development.", "source_detail": "introduction"},
        {"question_text": "Why are you interested in this role and what excites you about it?", "source_detail": "motivation"},
        {"question_text": "Where do you see yourself in the next 3-5 years?", "source_detail": "career goals"},
    ]
    for hq in hr_questions:
        questions.append({
            **hq,
            "category": "hr",
            "difficulty": "easy",
            "source_section": "general",
        })

    # ── Behavioral questions ──
    behavioral_questions = [
        {"question_text": "Describe a time when you had to learn a new technology quickly for a project.", "source_detail": "adaptability"},
        {"question_text": "Tell me about a time you worked in a team and faced disagreements. How did you resolve them?", "source_detail": "teamwork"},
        {"question_text": "Give an example of a time you took initiative beyond your assigned responsibilities.", "source_detail": "initiative"},
    ]
    for bq in behavioral_questions:
        questions.append({
            **bq,
            "category": "behavioral",
            "difficulty": "medium",
            "source_section": "general",
        })

    # ── Coding questions ──
    coding_templates = [
        {"question_text": "Write a function to find the longest common subsequence of two strings.", "difficulty": "hard", "source_detail": "algorithms"},
        {"question_text": "Implement a debounce function in JavaScript.", "difficulty": "medium", "source_detail": "javascript"},
    ]
    # Customize based on known languages
    known_langs = [t["name"] for t in technologies if t.get("category") == "languages"]
    if "python" in [l.lower() for l in known_langs]:
        coding_templates.append({
            "question_text": "Write a Python decorator that caches function results.",
            "difficulty": "medium",
            "source_detail": "python",
        })
    if "javascript" in [l.lower() for l in known_langs] or "typescript" in [l.lower() for l in known_langs]:
        coding_templates[1] = {
            "question_text": "Implement a Promise.all polyfill in JavaScript.",
            "difficulty": "hard",
            "source_detail": "javascript",
        }

    for cq in coding_templates[:2]:
        questions.append({
            **cq,
            "category": "coding",
            "source_section": "skills",
        })

    return questions
