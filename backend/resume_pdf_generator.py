"""
Vista-IQ — HTML/CSS Resume PDF Generator
Uses Jinja2 templates + xhtml2pdf for premium, ATS-friendly PDF output.

Public API:
  - build_resume_context(...)    → dict  — build Jinja2 template context
  - render_resume_html(ctx, tpl) → str   — render HTML string (for preview)
  - generate_optimized_pdf(...)  → str   — generate PDF file, return path
"""

import re
import io
from pathlib import Path
from datetime import datetime

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
    HAS_JINJA = True
except ImportError:
    HAS_JINJA = False

try:
    from xhtml2pdf import pisa
    HAS_PISA = True
except ImportError:
    HAS_PISA = False

# Fall back to ReportLab if xhtml2pdf unavailable
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, KeepTogether
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

OUTPUT_DIR   = Path("uploads/optimized_resumes")
TEMPLATE_DIR = Path(__file__).parent / "resume_templates"

TEMPLATE_MAP = {
    "faang":     "faang.html",
    "classic":   "classic.html",
    "minimal":   "minimal.html",
    "executive": "executive.html",
}

# ─── Skill Categorizer ────────────────────────────────────────────────────────

SKILL_CATEGORIES = {
    "Languages":      ["python","javascript","typescript","java","c++","c#","go","rust","kotlin","swift","scala","dart","bash","sql","ruby","php"],
    "Frontend":       ["react","vue","angular","next.js","nextjs","svelte","html","css","sass","tailwind","bootstrap","shadcn","redux","graphql","jquery","vite","webpack"],
    "Backend":        ["fastapi","django","flask","node.js","express","spring","nestjs","rest","microservices","grpc","kafka","nginx","laravel"],
    "Databases":      ["mongodb","postgresql","mysql","sqlite","redis","elasticsearch","dynamodb","cassandra","firebase","oracle","prisma","neo4j"],
    "AI / ML":        ["machine learning","deep learning","tensorflow","pytorch","keras","scikit-learn","nlp","opencv","pandas","numpy","langchain","transformers","llm","mlops"],
    "Cloud & DevOps": ["aws","azure","gcp","google cloud","docker","kubernetes","terraform","jenkins","ci/cd","github actions","vercel","netlify","linux","git"],
    "Tools":          ["figma","postman","jira","swagger","prometheus","grafana","sentry","notion","xcode","android studio"],
}


def _preprocess_skills(skills: list) -> list:
    prefix_re = re.compile(
        r'^(?:programming languages?|frameworks?|tools?|databases?|frontend|backend|technologies|tech stack|languages?)\s*[:\-]\s*',
        re.IGNORECASE
    )
    seen, result = set(), []
    for raw in skills:
        if not isinstance(raw, str):
            continue
        raw = prefix_re.sub('', raw.strip())
        for token in re.split(r'[,/|]|(?:\s*:\s*)', raw):
            t = token.strip().strip('.')
            if t and 2 <= len(t) <= 40 and not re.search(r'http|github\.com|linkedin\.com', t, re.I):
                tl = t.lower()
                if tl not in seen:
                    seen.add(tl)
                    result.append(t)
    return result


def _categorize_skills(skills: list) -> dict:
    clean = _preprocess_skills(skills)
    result = {cat: [] for cat in SKILL_CATEGORIES}
    result["Other"] = []
    placed = set()
    for s in clean:
        sl = s.lower()
        words = sl.split()
        matched = False
        for cat, kws in SKILL_CATEGORIES.items():
            for kw in kws:
                # For short keywords (<=3 chars like 'go', 'sql'), only match single-word skills
                kw_words = kw.split()
                if len(kw) <= 3 and len(words) > 1:
                    continue  # skip: "Go Web Development" should not match "go"
                if len(kw) >= 2 and re.search(r'\b' + re.escape(kw) + r'\b', sl):
                    if sl not in placed:
                        result[cat].append(s)
                        placed.add(sl)
                    matched = True
                    break
            if matched:
                break
        if not matched and sl not in placed and len(sl) <= 35 and len(words) <= 3:
            result["Other"].append(s)
            placed.add(sl)
    return {k: v for k, v in result.items() if v}


