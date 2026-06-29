"""AI Job Matching Engine — resume-based job/company recommendations powered by Gemini."""

import json
from backend.gemini_service import HAS_GEMINI, generate_json_response

# ── Company Database ─────────────────────────────────────────────────────────

COMPANY_DB = {
    "Google": {
        "tier": "FAANG", "accent": "#4285F4",
        "required_skills": ["python","java","go","c++","algorithms","system design","distributed systems","kubernetes","gcp"],
        "ats_keywords": ["scalability","distributed","ml","search","api","microservices","open source"],
        "culture": ["innovation","open culture","data-driven","remote-friendly"],
        "roles": ["SDE II","Staff Engineer","ML Engineer","Site Reliability Engineer"],
        "salary_inr": {"intern": [60000,120000], "fresher": [2200000,3500000], "experienced": [3500000,7000000]},
        "interview_rounds": 5, "coding_level": "hard",
        "hiring_bar": 85, "min_ats": 70,
    },
    "Amazon": {
        "tier": "FAANG", "accent": "#FF9900",
        "required_skills": ["java","python","aws","dynamodb","microservices","system design","distributed systems","rest api"],
        "ats_keywords": ["leadership principles","ownership","scalability","customer obsession","cloud","s3","lambda"],
        "culture": ["ownership","frugality","customer first","high bar"],
        "roles": ["SDE I","SDE II","Cloud Support Engineer","Data Engineer"],
        "salary_inr": {"intern": [50000,100000], "fresher": [1800000,2800000], "experienced": [2800000,6000000]},
        "interview_rounds": 4, "coding_level": "medium-hard",
        "hiring_bar": 78, "min_ats": 65,
    },
    "Microsoft": {
        "tier": "FAANG", "accent": "#00A4EF",
        "required_skills": ["c#","python","java","azure","sql","rest api","oops","typescript","react"],
        "ats_keywords": ["azure","cloud","collaboration","diversity","growth mindset","dotnet"],
        "culture": ["growth mindset","inclusive","collaborative","hybrid"],
        "roles": ["SDE","Senior SDE","PM","Azure Engineer"],
        "salary_inr": {"intern": [55000,110000], "fresher": [2000000,3000000], "experienced": [3000000,6500000]},
        "interview_rounds": 4, "coding_level": "medium",
        "hiring_bar": 75, "min_ats": 65,
    },
    "Meta": {
        "tier": "FAANG", "accent": "#0668E1",
        "required_skills": ["python","c++","react","hack","graph api","distributed systems","algorithms","pytorch"],
        "ats_keywords": ["social graph","ads","integrity","ml","react native","open source","scale"],
        "culture": ["move fast","bold bets","open","meritocracy"],
        "roles": ["Software Engineer","ML Engineer","Infrastructure Engineer","Research Engineer"],
        "salary_inr": {"intern": [70000,130000], "fresher": [2500000,4000000], "experienced": [4000000,8000000]},
        "interview_rounds": 4, "coding_level": "hard",
        "hiring_bar": 82, "min_ats": 68,
    },
    "Netflix": {
        "tier": "FAANG", "accent": "#E50914",
        "required_skills": ["java","python","aws","microservices","cassandra","kafka","system design","react"],
        "ats_keywords": ["streaming","scale","chaos engineering","freedom","responsibility","innovation"],
        "culture": ["freedom and responsibility","high performance","transparency"],
        "roles": ["Senior SDE","Staff Engineer","Platform Engineer","ML Engineer"],
        "salary_inr": {"intern": [80000,150000], "fresher": [3000000,5000000], "experienced": [5000000,12000000]},
        "interview_rounds": 5, "coding_level": "hard",
        "hiring_bar": 88, "min_ats": 72,
    },
    "Adobe": {
        "tier": "Product", "accent": "#FF0000",
        "required_skills": ["java","python","c++","aws","creative cloud","rest api","react","microservices"],
        "ats_keywords": ["creative","cloud","pdfs","design","subscription","saas","analytics"],
        "culture": ["creativity","inclusive","innovation","work-life balance"],
        "roles": ["MTS","Computer Scientist","Research Scientist","Cloud Engineer"],
        "salary_inr": {"intern": [45000,90000], "fresher": [1500000,2500000], "experienced": [2500000,5000000]},
        "interview_rounds": 4, "coding_level": "medium",
        "hiring_bar": 72, "min_ats": 60,
    },
    "Flipkart": {
        "tier": "Product", "accent": "#2874F0",
        "required_skills": ["java","python","spark","kafka","mysql","spring","microservices","react"],
        "ats_keywords": ["ecommerce","scale","supply chain","payments","logistics","recommendations"],
        "culture": ["startup spirit","fast-paced","customer first","meritocracy"],
        "roles": ["SDE I","SDE II","Data Engineer","Platform Engineer"],
        "salary_inr": {"intern": [40000,80000], "fresher": [1400000,2200000], "experienced": [2200000,4500000]},
        "interview_rounds": 4, "coding_level": "medium-hard",
        "hiring_bar": 73, "min_ats": 62,
    },
    "Razorpay": {
        "tier": "Startup", "accent": "#2EB5F5",
        "required_skills": ["golang","python","node.js","react","postgresql","redis","payments","rest api"],
        "ats_keywords": ["fintech","payments","api","startup","scale","banking","emi"],
        "culture": ["fast-paced","ownership","startup","fintech"],
        "roles": ["SDE","Backend Engineer","Full Stack Engineer","Platform Engineer"],
        "salary_inr": {"intern": [50000,100000], "fresher": [1600000,2600000], "experienced": [2600000,5500000]},
        "interview_rounds": 3, "coding_level": "medium",
        "hiring_bar": 70, "min_ats": 58,
    },
    "Zomato": {
        "tier": "Startup", "accent": "#E23744",
        "required_skills": ["python","go","react","mysql","kafka","redis","elasticsearch","microservices"],
        "ats_keywords": ["food-tech","delivery","logistics","recommendations","real-time","scale"],
        "culture": ["fast-paced","young","startup","data-driven"],
        "roles": ["SDE I","SDE II","Backend Engineer","Data Engineer"],
        "salary_inr": {"intern": [35000,70000], "fresher": [1200000,2000000], "experienced": [2000000,4000000]},
        "interview_rounds": 3, "coding_level": "medium",
        "hiring_bar": 68, "min_ats": 55,
    },
    "Infosys": {
        "tier": "Service", "accent": "#007CC3",
        "required_skills": ["java","python","sql","angular","spring","rest api","testing"],
        "ats_keywords": ["digital transformation","consulting","client","delivery","agile","offshore"],
        "culture": ["process-driven","training","global","structured"],
        "roles": ["Systems Engineer","Technology Analyst","Senior Developer","Consultant"],
        "salary_inr": {"intern": [15000,25000], "fresher": [350000,600000], "experienced": [600000,1500000]},
        "interview_rounds": 2, "coding_level": "easy",
        "hiring_bar": 50, "min_ats": 45,
    },
    "TCS": {
        "tier": "Service", "accent": "#00AEEF",
        "required_skills": ["java","sql","python","angular","rest api","testing","agile"],
        "ats_keywords": ["digital","cloud","consulting","delivery","agile","cognitive"],
        "culture": ["structured","training","global delivery","values"],
        "roles": ["Systems Engineer","IT Analyst","Developer","Consultant"],
        "salary_inr": {"intern": [12000,20000], "fresher": [320000,550000], "experienced": [550000,1200000]},
        "interview_rounds": 2, "coding_level": "easy",
        "hiring_bar": 48, "min_ats": 43,
    },
    "Swiggy": {
        "tier": "Startup", "accent": "#FC8019",
        "required_skills": ["golang","python","react","kafka","mysql","redis","microservices"],
        "ats_keywords": ["food-tech","hyperlocal","logistics","real-time","recommendations"],
        "culture": ["fast-paced","startup","data-driven","ownership"],
        "roles": ["SDE I","SDE II","Backend Engineer","Data Scientist"],
        "salary_inr": {"intern": [40000,80000], "fresher": [1300000,2100000], "experienced": [2100000,4200000]},
        "interview_rounds": 3, "coding_level": "medium",
        "hiring_bar": 68, "min_ats": 55,
    },
    "Paytm": {
        "tier": "Startup", "accent": "#002970",
        "required_skills": ["java","python","spring","mysql","redis","kafka","payments"],
        "ats_keywords": ["fintech","payments","wallet","upi","banking","scale"],
        "culture": ["startup","fast","digital india","payments-first"],
        "roles": ["SDE","Backend Engineer","Android Developer","Data Engineer"],
        "salary_inr": {"intern": [30000,60000], "fresher": [1000000,1800000], "experienced": [1800000,3500000]},
        "interview_rounds": 3, "coding_level": "medium",
        "hiring_bar": 65, "min_ats": 52,
    },
}

