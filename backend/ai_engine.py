"""
Vista-IQ — Company-Specific Interview Engine
Genuinely differentiated interview questions per company, role, and round.
"""
import json
import random
from backend.gemini_service import HAS_GEMINI, generate_text_response, generate_json_response

# ─── Company DNA Profiles ────────────────────────────────────────────────────

COMPANY_PROFILES = {
    "Google": {
        "culture": "engineering excellence, algorithmic depth, massive scale, open-ended thinking",
        "interview_style": "whiteboard coding with optimal solutions, follow-up probing on complexity",
        "technical_focus": ["algorithms & data structures", "system design at petabyte scale", "distributed systems", "optimization & complexity analysis", "open-ended engineering problems"],
        "behavioral_focus": ["handling ambiguity", "cross-functional collaboration", "ownership of large systems", "innovation mindset"],
        "hr_focus": ["Googleyness & cultural fit", "intellectual curiosity", "collaborative work style"],
        "signature_topics": ["graph algorithms", "dynamic programming", "Bigtable/MapReduce concepts", "consistency vs availability", "search ranking systems"],
        "difficulty": "Very Hard",
        "avoid": "trivial questions, rote memorization, simple HR without depth",
    },
    "Amazon": {
        "culture": "customer obsession, ownership, bias for action, frugality, deliver results",
        "interview_style": "STAR-format behavioral mixed with technical DSA, leadership principles deeply probed",
        "technical_focus": ["scalable backend systems", "AWS services", "microservices", "CI/CD", "cost-optimized architecture"],
        "behavioral_focus": ["Leadership Principles — Customer Obsession, Ownership, Bias for Action, Dive Deep, Earn Trust"],
        "hr_focus": ["demonstrated ownership", "customer impact", "data-driven decisions"],
        "signature_topics": ["SQS/SNS architecture", "DynamoDB design", "Lambda serverless", "two-pizza team ownership", "working backwards from customer"],
        "difficulty": "Hard",
        "avoid": "vague teamwork answers, generic behavioral responses without specific results",
    },
    "Microsoft": {
        "culture": "growth mindset, collaboration, enterprise-scale impact, inclusive design",
        "interview_style": "practical problem-solving, system design, collaborative discussion, not just memorized answers",
        "technical_focus": ["system design", "API design", "Azure cloud", ".NET/TypeScript", "developer tooling", "accessibility"],
        "behavioral_focus": ["growth mindset", "learning from failure", "cross-team influence", "inclusive collaboration"],
        "hr_focus": ["career motivation", "Microsoft cultural fit", "long-term vision"],
        "signature_topics": ["Azure architecture", "DevOps pipelines", "Windows-scale reliability", "REST API design", "enterprise software patterns"],
        "difficulty": "Hard",
        "avoid": "purely algorithmic puzzles without real-world context",
    },
    "Netflix": {
        "culture": "freedom and responsibility, radical transparency, production reliability, senior bar",
        "interview_style": "deep system design, backend architecture, autonomous decision-making, trade-off discussions",
        "technical_focus": ["distributed systems", "streaming infrastructure", "chaos engineering", "low-latency APIs", "observability & monitoring"],
        "behavioral_focus": ["autonomous decision-making", "trade-off judgment", "handling production incidents", "senior engineering accountability"],
        "hr_focus": ["freedom & responsibility culture fit", "honest self-assessment", "senior-level judgment"],
        "signature_topics": ["Cassandra/Kafka at scale", "Chaos Monkey resilience", "CDN optimization", "A/B testing infrastructure", "microservices reliability"],
        "difficulty": "Very Hard",
        "avoid": "junior-level questions, process-heavy answers, lack of trade-off thinking",
    },
    "Meta": {
        "culture": "move fast, product-centric thinking, data-driven, billions-scale infrastructure",
        "interview_style": "fast-paced coding, product sense questions mixed with technical, data/ML system design",
        "technical_focus": ["React/GraphQL", "ML infrastructure", "ads systems", "feed ranking", "real-time data pipelines"],
        "behavioral_focus": ["speed of execution", "product impact thinking", "data-driven decision making"],
        "hr_focus": ["Meta mission alignment", "product thinking", "impact at scale"],
        "signature_topics": ["News Feed ranking", "PyTorch ML pipelines", "Graph API design", "A/B testing at scale", "Messenger real-time architecture"],
        "difficulty": "Hard",
        "avoid": "slow waterfall process answers, no product context in technical responses",
    },
    "Apple": {
        "culture": "obsessive quality, privacy-first, hardware-software integration, user delight",
        "interview_style": "deep technical expertise, extreme attention to detail, product craft discussions",
        "technical_focus": ["iOS/macOS development", "Swift/SwiftUI", "performance on constrained hardware", "privacy engineering", "Core Data/Metal"],
        "behavioral_focus": ["attention to detail", "polish and quality", "design-engineering intersection"],
        "hr_focus": ["passion for Apple products", "quality over speed", "privacy values"],
        "signature_topics": ["memory optimization on iOS", "SwiftUI performance", "App Store guidelines", "ARKit/Core ML", "accessibility APIs"],
        "difficulty": "Hard",
        "avoid": "generic web answers without mobile context, privacy-ignoring architecture",
    },
    "TCS": {
        "culture": "client delivery, process adherence, broad technology competence, communication",
        "interview_style": "CS fundamentals, aptitude, OOP concepts, straightforward HR, SQL basics",
        "technical_focus": ["OOP concepts", "DBMS fundamentals", "basic algorithms", "SQL queries", "SDLC processes"],
        "behavioral_focus": ["teamwork", "client communication", "adaptability", "time management"],
        "hr_focus": ["career goals", "relocation readiness", "work culture fit", "why TCS"],
        "signature_topics": ["OOP pillars", "normalization forms", "basic sorting/searching", "Java/Python basics", "Agile/Scrum basics"],
        "difficulty": "Beginner-Intermediate",
        "avoid": "advanced system design, complex algorithmic puzzles beyond basic level",
    },
    "Infosys": {
        "culture": "adaptability, continuous learning, collaborative problem-solving, digital transformation",
        "interview_style": "CS fundamentals, certifications discussion, broad tech knowledge, team-fit HR",
        "technical_focus": ["programming fundamentals", "cloud basics", "automation", "DevOps basics", "data structures basics"],
        "behavioral_focus": ["learning agility", "teamwork", "client value", "self-development"],
        "hr_focus": ["career aspirations", "why Infosys", "work-life balance views", "certifications"],
        "signature_topics": ["cloud migration basics", "REST API concepts", "basic design patterns", "Python/Java", "digital transformation"],
        "difficulty": "Beginner-Intermediate",
        "avoid": "hyper-specialized niche topics, overly advanced algorithms",
    },
    "Adobe": {
        "culture": "creativity meets engineering, product quality, cross-disciplinary thinking",
        "interview_style": "product design discussion, technical coding, creative problem-solving",
        "technical_focus": ["frontend engineering", "creative cloud APIs", "performance optimization", "system design"],
        "behavioral_focus": ["creativity in engineering", "design thinking", "product polish"],
        "hr_focus": ["passion for creative tools", "design appreciation", "Adobe product knowledge"],
        "signature_topics": ["PDF rendering optimization", "real-time collaboration systems", "Creative Cloud integration", "React performance", "media processing"],
        "difficulty": "Intermediate-Hard",
        "avoid": "purely abstract CS theory without product context",
    },
    "Flipkart": {
        "culture": "e-commerce at scale, delivery speed, data-driven, frugal innovation",
        "interview_style": "DSA, system design for e-commerce, product thinking, data handling",
        "technical_focus": ["e-commerce system design", "DSA", "Java backend", "search/recommendation systems", "supply chain tech"],
        "behavioral_focus": ["problem ownership", "speed of delivery", "data-driven decisions"],
        "hr_focus": ["startup mindset", "growth motivation", "why Flipkart"],
        "signature_topics": ["search ranking for e-commerce", "flash sale architecture", "inventory management systems", "recommendation engines", "payment gateway design"],
        "difficulty": "Intermediate-Hard",
        "avoid": "generic answers without e-commerce context",
    },
}