def _split_bullets(text: str) -> list:
    if not text:
        return []
    text = text.strip()
    if re.search(r'[–•►●]', text):
        parts = re.split(r'\s*[–•►●]\s*', text)
    elif text.count('. ') >= 1:
        # Split on ". Capital" boundaries
        parts = re.split(r'\.\s+(?=[A-Z])', text)
        if len(parts) == 1:
            parts = [text]  # no useful split found
    else:
        parts = [text]
    result = [p.strip().rstrip('.') for p in parts if p.strip() and len(p.strip()) > 10]
    # Always return at least the full text as one bullet
    return result if result else [text[:300]]


def _extract_contact(raw_text: str) -> dict:
    e  = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text)
    p  = re.search(r'(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}', raw_text)
    g  = re.search(r'github\.com/[A-Za-z0-9._\-]+', raw_text, re.I)
    li = re.search(r'linkedin\.com/in/[A-Za-z0-9._\-]+', raw_text, re.I)
    return {
        "email":    e.group()  if e  else "",
        "phone":    p.group().strip() if p else "",
        "github":   g.group()  if g  else "",
        "linkedin": li.group() if li else "",
    }


def _parse_experience(opt_experience: list, original_parsed: dict) -> list:
    source = opt_experience
    if not source:
        source = [
            {"title": e.get("title",""), "optimized_bullets": e.get("details",[])}
            for e in original_parsed.get("experience", []) if e.get("title","")
        ]
    result = []
    for exp in source:
        raw_title = exp.get("title","")
        if not raw_title:
            continue
        parts  = re.split(r'\s*[|·,]\s*', raw_title, maxsplit=2)
        job    = parts[0].strip()
        company= parts[1].strip() if len(parts) > 1 else ""
        date   = parts[2].strip() if len(parts) > 2 else ""
        bullets= exp.get("optimized_bullets") or exp.get("original_bullets", [])
        bullets= [b for b in bullets if b and len(b) > 5 and not re.search(r'http', b, re.I)]
        result.append({"title": job, "company": company, "date": date, "bullets": bullets[:6]})
    return result


def _parse_projects(opt_projects: list, original_parsed: dict = None) -> list:
    """Build project list — uses original techs, adds AI keywords as extras."""
    # Build a lookup of original project techs from the parsed resume
    orig_techs = {}
    if original_parsed:
        for p in original_parsed.get("projects", []):
            name = p.get("name", "").strip()
            techs = p.get("technologies", []) or p.get("tech", []) or []
            if name:
                orig_techs[name.lower()] = techs

    result = []
    for proj in opt_projects:
        name = proj.get("name","")
        if not name or re.search(r'http|github\.com', name, re.I):
            continue
        clean_name = re.split(r'\s*[|\u2013]\s*', name)[0].strip()
        if not clean_name:
            continue
        desc    = proj.get("optimized_description") or proj.get("original_description","")
        # Use original techs from resume; added_keywords are ATS keywords, not display techs
        orig_t  = orig_techs.get(clean_name.lower(), [])
        added_k = proj.get("added_keywords", [])
        # Only include added_keywords that look like real tech names (short, no spaces mostly)
        real_added = [k for k in added_k if len(k) <= 20 and not k.startswith("distributed") and not k.startswith("customer")]
        all_tech = list(dict.fromkeys(orig_t + real_added))  # deduplicated, originals first
        bullets = _split_bullets(desc)
        bullets = [b for b in bullets if not re.search(r'http', b, re.I) and len(b) > 10]
        if not bullets and desc and len(desc) > 20:
            bullets = [desc[:250]]
        result.append({"name": clean_name, "tech": all_tech[:6], "bullets": bullets[:5]})
    return result


def _clean_education(education: list) -> list:
    result = []
    for edu in education:
        degree = edu.get("degree","") or edu.get("institution","")
        if not degree:
            continue
        # Strip trailing dates that crept into the degree field
        degree_clean = re.split(
            r'\s+(?:Aug|Sep|Jan|Feb|Mar|Apr|May|Jun|Jul|Oct|Nov|Dec|\d{4})',
            degree
        )[0].strip().rstrip('\u2013-').strip()
        institution = edu.get("institution","")
        # If institution is blank but degree has a pipe/dash separator, split them
        if not institution and ('|' in degree_clean or '-' in degree_clean):
            parts = re.split(r'[|\u2013\-]', degree_clean, 1)
            degree_clean = parts[0].strip()
            institution  = parts[1].strip() if len(parts) > 1 else ""
        year = str(edu.get("year","") or edu.get("graduation_year","") or "").strip()
        # Skip obviously wrong entries like "Relevant Coursework"
        if re.match(r'relevant\s+coursework', degree_clean, re.I):
            continue
        result.append({
            "degree":      degree_clean[:80] or degree[:80],
            "institution": institution[:60],
            "year":        year,
        })
    return result