ROLE_REQUIREMENTS = {
    "Backend Engineer":   {"skills": ["python","java","go","rest api","sql","microservices","docker"], "weight": {"system_design": 0.3, "coding": 0.4}},
    "Full Stack Engineer":{"skills": ["react","node.js","javascript","python","sql","rest api","css"], "weight": {"frontend": 0.3, "backend": 0.3, "coding": 0.3}},
    "SDE":                {"skills": ["dsa","oops","python","java","sql","git","problem solving"],    "weight": {"coding": 0.5, "system_design": 0.2}},
    "ML Engineer":        {"skills": ["python","tensorflow","pytorch","pandas","numpy","scikit-learn","sql"], "weight": {"ml": 0.5, "coding": 0.3}},
    "Data Engineer":      {"skills": ["python","spark","kafka","sql","airflow","aws","etl"],          "weight": {"data": 0.5, "coding": 0.3}},
    "DevOps Engineer":    {"skills": ["docker","kubernetes","aws","terraform","jenkins","linux","python"], "weight": {"cloud": 0.5, "coding": 0.2}},
    "Frontend Engineer":  {"skills": ["react","typescript","javascript","html","css","redux","jest"],  "weight": {"frontend": 0.5, "coding": 0.3}},
}


# ── Scoring Helpers ────────────────────────────────────────────────────────────

