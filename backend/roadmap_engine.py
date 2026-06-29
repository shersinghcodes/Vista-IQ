"""AI Roadmap Engine - generates personalized learning plans from user analytics."""

from datetime import datetime, timedelta
import math

# ── CS Topic Database ────────────────────────────────────────────────────────

TOPICS = {
    "dsa": {"name": "Data Structures & Algorithms", "icon": "🧮", "subtopics": ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "DP", "Greedy", "Backtracking", "Sorting", "Binary Search"]},
    "dbms": {"name": "Database Management", "icon": "🗄️", "subtopics": ["SQL Queries", "Normalization", "Indexing", "Transactions", "ACID Properties", "ER Diagrams"]},
    "os": {"name": "Operating Systems", "icon": "💻", "subtopics": ["Process Management", "Threads", "CPU Scheduling", "Memory Management", "Deadlocks", "File Systems"]},
    "cn": {"name": "Computer Networks", "icon": "🌐", "subtopics": ["OSI Model", "TCP/IP", "HTTP/HTTPS", "DNS", "Subnetting", "Socket Programming"]},
    "oops": {"name": "Object-Oriented Programming", "icon": "🏗️", "subtopics": ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "Design Patterns", "SOLID Principles"]},
    "system_design": {"name": "System Design", "icon": "🏛️", "subtopics": ["Scalability", "Load Balancing", "Caching", "Database Design", "Microservices", "API Design"]},
    "aptitude": {"name": "Aptitude & Reasoning", "icon": "🧠", "subtopics": ["Quantitative", "Logical Reasoning", "Verbal", "Data Interpretation"]},
    "communication": {"name": "Communication Skills", "icon": "🗣️", "subtopics": ["Fluency", "Filler Words", "Pacing", "Confidence", "Body Language", "Articulation"]},
    "behavioral": {"name": "Behavioral Interview", "icon": "🤝", "subtopics": ["STAR Method", "Leadership", "Teamwork", "Conflict Resolution", "Self-Awareness"]},
    "web_dev": {"name": "Web Development", "icon": "🌍", "subtopics": ["HTML/CSS", "JavaScript", "React", "Node.js", "REST APIs", "Authentication"]},
}

COMPANY_FOCUS = {
    "Google": {"primary": ["dsa", "system_design", "oops"], "coding_level": "hard", "interview_rounds": 5},
    "Amazon": {"primary": ["dsa", "system_design", "behavioral"], "coding_level": "medium-hard", "interview_rounds": 4},
    "Microsoft": {"primary": ["dsa", "oops", "system_design"], "coding_level": "medium", "interview_rounds": 4},
    "Meta": {"primary": ["dsa", "system_design"], "coding_level": "hard", "interview_rounds": 4},
    "Apple": {"primary": ["dsa", "oops", "system_design"], "coding_level": "medium-hard", "interview_rounds": 4},
    "Startup": {"primary": ["web_dev", "dsa", "system_design"], "coding_level": "medium", "interview_rounds": 3},
    "Product Company": {"primary": ["dsa", "oops", "dbms", "system_design"], "coding_level": "medium", "interview_rounds": 4},
    "Service Company": {"primary": ["dsa", "dbms", "oops", "aptitude"], "coding_level": "easy-medium", "interview_rounds": 3},
}