# ─── Role Profiles ────────────────────────────────────────────────────────────

ROLE_PROFILES = {
    "SDE": "software design, algorithms, data structures, system design, code quality, testing",
    "Frontend Developer": "React/Vue/Angular, CSS, browser performance, accessibility, component architecture, state management",
    "Backend Developer": "API design, databases, distributed systems, caching, message queues, security, scalability",
    "Full Stack Developer": "end-to-end feature ownership, frontend + backend integration, deployment pipelines, database design",
    "AI Engineer": "ML model development, training infrastructure, model optimization, deployment, MLOps, LLMs",
    "Data Engineer": "data pipelines, ETL, warehousing, Spark/Kafka, data quality, orchestration, SQL at scale",
    "DevOps Engineer": "CI/CD pipelines, Kubernetes, infrastructure as code, monitoring, incident response, cloud architecture",
    "System Engineer": "OOP, DBMS, networking basics, SDLC, documentation, testing fundamentals",
}

# ─── Topic Pools for Diversity ────────────────────────────────────────────────

TOPIC_POOLS = {
    "technical": {
        "Google": ["graph traversal", "dynamic programming", "trie structures", "system scalability", "consensus algorithms", "cache design", "distributed locks", "API rate limiting", "search indexing", "load balancing"],
        "Amazon": ["DynamoDB modeling", "Lambda architecture", "SQS dead letter queues", "ECS deployment", "API Gateway design", "cost optimization patterns", "S3 event-driven workflows", "blue-green deployment", "SLA design", "circuit breaker pattern"],
        "Microsoft": ["Azure service bus", "REST API versioning", "OAuth2 flows", "SignalR real-time", "entity framework", "microservices patterns", "DevOps pipelines", "accessibility in UI", "SQL optimization", "API gateway patterns"],
        "Netflix": ["Cassandra partition design", "Kafka consumer groups", "chaos engineering scenarios", "CDN cache strategy", "service mesh", "observability stack", "A/B test infrastructure", "video streaming protocols", "global traffic routing", "resilience patterns"],
        "Meta": ["GraphQL schema design", "React reconciliation", "ML feature stores", "ad auction systems", "feed ranking algorithm", "real-time messaging", "data consistency at scale", "PyTorch deployment", "graph neural networks", "event sourcing"],
        "default": ["binary trees", "hash maps", "REST APIs", "SQL joins", "OOP principles", "SOLID design", "HTTP fundamentals", "sorting algorithms", "database indexing", "caching strategies"],
    },
    "behavioral": {
        "Amazon": ["Customer Obsession", "Ownership", "Invent and Simplify", "Are Right, A Lot", "Learn and Be Curious", "Hire and Develop the Best", "Insist on Highest Standards", "Think Big", "Bias for Action", "Frugality", "Earn Trust", "Dive Deep", "Disagree and Commit", "Deliver Results"],
        "Google": ["handling ambiguity", "cross-team collaboration at scale", "project failure and learning", "technical mentorship", "driving innovation", "handling critical feedback", "managing competing priorities", "technical disagreements with senior engineers"],
        "Netflix": ["autonomous decision under uncertainty", "production incident handling", "radical transparency moment", "trade-off judgment calls", "feedback you gave to leadership", "building trust without authority"],
        "default": ["conflict resolution", "handling failure", "leadership moment", "going above and beyond", "learning quickly", "managing competing priorities", "creative problem solving"],
    },
}