def _skill_match(candidate_techs: list, required: list) -> float:
    candidate_lower = [t.lower() for t in candidate_techs]
    matched = sum(1 for s in required if any(s in c for c in candidate_lower))
    return round(matched / max(len(required), 1) * 100, 1)

def _tier_badge(tier: str) -> str:
    return {"FAANG": "🏆", "Product": "💼", "Startup": "🚀", "Service": "🏢"}.get(tier, "💼")

def _placement_level(prob: float) -> str:
    if prob >= 80: return "Excellent"
    if prob >= 65: return "Good"
    if prob >= 50: return "Moderate"
    if prob >= 35: return "Developing"
    return "Needs Work"


# ── Core Scoring Engines ───────────────────────────────────────────────────────

def calculate_company_fit(resume_analysis: dict, company_name: str, role: str, experience_years: int = 0) -> dict:
    """Calculate multi-dimensional fit score for a company+role, sensitive to role + experience."""
    co = COMPANY_DB.get(company_name, COMPANY_DB["Infosys"])
    techs = [t.get("name","") if isinstance(t,dict) else str(t) for t in resume_analysis.get("technologies",[])]
    skills = resume_analysis.get("skills", [])
    all_techs = list(set(techs + (skills if isinstance(skills, list) else [])))

    # ── 1. Company skill match (60% weight) + Role-specific match (40% weight)
    company_skill_pct = _skill_match(all_techs, co["required_skills"])
    role_req = ROLE_REQUIREMENTS.get(role, ROLE_REQUIREMENTS["SDE"])
    role_skill_pct = _skill_match(all_techs, role_req["skills"])
    skill_pct = round(company_skill_pct * 0.60 + role_skill_pct * 0.40, 1)

    ats_pct       = min(resume_analysis.get("ats_score", 40), 100)
    project_pct   = min(resume_analysis.get("project_score", 30), 100)
    exp_pct       = min(resume_analysis.get("experience_score", 30), 100)
    interview_pct = min(resume_analysis.get("interview_avg_score", 40), 100)

    # ── 2. Seniority match: penalise/reward based on experience vs company tier
    # Senior companies (FAANG) need experience; service companies fine with freshers
    seniority_map = {"FAANG": 3, "Product": 1, "Startup": 1, "Service": 0}
    required_exp = seniority_map.get(co["tier"], 1)
    if experience_years >= required_exp:
        seniority_bonus = min((experience_years - required_exp) * 3, 12)   # up to +12
    else:
        seniority_bonus = (experience_years - required_exp) * 8            # penalty per missing year

    # ── 3. Role-specific technical weight modifier
    # DevOps/ML roles need higher technical score; Service roles less so
    role_tech_weights = {
        "DevOps Engineer":    {"tech": 0.40, "ats": 0.15, "proj": 0.20, "exp": 0.15, "interview": 0.10},
        "ML Engineer":        {"tech": 0.40, "ats": 0.15, "proj": 0.20, "exp": 0.15, "interview": 0.10},
        "Frontend Engineer":  {"tech": 0.30, "ats": 0.20, "proj": 0.25, "exp": 0.10, "interview": 0.15},
        "Full Stack Engineer":{"tech": 0.30, "ats": 0.20, "proj": 0.25, "exp": 0.10, "interview": 0.15},
        "Backend Engineer":   {"tech": 0.35, "ats": 0.20, "proj": 0.15, "exp": 0.15, "interview": 0.15},
        "Data Engineer":      {"tech": 0.40, "ats": 0.15, "proj": 0.20, "exp": 0.15, "interview": 0.10},
        "SDE":                {"tech": 0.35, "ats": 0.20, "proj": 0.15, "exp": 0.15, "interview": 0.15},
    }
    w = role_tech_weights.get(role, role_tech_weights["SDE"])
    base_fit = (
        skill_pct      * w["tech"] +
        ats_pct        * w["ats"]  +
        project_pct    * w["proj"] +
        exp_pct        * w["exp"]  +
        interview_pct  * w["interview"]
    )
    fit = round(min(max(base_fit + seniority_bonus, 5), 97), 1)

    hiring_prob = round(
        (resume_analysis.get("overall_score",40)*0.25 +
         ats_pct*0.20 + interview_pct*0.20 +
         resume_analysis.get("technical_score",40)*0.20 +
         resume_analysis.get("communication_score",40)*0.15),
        1
    )
    # Apply company bar + seniority modifier to hiring probability too
    hiring_prob = round(min(max(hiring_prob * (co["hiring_bar"]/100 + 0.15) + seniority_bonus*0.5, 5), 95), 1)

    ats_match  = round((ats_pct + skill_pct) / 2, 1)
    tech_ready = round((skill_pct + project_pct) / 2, 1)
    role_compat = round((role_skill_pct + exp_pct) / 2, 1)

    missing_company = [s for s in co["required_skills"] if not any(s in t.lower() for t in all_techs)]
    missing_role    = [s for s in role_req["skills"]     if not any(s in t.lower() for t in all_techs)]
    missing = list(dict.fromkeys(missing_role + missing_company))  # role gaps first, deduplicated

    return {
        "company": company_name,
        "role": role,
        "tier": co["tier"],
        "accent": co["accent"],
        "badge": _tier_badge(co["tier"]),
        "fit_score": fit,
        "hiring_probability": hiring_prob,
        "skill_match": skill_pct,
        "company_skill_match": company_skill_pct,
        "role_skill_match": role_skill_pct,
        "ats_match": ats_match,
        "technical_readiness": tech_ready,
        "role_compatibility": role_compat,
        "seniority_match": max(0, min(100, 50 + seniority_bonus * 4)),
        "missing_skills": missing[:6],
        "culture": co["culture"],
        "interview_rounds": co["interview_rounds"],
        "coding_level": co["coding_level"],
        "salary_inr": co["salary_inr"],
        "why_good_fit": _why_fit(fit),
        "improvement_tips": _improvement_tips(missing, ats_pct),
    }