RESOURCES = {
    "dsa": [
        {"title": "Striver's A2Z DSA Sheet", "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2", "type": "course", "level": "beginner"},
        {"title": "NeetCode 150", "url": "https://neetcode.io/practice", "type": "practice", "level": "intermediate"},
        {"title": "Abdul Bari - Algorithms", "url": "https://youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O", "type": "video", "level": "beginner"},
    ],
    "dbms": [
        {"title": "Gate Smashers - DBMS", "url": "https://youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y", "type": "video", "level": "beginner"},
        {"title": "SQLZoo Practice", "url": "https://sqlzoo.net/", "type": "practice", "level": "beginner"},
    ],
    "os": [
        {"title": "Gate Smashers - OS", "url": "https://youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p", "type": "video", "level": "beginner"},
        {"title": "Neso Academy - OS", "url": "https://youtube.com/playlist?list=PLBlnK6fEyqRiVhbXDGLXDk_OQAdc0cPfE", "type": "video", "level": "intermediate"},
    ],
    "cn": [
        {"title": "Computer Networks - Kunal Kushwaha", "url": "https://youtube.com/watch?v=IPvYjXCsTg8", "type": "video", "level": "beginner"},
    ],
    "oops": [
        {"title": "OOP Concepts - freeCodeCamp", "url": "https://youtube.com/watch?v=SiBw7os-_zI", "type": "video", "level": "beginner"},
    ],
    "system_design": [
        {"title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "type": "article", "level": "intermediate"},
        {"title": "Gaurav Sen - System Design", "url": "https://youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX", "type": "video", "level": "intermediate"},
    ],
    "communication": [
        {"title": "Interview Communication Tips", "url": "https://youtube.com/watch?v=HG68Ymazo18", "type": "video", "level": "beginner"},
    ],
    "behavioral": [
        {"title": "STAR Method Guide", "url": "https://youtube.com/watch?v=0nN7Q7DrI6Q", "type": "video", "level": "beginner"},
    ],
}


def analyze_weaknesses(user_data: dict) -> list[dict]:
    """Analyze user data from all modules to detect weak areas."""
    weaknesses = []

    # From coding analytics
    coding = user_data.get("coding", {})
    total_problems = coding.get("total_problems", 0)
    solved = coding.get("problems_solved", 0)
    if total_problems > 0 and solved / total_problems < 0.3:
        weaknesses.append({"topic": "dsa", "score": round(solved / total_problems * 100), "reason": f"Only {solved}/{total_problems} coding problems solved", "priority": "critical"})
    elif total_problems > 0:
        weaknesses.append({"topic": "dsa", "score": round(solved / total_problems * 100), "reason": f"{solved}/{total_problems} solved", "priority": "medium" if solved / total_problems < 0.6 else "low"})

    easy = coding.get("easy", {})
    medium = coding.get("medium", {})
    hard = coding.get("hard", {})
    if medium.get("total", 0) > 0 and medium.get("solved", 0) == 0:
        weaknesses.append({"topic": "dsa", "subtopic": "Medium Problems", "score": 0, "reason": "No medium difficulty problems solved", "priority": "high"})
    if hard.get("total", 0) > 0 and hard.get("solved", 0) == 0:
        weaknesses.append({"topic": "dsa", "subtopic": "Hard Problems", "score": 0, "reason": "No hard difficulty problems solved", "priority": "high"})

    # From resume analysis
    resume = user_data.get("resume", {})
    ats_score = resume.get("ats_score", 0)
    if ats_score > 0 and ats_score < 60:
        weaknesses.append({"topic": "resume", "score": ats_score, "reason": f"ATS score is {ats_score}/100", "priority": "high"})
    skills_count = len(resume.get("skills", []))
    if 0 < skills_count < 5:
        weaknesses.append({"topic": "web_dev", "score": skills_count * 10, "reason": f"Only {skills_count} skills detected on resume", "priority": "medium"})

    # From interview performance
    interviews = user_data.get("interviews", [])
    if interviews:
        avg_score = sum(i.get("score", 0) for i in interviews) / len(interviews)
        if avg_score < 50:
            weaknesses.append({"topic": "communication", "score": round(avg_score), "reason": f"Average interview score: {round(avg_score)}%", "priority": "critical"})
            weaknesses.append({"topic": "behavioral", "score": round(avg_score), "reason": "Low interview performance", "priority": "high"})

    # Default weaknesses if no data
    if not weaknesses:
        weaknesses = [
            {"topic": "dsa", "score": 20, "reason": "No coding practice data - start practicing!", "priority": "critical"},
            {"topic": "oops", "score": 30, "reason": "No assessment data available", "priority": "high"},
            {"topic": "dbms", "score": 30, "reason": "No assessment data available", "priority": "high"},
            {"topic": "os", "score": 30, "reason": "No assessment data available", "priority": "medium"},
            {"topic": "cn", "score": 30, "reason": "No assessment data available", "priority": "medium"},
            {"topic": "system_design", "score": 10, "reason": "No assessment data available", "priority": "high"},
            {"topic": "communication", "score": 40, "reason": "No speech analysis data", "priority": "medium"},
        ]

    return weaknesses


import json
from backend.gemini_service import HAS_GEMINI, generate_json_response

async def generate_roadmap(user_data: dict, target_company: str = "Product Company", target_role: str = "SDE", weeks: int = 8) -> dict:
    """Generate a personalized preparation roadmap using Gemini or fallback to static generation."""
    weaknesses = analyze_weaknesses(user_data)
    company = COMPANY_FOCUS.get(target_company, COMPANY_FOCUS["Product Company"])
    priority_topics = company["primary"]

    if HAS_GEMINI:
        try:
            prompt = f"""Generate a highly personalized {weeks}-week interview preparation roadmap for a {target_role} role at {target_company}.
            
User Weaknesses & Analytics:
{json.dumps(weaknesses, indent=2)}

Company Focus Areas:
{json.dumps(priority_topics)}

Respond in valid JSON format matching this EXACT structure:
{{
  "weekly_plan": [
    {{
      "week": 1,
      "phase": "Foundation",
      "focus_topics": [{{"key": "dsa", "name": "Data Structures", "icon": "🧮"}}],
      "daily_tasks": [
        {{
          "day": 1,
          "day_label": "Mon",
          "tasks": [
            {{"type": "study", "title": "Topic name", "duration": "45 min", "topic": "dsa"}}
          ]
        }}
      ],
      "goals": ["Goal 1", "Goal 2"],
      "coding_target": 15
    }}
  ],
  "milestones": [
    {{"week": 1, "title": "Milestone title", "desc": "Milestone description"}}
  ]
}}"""
            system_instruction = "You are an expert career coach generating a technical interview preparation roadmap. Always respond with valid JSON matching the requested schema."
            
            result = await generate_json_response(prompt, system_instruction=system_instruction)
            
            # Gather static resources
            rec_resources = []
            seen_urls = set()
            for w in weaknesses[:5]:
                t = w["topic"]
                if t in RESOURCES:
                    for r in RESOURCES[t]:
                        if r["url"] not in seen_urls:
                            seen_urls.add(r["url"])
                            rec_resources.append({**r, "topic": t, "topic_name": TOPICS.get(t, {}).get("name", t), "reason": w["reason"]})

            scores = [w["score"] for w in weaknesses]
            readiness = round(sum(scores) / max(len(scores), 1)) if scores else 0
            
            return {
                "target_company": target_company,
                "target_role": target_role,
                "total_weeks": weeks,
                "readiness_score": readiness,
                "weaknesses": weaknesses,
                "weekly_plan": result.get("weekly_plan", []),
                "resources": rec_resources[:12],
                "company_info": company,
                "milestones": result.get("milestones", []),
                "generated_at": datetime.utcnow().isoformat(),
                "source": "gemini"
            }
        except Exception as e:
            pass # Fall through to fallback
            
    return _fallback_generate_roadmap(user_data, target_company, target_role, weeks, weaknesses, company, priority_topics)


def _fallback_generate_roadmap(user_data: dict, target_company: str, target_role: str, weeks: int, weaknesses: list, company: dict, priority_topics: list) -> dict:
    """Generate a personalized preparation roadmap (Static Fallback)."""
    # Sort weaknesses by priority
    prio_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    weaknesses.sort(key=lambda w: prio_order.get(w["priority"], 3))

    # Build weekly plan
    weekly_plan = []
    topic_pool = list(set([w["topic"] for w in weaknesses if w["topic"] in TOPICS]))
    # Add company focus topics
    for t in priority_topics:
        if t not in topic_pool:
            topic_pool.append(t)

    for week_num in range(1, weeks + 1):
        phase = "Foundation" if week_num <= 2 else "Core Practice" if week_num <= 5 else "Advanced & Review" if week_num <= 7 else "Mock & Final Prep"
        focus_topics = []
        daily_tasks = []

        # Assign topics per week based on phase
        if week_num <= 2:
            focus_topics = [t for t in topic_pool if t in ["dsa", "oops", "dbms"]][:2]
            if not focus_topics:
                focus_topics = ["dsa"]
        elif week_num <= 5:
            idx = (week_num - 3) % len(topic_pool)
            focus_topics = [topic_pool[idx]]
            if "dsa" not in focus_topics:
                focus_topics.append("dsa")
        elif week_num <= 7:
            focus_topics = [t for t in priority_topics[:2]]
            if "system_design" not in focus_topics and week_num == 7:
                focus_topics.append("system_design")
        else:
            focus_topics = ["behavioral", "communication"]

        # Generate 7 daily tasks
        for day in range(1, 8):
            topic_key = focus_topics[day % len(focus_topics)] if focus_topics else "dsa"
            topic_info = TOPICS.get(topic_key, TOPICS["dsa"])
            subtopic = topic_info["subtopics"][(week_num * 7 + day) % len(topic_info["subtopics"])]

            if day <= 5:  # Weekdays
                tasks = [
                    {"type": "study", "title": f"Study: {subtopic}", "duration": "45 min", "topic": topic_key},
                    {"type": "practice", "title": f"Solve 2-3 {topic_info['name']} problems", "duration": "60 min", "topic": topic_key},
                ]
                if day % 2 == 0:
                    tasks.append({"type": "revision", "title": "Revise previous day's topics", "duration": "20 min", "topic": topic_key})
            else:  # Weekend
                tasks = [
                    {"type": "practice", "title": f"Weekly coding contest / {subtopic} deep dive", "duration": "90 min", "topic": topic_key},
                    {"type": "review", "title": "Review week's progress & weak areas", "duration": "30 min", "topic": topic_key},
                ]

            daily_tasks.append({"day": day, "day_label": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day - 1], "tasks": tasks})

        weekly_plan.append({
            "week": week_num,
            "phase": phase,
            "focus_topics": [{"key": t, **TOPICS[t]} for t in focus_topics if t in TOPICS],
            "daily_tasks": daily_tasks,
            "goals": _week_goals(week_num, focus_topics, phase),
            "coding_target": max(10, 20 - week_num) if week_num <= 5 else 15,
        })

    # Collect resources
    rec_resources = []
    seen_urls = set()
    for w in weaknesses[:5]:
        t = w["topic"]
        if t in RESOURCES:
            for r in RESOURCES[t]:
                if r["url"] not in seen_urls:
                    seen_urls.add(r["url"])
                    rec_resources.append({**r, "topic": t, "topic_name": TOPICS.get(t, {}).get("name", t), "reason": w["reason"]})

    # Readiness score
    scores = [w["score"] for w in weaknesses]
    readiness = round(sum(scores) / max(len(scores), 1)) if scores else 0

    return {
        "target_company": target_company,
        "target_role": target_role,
        "total_weeks": weeks,
        "readiness_score": readiness,
        "weaknesses": weaknesses,
        "weekly_plan": weekly_plan,
        "resources": rec_resources[:12],
        "company_info": company,
        "milestones": _milestones(weeks),
        "generated_at": datetime.utcnow().isoformat(),
        "source": "fallback"
    }