# ─── Fallback Questions (company-specific) ───────────────────────────────────

COMPANY_FALLBACKS = {
    "Google": {
        "technical": ["Design a system to index and search billions of web pages efficiently.", "Given a graph of N nodes, find all strongly connected components. Discuss time complexity.", "Design a distributed rate limiter that works across 1000 servers.", "How would you optimize a search autocomplete system for sub-50ms latency?", "Explain the CAP theorem with a real Google-scale example."],
        "behavioral": ["Tell me about a time you solved a problem that seemed impossible at first.", "Describe a project where you had to balance speed vs correctness — what did you choose?", "Give an example where you challenged an assumption that everyone else accepted.", "Tell me about a time you mentored someone and how you measured their progress."],
        "hr": ["What excites you most about working on problems at Google's scale?", "How do you stay current with emerging technologies and apply them?", "Describe your ideal engineering culture and why Google fits that.", "How do you handle working on open-ended problems with no clear right answer?"],
    },
    "Amazon": {
        "technical": ["Design Amazon's product recommendation system at 500M users.", "How would you architect an SQS-based order processing pipeline with retry logic?", "Design a distributed inventory management system for flash sales.", "How would you implement DynamoDB single-table design for an e-commerce app?", "Design a real-time delivery tracking system at Amazon scale."],
        "behavioral": ["Tell me about a time you took ownership of a failing project. (LP: Ownership)", "Describe a situation where you had to deliver results with limited resources. (LP: Frugality)", "Give an example of when you dove deep into data to solve a problem. (LP: Dive Deep)", "Tell me about a time you disagreed with your manager but still delivered. (LP: Disagree and Commit)"],
        "hr": ["Why Amazon specifically — not just any tech company?", "How do you embody Customer Obsession in your day-to-day engineering work?", "Tell me about a time you raised the bar on a team standard.", "How do you handle working in a fast-paced environment with frequent priority changes?"],
    },
    "Netflix": {
        "technical": ["Design Netflix's video streaming CDN with global availability.", "How would you implement Chaos Monkey — what services would you target first?", "Design a recommendation engine that personalizes 200M users' home screens.", "How would you architect a microservices system with 99.999% uptime?", "Design Netflix's real-time A/B testing infrastructure."],
        "behavioral": ["Tell me about a time you made a major architectural decision autonomously.", "Describe a production incident you handled — what was your decision process?", "Tell me about a time you gave difficult feedback to a senior colleague.", "How do you decide between two valid engineering approaches with real trade-offs?"],
        "hr": ["Netflix values freedom and responsibility — give an example of that in your career.", "How do you handle situations where there's no clear process to follow?", "Describe a time you held yourself accountable publicly for a mistake.", "Why do you think you'd thrive in Netflix's high-autonomy environment?"],
    },
    "default": {
        "technical": ["Explain the difference between a stack and a queue with a real use case.", "What is the time complexity of binary search and when would you use it?", "Explain REST vs GraphQL — when would you choose each?", "What is database indexing and how does it affect query performance?", "Explain microservices architecture vs monolith — trade-offs?"],
        "behavioral": ["Tell me about a time you led a team through a difficult project.", "Describe a situation where you had to learn something quickly under pressure.", "Give an example of a time you failed and what you learned from it.", "Tell me about a time you disagreed with your manager — how did you handle it?"],
        "hr": ["Tell me about yourself and your professional background.", "Why are you interested in this role and company?", "Where do you see yourself in 5 years?", "What are your greatest technical strengths and areas of improvement?"],
    },
}