def _why_fit(fit: float) -> list:
    if fit >= 80: return ["Strong technical alignment","ATS-optimized resume","Good interview performance"]
    if fit >= 65: return ["Decent skill overlap","Good project experience","Needs minor ATS improvements"]
    if fit >= 50: return ["Some skills match","Projects show potential","Interview prep recommended"]
    return ["Skill gap exists","Resume needs optimization","More practice required"]


def _improvement_tips(missing: list, ats: float) -> list:
    tips = []
    if missing: tips.append(f"Learn: {', '.join(missing[:3])}")
    if ats < 65: tips.append("Optimize resume for ATS keywords")
    tips.append("Practice company-specific interview questions")
    if len(tips) < 3: tips.append("Build a relevant project for this company's domain")
    return tips[:3]


def predict_salary(resume_analysis: dict, company_name: str, experience_years: int = 0) -> dict:
    co = COMPANY_DB.get(company_name, COMPANY_DB["Infosys"])
    base = co["salary_inr"]
    skill_boost = min(resume_analysis.get("technical_score", 50) / 100 * 0.3 + 0.85, 1.15)

    if experience_years == 0:
        low, high = base["intern"]
    elif experience_years <= 2:
        low, high = base["fresher"]
    else:
        low, high = base["experienced"]

    return {
        "company": company_name,
        "experience_years": experience_years,
        "intern_monthly_inr": base["intern"],
        "fresher_annual_inr": base["fresher"],
        "experienced_annual_inr": base["experienced"],
        "estimated_low": int(low * skill_boost),
        "estimated_high": int(high * skill_boost),
        "currency": "INR",
    }