def _ensure_dir():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ─── Jinja2 Environment Builder ───────────────────────────────────────────────

def _get_jinja_env() -> "Environment":
    """Build and return a configured Jinja2 Environment."""
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    # Safe truncate filter: truncate(length, killwords, end)
    env.filters["truncate"] = lambda s, l=80, b=True, e="": (str(s)[:l] + e if len(str(s)) > l else str(s))
    return env


# ─── Public Helpers ────────────────────────────────────────────────────────────

def build_resume_context(
    optimization_data: dict,
    original_parsed: dict,
    user_name: str = "Candidate",
    user_email: str = "",
) -> dict:
    """Build the Jinja2 template context dict from optimization and parsed data."""
    company = optimization_data.get("company", "Company")
    role    = optimization_data.get("role", "Software Engineer")

    # Extract contact from PDF text; fall back to the logged-in user's email
    contact = _extract_contact(original_parsed.get("raw_text", ""))
    if user_email and not contact["email"]:
        contact["email"] = user_email
    elif user_email and contact["email"] and "@" in user_email:
        # Prefer the account email over whatever was scraped from the PDF
        contact["email"] = user_email

    return {
        "name":           user_name,
        "role":           role,
        "company":        company,
        "date":           datetime.utcnow().strftime("%B %Y"),
        "contact":        contact,
        "summary":        optimization_data.get("optimized_summary", ""),
        "skills":         _categorize_skills(optimization_data.get("optimized_skills", [])),
        "experience":     _parse_experience(
                              optimization_data.get("optimized_experience", []), original_parsed
                          ),
        "projects":       _parse_projects(
                              optimization_data.get("optimized_projects", []), original_parsed
                          ),
        "education":      _clean_education(original_parsed.get("education", [])),
        "certifications": original_parsed.get("certifications", []),
    }


def render_resume_html(ctx: dict, template: str = "faang") -> str:
    """Render resume data as an HTML string using the specified Jinja2 template.

    Args:
        ctx:      Template context dict (from build_resume_context).
        template: Template key — 'faang' | 'classic' | 'minimal' | 'executive'.

    Returns:
        Rendered HTML string, or a plain-text fallback on error.
    """
    if not HAS_JINJA or not TEMPLATE_DIR.exists():
        return "<html><body><p>Template engine unavailable.</p></body></html>"
    try:
        tpl_name = TEMPLATE_MAP.get(template, "classic.html")
        env = _get_jinja_env()
        return env.get_template(tpl_name).render(**ctx)
    except Exception as exc:
        print(f"[HTML] Render error: {exc}")
        return f"<html><body><p>Render error: {exc}</p></body></html>"


# ─── Main Generator ────────────────────────────────────────────────────────────

def generate_optimized_pdf(
    optimization_data: dict,
    original_parsed: dict,
    user_name: str = "Candidate",
    user_email: str = "",
    template: str = "faang",
) -> str:
    """Generate a PDF resume file and return its absolute path."""
    _ensure_dir()

    company = optimization_data.get("company", "Company")
    ts      = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    outfile = OUTPUT_DIR / f"resume_{company.lower().replace(' ', '_')}_{template}_{ts}.pdf"

    # Build context
    ctx = build_resume_context(optimization_data, original_parsed, user_name, user_email)

    # ── Try HTML → PDF via xhtml2pdf ──────────────────────────────────────────
    if HAS_JINJA and HAS_PISA and TEMPLATE_DIR.exists():
        try:
            html_str = render_resume_html(ctx, template)
            with open(str(outfile), "wb") as f:
                result = pisa.CreatePDF(io.StringIO(html_str), dest=f)
            if not result.err:
                return str(outfile.resolve())
            print(f"[PDF] xhtml2pdf error code {result.err} — falling back to ReportLab")
        except Exception as exc:
            print(f"[PDF] HTML render/convert failed: {exc} — falling back to ReportLab")

    # ── ReportLab fallback ─────────────────────────────────────────────────────
    if HAS_REPORTLAB:
        return _reportlab_fallback(ctx, outfile)

    raise RuntimeError("Neither xhtml2pdf nor ReportLab is available.")


# ─── ReportLab Fallback ───────────────────────────────────────────────────────