def _week_goals(week: int, topics: list, phase: str) -> list[str]:
    goals = {
        "Foundation": ["Complete fundamentals of core CS subjects", "Solve 15+ easy coding problems", "Set up consistent study routine"],
        "Core Practice": ["Solve 15+ medium problems", "Complete topic-wise revision", "Practice explaining solutions aloud"],
        "Advanced & Review": ["Attempt hard problems", "Do 2 mock interviews", "Review all weak topics"],
        "Mock & Final Prep": ["Full mock interview practice", "Company-specific preparation", "Review behavioral questions"],
    }
    return goals.get(phase, ["Continue daily practice"])


def _milestones(weeks: int) -> list[dict]:
    return [
        {"week": 1, "title": "Foundation Set", "desc": "Core concepts reviewed, study plan active"},
        {"week": max(2, weeks // 4), "title": "First Checkpoint", "desc": "50+ problems solved, basics strong"},
        {"week": max(4, weeks // 2), "title": "Mid-Point Review", "desc": "100+ problems, mock interviews started"},
        {"week": max(6, weeks * 3 // 4), "title": "Advanced Ready", "desc": "Hard problems attempted, system design covered"},
        {"week": weeks, "title": "Interview Ready", "desc": "Full preparation complete, confident & prepared"},
    ]