def detect_skill_gaps(resume_analysis: dict, target_role: str = "SDE") -> dict:
    role_req = ROLE_REQUIREMENTS.get(target_role, ROLE_REQUIREMENTS["SDE"])
    techs = [t.get("name","") if isinstance(t,dict) else str(t) for t in resume_analysis.get("technologies",[])]
    skills = resume_analysis.get("skills", [])
    all_techs = list(set([t.lower() for t in techs] + [s.lower() for s in (skills if isinstance(skills,list) else [])]))

    required = role_req["skills"]
    missing = [s for s in required if not any(s in c for c in all_techs)]
    matched = [s for s in required if any(s in c for c in all_techs)]

    # Weak interview areas from analysis
    weak_interview = []
    if resume_analysis.get("interview_avg_score", 100) < 60:
        weak_interview = ["System Design","Behavioral STAR","Problem Solving","Communication"]
    elif resume_analysis.get("interview_avg_score", 100) < 75:
        weak_interview = ["System Design","Advanced DSA"]

    weak_areas = resume_analysis.get("weak_areas", [])
    if isinstance(weak_areas, str):
        try: weak_areas = json.loads(weak_areas)
        except: weak_areas = []

    # Missing resume keywords
    missing_kw = resume_analysis.get("keyword_analysis", {})
    if isinstance(missing_kw, str):
        try: missing_kw = json.loads(missing_kw)
        except: missing_kw = {}
    missing_keywords = missing_kw.get("missing", [])[:8]

    return {
        "target_role": target_role,
        "required_skills": required,
        "matched_skills": matched,
        "missing_skills": missing,
        "match_percentage": round(len(matched) / max(len(required), 1) * 100, 1),
        "weak_areas": weak_areas[:5] if isinstance(weak_areas, list) else [],
        "missing_keywords": missing_keywords,
        "weak_interview_topics": weak_interview,
        "severity": "High" if len(missing) > len(required) // 2 else "Medium" if missing else "Low",
    }