def _reportlab_fallback(ctx: dict, filepath: Path) -> str:
    DARK  = HexColor("#1F2937")
    ACC   = HexColor("#4F46E5")
    MUTED = HexColor("#6B7280")
    RULE  = HexColor("#E5E7EB")

    doc = SimpleDocTemplate(str(filepath), pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

    def S(name, **kw): return ParagraphStyle(name, **kw)
    name_s = S("N",  fontSize=20, fontName="Helvetica-Bold", textColor=DARK, spaceAfter=2)
    role_s = S("R",  fontSize=10, fontName="Helvetica", textColor=MUTED, spaceAfter=6)
    sec_s  = S("SH", fontSize=10, fontName="Helvetica-Bold", textColor=ACC, spaceBefore=10, spaceAfter=3)
    body_s = S("B",  fontSize=9.5, fontName="Helvetica", textColor=DARK, spaceAfter=2, leading=14, alignment=TA_JUSTIFY)
    bul_s  = S("BL", fontSize=9.5, fontName="Helvetica", textColor=DARK, spaceAfter=2, leading=14, leftIndent=14, firstLineIndent=-6)
    lbl_s  = S("LB", fontSize=10, fontName="Helvetica-Bold", textColor=DARK, spaceAfter=1)
    sm_s   = S("SM", fontSize=8.5, fontName="Helvetica-Oblique", textColor=MUTED, spaceAfter=2)
    foot_s = S("FT", fontSize=7.5, textColor=MUTED, alignment=TA_CENTER)

    def rule(): return HRFlowable(width="100%", thickness=1.2, color=ACC, spaceBefore=0, spaceAfter=5)
    def thin(): return HRFlowable(width="100%", thickness=0.4, color=RULE, spaceBefore=2, spaceAfter=3)
    def section(t): return [Paragraph(t.upper(), sec_s), rule()]

    story = []
    story.append(Paragraph(ctx["name"], name_s))
    story.append(Paragraph(ctx["role"], role_s))
    c = ctx["contact"]
    parts = [x for x in [c["email"], c["phone"], c["github"], c["linkedin"]] if x]
    if parts: story.append(Paragraph("  |  ".join(parts), S("C", fontSize=8.5, fontName="Helvetica", textColor=MUTED, alignment=TA_CENTER)))
    story.append(HRFlowable(width="100%", thickness=2, color=ACC, spaceBefore=4, spaceAfter=8))

    if ctx["summary"]:
        story.extend(section("Professional Summary"))
        story.append(Paragraph(ctx["summary"], body_s))

    if ctx["skills"]:
        story.extend(section("Technical Skills"))
        for cat, items in ctx["skills"].items():
            story.append(Paragraph(f"<b>{cat}:</b>  {',  '.join(items)}", body_s))

    if ctx["experience"]:
        story.extend(section("Work Experience"))
        for exp in ctx["experience"]:
            block = [Paragraph(exp["title"], lbl_s)]
            meta = "  |  ".join(x for x in [exp["company"], exp["date"]] if x)
            if meta: block.append(Paragraph(meta, sm_s))
            for b in exp["bullets"]: block.append(Paragraph(f"\u2022  {b}", bul_s))
            block.append(Spacer(1,5))
            story.append(KeepTogether(block))

    if ctx["projects"]:
        story.extend(section("Projects"))
        for proj in ctx["projects"]:
            block = [Paragraph(proj["name"], lbl_s)]
            if proj["tech"]: block.append(Paragraph(f"Stack:  {' | '.join(proj['tech'])}", sm_s))
            for b in proj["bullets"]: block.append(Paragraph(f"\u2022  {b}", bul_s))
            block.append(Spacer(1,5))
            story.append(KeepTogether(block))

    if ctx["education"]:
        story.extend(section("Education"))
        for edu in ctx["education"]:
            block = [Paragraph(edu["degree"], lbl_s)]
            meta = "  |  ".join(x for x in [edu["institution"], edu["year"]] if x)
            if meta: block.append(Paragraph(meta, sm_s))
            block.append(Spacer(1,4))
            story.append(KeepTogether(block))

    if ctx["certifications"]:
        story.extend(section("Certifications"))
        for cert in ctx["certifications"]:
            story.append(Paragraph(f"\u2022  {cert}", bul_s))

    story.append(Spacer(1,10))
    story.append(thin())
    story.append(Paragraph(f"<i>Optimized for {ctx['company']} — {ctx['role']}  |  Vista-IQ  |  {ctx['date']}</i>", foot_s))
    doc.build(story)
    return str(filepath.resolve())