def _get_company_profile(company: str) -> dict:
    return COMPANY_PROFILES.get(company, {
        "culture": f"professional engineering excellence at {company}",
        "interview_style": "standard technical and behavioral interviews",
        "technical_focus": ["algorithms", "system design", "coding"],
        "behavioral_focus": ["teamwork", "problem solving", "leadership"],
        "hr_focus": ["career goals", "cultural fit"],
        "signature_topics": ["data structures", "API design", "databases"],
        "difficulty": "Intermediate",
    })


def _get_role_context(role: str) -> str:
    return ROLE_PROFILES.get(role, f"software engineering with focus on {role} responsibilities")


def _pick_topic(company: str, round_type: str, question_num: int) -> str:
    pool = TOPIC_POOLS.get(round_type, {})
    topics = pool.get(company, pool.get("default", ["general engineering"]))
    return topics[(question_num - 1) % len(topics)]


def _build_system_prompt(company: str, role: str, round_type: str, difficulty: str = None) -> str:
    profile = _get_company_profile(company) if company else None
    role_ctx = _get_role_context(role) if role else "software engineering"
    diff = difficulty or (profile["difficulty"] if profile else "Intermediate")

    if not profile:
        return f"""You are a professional {round_type} interviewer. Ask one clear, focused question.
Role focus: {role_ctx}. Difficulty: {diff}."""

    focus_map = {
        "technical": profile["technical_focus"],
        "behavioral": profile["behavioral_focus"],
        "hr": profile["hr_focus"],
        "dsa": ["algorithms", "data structures", "coding optimization"],
        "system_design": ["distributed systems", "scalability", "architecture trade-offs"],
    }
    focus_areas = focus_map.get(round_type, profile["technical_focus"])

    return f"""You are an expert interviewer conducting a {round_type} interview at {company} for a {role} position.

## {company} Interview DNA
Culture: {profile['culture']}
Interview Style: {profile['interview_style']}
Difficulty Level: {diff}

## Focus Areas for This Round
{chr(10).join(f'- {f}' for f in focus_areas)}

## Role-Specific Context ({role})
{role_ctx}

## Signature {company} Topics
{', '.join(profile['signature_topics'])}

## Rules
1. Ask exactly ONE focused question — no multiple questions at once
2. Make the question authentically feel like a real {company} interview
3. For technical: use {company}-specific terminology and context
4. For behavioral: {"reference specific Leadership Principles" if company == "Amazon" else f"frame around {company}'s culture"}
5. Avoid: {profile.get('avoid', 'generic questions')}
6. Difficulty must match: {diff}
7. Do NOT introduce yourself — just ask the question directly"""