def generate_learning_recommendations(skill_gaps: dict) -> list:
    recs = []
    missing = skill_gaps.get("missing_skills", [])
    role = skill_gaps.get("target_role", "SDE")

    LEARNING_MAP = {
        "python":      {"resource": "Python Bootcamp - freeCodeCamp", "url": "https://youtube.com/watch?v=rfscVS0vtbw", "type": "video"},
        "react":       {"resource": "React Full Course - Scrimba",    "url": "https://scrimba.com/learn/learnreact",       "type": "course"},
        "aws":         {"resource": "AWS Free Tier + Cloud Practitioner", "url": "https://aws.amazon.com/free",           "type": "certification"},
        "docker":      {"resource": "Docker Getting Started",         "url": "https://docs.docker.com/get-started",        "type": "docs"},
        "kubernetes":  {"resource": "Kubernetes Basics - official",   "url": "https://kubernetes.io/docs/tutorials",       "type": "docs"},
        "system design":{"resource":"System Design Primer - GitHub",  "url": "https://github.com/donnemartin/system-design-primer", "type":"article"},
        "algorithms":  {"resource": "Striver's A2Z DSA Sheet",        "url": "https://takeuforward.org/strivers-a2z-dsa-course", "type":"practice"},
        "sql":         {"resource": "SQLZoo Interactive Tutorials",   "url": "https://sqlzoo.net",                         "type": "practice"},
        "golang":      {"resource": "Go by Example",                  "url": "https://gobyexample.com",                   "type": "docs"},
        "tensorflow":  {"resource": "TensorFlow Tutorials",           "url": "https://tensorflow.org/tutorials",           "type": "docs"},
        "kafka":       {"resource": "Apache Kafka Quickstart",        "url": "https://kafka.apache.org/quickstart",        "type": "docs"},
    }

    for skill in missing[:5]:
        info = LEARNING_MAP.get(skill.lower())
        if info:
            recs.append({"skill": skill, "type": info["type"], **info})
        else:
            recs.append({"skill": skill, "resource": f"Learn {skill} on YouTube/Udemy", "url": f"https://youtube.com/results?search_query={skill}+tutorial", "type": "video"})

    # Role-specific certifications
    CERTS = {
        "SDE":          "HackerRank Problem Solving Certification",
        "ML Engineer":  "Google ML Crash Course",
        "DevOps Engineer": "AWS DevOps Professional",
        "Data Engineer":"Google Data Engineering Certificate",
        "Backend Engineer":"Node.js/Django/FastAPI project on GitHub",
    }
    cert = CERTS.get(role)
    if cert:
        recs.append({"skill": "Certification", "resource": cert, "url": "https://www.hackerrank.com/skills-verification", "type": "certification"})

    return recs


def calculate_hiring_probability(resume_analysis: dict, interview_avg: float = 0, coding_rate: float = 0) -> dict:
    r = resume_analysis
    prob = (
        min(r.get("overall_score", 40), 100) * 0.25 +
        min(r.get("ats_score", 40), 100)     * 0.20 +
        min(interview_avg, 100)               * 0.20 +
        min(r.get("technical_score", 40), 100)* 0.20 +
        min(r.get("communication_score", 40), 100) * 0.15
    )
    prob = round(min(prob, 95), 1)
    return {
        "hiring_probability": prob,
        "placement_readiness": _placement_level(prob),
        "resume_quality": r.get("overall_score", 40),
        "ats_optimization": r.get("ats_score", 40),
        "interview_performance": interview_avg,
        "technical_depth": r.get("technical_score", 40),
        "communication_score": r.get("communication_score", 40),
        "coding_success_rate": coding_rate,
        "factors": {
            "resume_quality": {"score": r.get("overall_score", 40), "weight": "25%"},
            "ats_score":       {"score": r.get("ats_score", 40),     "weight": "20%"},
            "interview_avg":   {"score": interview_avg,               "weight": "20%"},
            "technical":       {"score": r.get("technical_score", 40),"weight": "20%"},
            "communication":   {"score": r.get("communication_score", 40), "weight": "15%"},
        },
    }


# ── Main Gemini-Powered Generator ─────────────────────────────────────────────

