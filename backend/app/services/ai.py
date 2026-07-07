import re
from typing import Any


class AIService:
    @staticmethod
    def analyze_resume(text: str) -> dict[str, Any]:  # noqa: C901
        """
        Analyzes resume text. Abstracted to run rule-based parsing.
        """
        # 1. Parse Candidate Info
        name = AIService._extract_name(text)
        email = AIService._extract_email(text)
        phone = AIService._extract_phone(text)

        sections = AIService._extract_sections(text)

        # Extract items for each section
        skills = sections.get("skills", [])
        education = sections.get("education", [])
        experience = sections.get("experience", [])
        projects = sections.get("projects", [])
        certifications = sections.get("certifications", [])

        # 2. Scoring System
        ats_score = 0
        if skills:
            ats_score += 20
        if experience:
            ats_score += 25
        if education:
            ats_score += 15
        if projects:
            ats_score += 15
        if certifications:
            ats_score += 10
        if name:
            ats_score += 5
        if email:
            ats_score += 5
        if phone:
            ats_score += 5

        # Cap ATS score between 30 and 98 to make it look realistic
        ats_score = max(35, min(ats_score, 98))
        overall_score = round(ats_score / 10.0, 1)

        # 3. Missing Skills Check
        standard_techs = [
            "AWS",
            "Docker",
            "Kubernetes",
            "TypeScript",
            "FastAPI",
            "SQLAlchemy",
            "Redis",
            "PostgreSQL",
            "Next.js",
            "Tailwind CSS",
            "CI/CD",
            "Git",
            "REST APIs",
        ]
        missing_skills = []
        skills_lower = [s.lower() for s in skills]
        text_lower = text.lower()

        for tech in standard_techs:
            tech_lower = tech.lower()
            # If not in extracted skills, and not mentioned in full text
            if not any(tech_lower in s for s in skills_lower) and tech_lower not in text_lower:
                missing_skills.append(tech)

        # Limit to top 4 missing skills
        missing_skills = missing_skills[:4]

        # 4. Suggestions & Feedback
        grammar_suggestions: list[str] = []
        formatting_suggestions: list[str] = []

        # Rule-based suggestions
        if len(text) < 1000:
            formatting_suggestions.append(
                "Your resume is extremely concise. Elaborate on project deliverables and key achievements."
            )
        elif len(text) > 6000:
            formatting_suggestions.append(
                "Resume exceeds standard length. Condense content to focus on high-impact projects."
            )

        # Standard recommendations
        formatting_suggestions.append(
            "Align work experience dates consistently to the right margin for layout balance."
        )

        if not certifications:
            formatting_suggestions.append(
                "Add a dedicated Certifications or Professional Development section to highlight specialized training."
            )

        # Grammar suggestions
        lines = text.split("\n")
        incomplete_bullets = 0
        for line in lines:
            line = line.strip()
            if (line.startswith("•") or line.startswith("-")) and not line.endswith("."):
                incomplete_bullets += 1

        if incomplete_bullets > 2:
            grammar_suggestions.append(
                "Inconsistent punctuation detected on bullet lists. Ensure all bullets end with periods."
            )
        else:
            grammar_suggestions.append(
                "Verify active voice verb usage. Ensure bullet points start with strong action verbs (e.g. Led, Designed, Optimized)."
            )

        # Recruiter Feedback
        if ats_score >= 80:
            recruiter_feedback = (
                "Excellent resume structure. The document is clean, readable, and features a strong alignment "
                "with modern SaaS skill structures. Minor adjustments in formatting will make this candidate profile outstanding."
            )
        elif ats_score >= 60:
            recruiter_feedback = (
                "Solid foundation. You have clearly defined your engineering experience, but the technical section "
                "lacks density. Integrating more tools, infrastructure layers, and metrics-driven outcomes will significantly increase ATS ratings."
            )
        else:
            recruiter_feedback = (
                "Needs revision. Several standard sections (such as Projects or Skills) are either missing or "
                "improperly categorized. Re-structure the document using standard headers and expand on your core technical responsibilities."
            )

        # Improvement Plan
        improvement_plan: list[str] = []
        if not experience:
            improvement_plan.append("Create a Work Experience section detailing roles and timelines.")
        else:
            improvement_plan.append("Rewrite job bullets to use the X-Y-Z formula: Accomplished [X] as measured by [Y], by doing [Z].")

        if missing_skills:
            improvement_plan.append(f"Incorporate missing core skills: {', '.join(missing_skills)}.")

        improvement_plan.append("Ensure consistent typography, margins, and standard PDF layout guidelines.")

        return {
            "candidate_info": {
                "name": name,
                "email": email,
                "phone": phone,
                "skills": skills,
                "education": education,
                "experience": experience,
                "projects": projects,
                "certifications": certifications,
            },
            "ats_score": ats_score,
            "overall_score": overall_score,
            "missing_skills": missing_skills,
            "grammar_suggestions": grammar_suggestions,
            "formatting_suggestions": formatting_suggestions,
            "recruiter_feedback": recruiter_feedback,
            "improvement_plan": improvement_plan,
        }

    @staticmethod
    def _extract_name(text: str) -> str:
        # Grabs first non-empty line as name if it looks like a candidate name (capitalized words)
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:3]:
            # Simple check: 2-3 capitalized words, no numbers/emails
            if re.match(r"^[A-Z][a-zA-Z]*(\s+[A-Z][a-zA-Z]*){1,2}$", line):
                return line
        return "Technical Candidate"

    @staticmethod
    def _extract_email(text: str) -> str:
        match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        return match.group(0) if match else ""

    @staticmethod
    def _extract_phone(text: str) -> str:
        # Standard phone number pattern (matches US formats, international digits, hyphens, spaces)
        match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
        return match.group(0) if match else ""

    @staticmethod
    def _extract_sections(text: str) -> dict[str, list[str]]:  # noqa: C901
        # Define keywords mapping headers to categories
        header_mapping = {
            "skills": ["skills", "technical skills", "technologies", "expertise", "competencies"],
            "education": ["education", "academic", "university", "credentials"],
            "experience": ["experience", "work experience", "employment", "history", "professional experience"],
            "projects": ["projects", "personal projects", "academic projects", "key projects"],
            "certifications": ["certifications", "certs", "licenses", "courses"],
        }

        lines = text.split("\n")
        current_section = None
        extracted: dict[str, list[str]] = {k: [] for k in header_mapping}

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Check if line matches a header
            is_header = False
            for section_key, keywords in header_mapping.items():
                for kw in keywords:
                    # Match headers like "Skills", "Skills & Technologies", case-insensitively
                    if re.match(rf"^{kw}\b", line_str.lower()) or line_str.lower() == kw:
                        current_section = section_key
                        is_header = True
                        break
                if is_header:
                    break

            if is_header:
                continue

            # If inside a section, append the line
            if current_section:
                # If we encounter a bullet or standard list item, clean it up
                cleaned_item = re.sub(r"^[•\-\*]\s*", "", line_str)
                # Keep line items that are not too short
                if len(cleaned_item) > 2:
                    if current_section == "skills" and "," in cleaned_item:
                        parts = [p.strip() for p in cleaned_item.split(",") if p.strip()]
                        extracted[current_section].extend(parts)
                    else:
                        extracted[current_section].append(cleaned_item)

        # Fallback parsing: if skills is empty, scan for comma-separated items
        if not extracted["skills"]:
            skills_keywords = ["python", "javascript", "react", "next.js", "aws", "docker", "postgres", "sql", "fastapi", "typescript"]
            found = []
            for kw in skills_keywords:
                if kw in text.lower():
                    found.append(kw.capitalize() if kw != "next.js" else "Next.js")
            extracted["skills"] = found

        # Trim lists if they grow too large
        for k in extracted:
            extracted[k] = extracted[k][:10]

        return extracted