def _build_question_prompt(round_type: str, conversation_history: list, question_num: int, company: str, role: str) -> str:
    topic = _pick_topic(company or "default", round_type, question_num)
    history_text = "\n".join([f"{m['role'].title()}: {m['content']}" for m in conversation_history[-6:]])

    if question_num == 1:
        return f"""Start the interview with a strong opening {round_type} question.
Topic to focus on: {topic}
{"Be direct — no warm-up pleasantries, just ask the question." if company in ["Google","Netflix"] else "You may briefly set context, then ask the question."}"""
    else:
        return f"""Interview so far:
{history_text}

Ask question #{question_num}. 
- Focus on: {topic}
- Build on the conversation — don't repeat previous topics
- If the last answer was weak, probe deeper on the same area
- If strong, advance to a harder aspect"""


# ─── Main Functions ───────────────────────────────────────────────────────────

async def generate_question(
    round_type: str,
    conversation_history: list,
    question_num: int,
    target_company: str = None,
    target_role: str = None,
    difficulty: str = None,
) -> dict:
    if HAS_GEMINI:
        try:
            system = _build_system_prompt(target_company or "", target_role or "SDE", round_type, difficulty)
            prompt = _build_question_prompt(round_type, conversation_history, question_num, target_company or "default", target_role or "SDE")
            text = await generate_text_response(prompt, system_instruction=system)
            return {"question": text.strip(), "source": "gemini", "company": target_company, "round": round_type}
        except Exception as e:
            print(f"[AI Engine] Gemini error: {e}")

    # Company-specific fallback
    co_fallback = COMPANY_FALLBACKS.get(target_company, COMPANY_FALLBACKS["default"])
    questions = co_fallback.get(round_type, co_fallback.get("technical", []))
    if not questions:
        questions = COMPANY_FALLBACKS["default"].get(round_type, ["Tell me about yourself."])
    idx = (question_num - 1) % len(questions)
    return {"question": questions[idx], "source": "fallback", "company": target_company, "round": round_type}


async def score_answer(
    round_type: str,
    question: str,
    answer: str,
    conversation_history: list,
    target_company: str = None,
    target_role: str = None,
) -> dict:
    if HAS_GEMINI:
        try:
            profile = _get_company_profile(target_company) if target_company else None
            company_ctx = f"\n\nEvaluate against {target_company} standards: {profile['interview_style']}" if profile else ""
            lp_note = "\nFor behavioral answers, check if Leadership Principles are explicitly demonstrated with specific results." if target_company == "Amazon" else ""

            prompt = f"""You are a senior interviewer at {target_company or 'a top tech company'} evaluating a candidate for {target_role or 'SDE'}.

Question: {question}
Candidate's Answer: {answer}

Round type: {round_type}{company_ctx}{lp_note}

Score 0-100 and give specific, actionable feedback.
Respond EXACTLY as JSON:
{{"score": <int>, "feedback": "<2-3 sentences>", "strengths": ["<str>", "<str>"], "improvements": ["<str>", "<str>"], "company_fit": "<1 sentence on fit for {target_company or 'this company'}>"}}\""""

            result = await generate_json_response(prompt, system_instruction="You are an expert interview evaluator. Always respond with valid JSON only.")
            result["source"] = "gemini"
            return result
        except Exception as e:
            print(f"[Scoring] Gemini error: {e}")

    return _fallback_score(answer, round_type)


def _fallback_score(answer: str, round_type: str) -> dict:
    words = answer.lower().split()
    score = 30 + min(len(words) // 5, 30)
    kws = {"technical": ["algorithm","system","design","database","api","scalable","complexity"], "behavioral": ["situation","action","result","led","improved","learned","challenge"], "hr": ["team","growth","goal","passionate","experience","skills","motivated"]}
    score += sum(3 for kw in kws.get(round_type, kws["hr"]) if kw in answer.lower())
    score = min(score, 90)
    return {"score": score, "feedback": "Good attempt. Add more specific examples and technical depth.", "strengths": ["Addressed the question"], "improvements": ["Add concrete examples", "Quantify impact"], "source": "fallback"}