async def generate_job_matches(user_profile: dict) -> dict:
    """Generate full job matching report — Gemini first, fallback if unavailable."""
    resume_analysis  = user_profile.get("resume_analysis", {})
    interview_avg    = user_profile.get("interview_avg_score", 0)
    coding_rate      = user_profile.get("coding_success_rate", 0)
    target_role      = user_profile.get("target_role", "SDE")
    target_domain    = user_profile.get("target_domain", "any")
    experience_years = int(user_profile.get("experience_years", 0))  # ← now used everywhere

    techs = [t.get("name","") if isinstance(t,dict) else str(t) for t in resume_analysis.get("technologies", [])]
    skills = resume_analysis.get("skills", [])
    if isinstance(skills, str):
        try: skills = json.loads(skills)
        except: skills = []

    # Rank companies — pass role + experience into fit calculation
    company_scores = []
    for name in COMPANY_DB:
        fit = calculate_company_fit(
            {**resume_analysis, "interview_avg_score": interview_avg},
            name, target_role, experience_years   # ← experience_years now passed
        )
        company_scores.append(fit)
    company_scores.sort(key=lambda x: x["fit_score"], reverse=True)
    top_companies = company_scores[:8]

    skill_gaps    = detect_skill_gaps(resume_analysis, target_role)
    learning_recs = generate_learning_recommendations(skill_gaps)
    hiring_prob   = calculate_hiring_probability(resume_analysis, interview_avg, coding_rate)
    # Salary predictions use the actual selected experience_years
    salaries = [predict_salary(resume_analysis, co["company"], experience_years) for co in top_companies[:5]]

    # Remote/startup suitability — adjust slightly by experience
    exp_bonus = min(experience_years * 2, 10)
    remote_score  = round(min(resume_analysis.get("technical_score",40)*0.4 + resume_analysis.get("communication_score",40)*0.3 + resume_analysis.get("ats_score",40)*0.3 + exp_bonus, 95), 1)
    startup_score = round(min(resume_analysis.get("project_score",40)*0.5 + hiring_prob["hiring_probability"]*0.5, 95), 1)

    base_report = {
        "top_company_matches": top_companies,
        "skill_gap_analysis": skill_gaps,
        "learning_recommendations": learning_recs,
        "hiring_probability": hiring_prob,
        "salary_predictions": salaries,
        "target_role": target_role,
        "experience_years": experience_years,
        "remote_suitability_score": remote_score,
        "startup_fit_score": startup_score,
        "product_company_fit": round(company_scores[0]["fit_score"] if company_scores else 50, 1),
        "top_match_company": top_companies[0]["company"] if top_companies else "N/A",
        "top_match_score": top_companies[0]["fit_score"] if top_companies else 0,
        "source": "fallback",
    }

    if not HAS_GEMINI:
        return base_report

    try:
        prompt = f"""You are an expert AI recruiter. Analyze this candidate profile and enhance the job matching report.

Candidate Profile:
- Skills/Tech: {json.dumps(techs[:15] + (skills[:10] if isinstance(skills,list) else []))}
- Resume Overall Score: {resume_analysis.get('overall_score', 'N/A')}
- ATS Score: {resume_analysis.get('ats_score', 'N/A')}
- Technical Score: {resume_analysis.get('technical_score', 'N/A')}
- Project Score: {resume_analysis.get('project_score', 'N/A')}
- Interview Avg Score: {interview_avg}
- Coding Success Rate: {coding_rate}%
- Target Role: {target_role}
- Top Matched Company (deterministic): {base_report['top_match_company']} at {base_report['top_match_score']}%

Pre-computed company rankings: {json.dumps([{"company": c["company"], "fit": c["fit_score"]} for c in top_companies[:5]])}

Respond with valid JSON:
{{
  "ai_insights": [
    {{"title": "insight title", "description": "detailed insight", "type": "strength|warning|opportunity"}}
  ],
  "career_summary": "2-3 sentence personalized career readiness summary",
  "top_3_recommendations": [
    {{"company": "name", "role": "role", "reason": "why this is the best fit", "action": "what to do next"}}
  ],
  "interview_prep_plan": [
    {{"topic": "topic name", "priority": "high|medium|low", "resources": "what to study", "days_needed": 7}}
  ],
  "project_ideas": [
    {{"title": "project name", "tech_stack": ["tech1","tech2"], "impact": "why this project helps"}}
  ]
}}"""

        ai_result = await generate_json_response(prompt, system_instruction="You are an expert AI career recruiter and job matching specialist. Always respond with valid JSON.")

        return {
            **base_report,
            "ai_insights": ai_result.get("ai_insights", []),
            "career_summary": ai_result.get("career_summary", ""),
            "top_3_recommendations": ai_result.get("top_3_recommendations", []),
            "interview_prep_plan": ai_result.get("interview_prep_plan", []),
            "project_ideas": ai_result.get("project_ideas", []),
            "source": "gemini",
        }
    except Exception:
        return base_report
