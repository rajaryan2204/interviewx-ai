from typing import Any


class PromptTemplates:
    """
    Registry of reusable prompt templates for core SaaS capabilities.
    """

    TEMPLATES: dict[str, str] = {
        "resume_analysis": (
            "You are an expert technical recruiter and resume auditor. "
            "Analyze the following resume text:\n"
            "--- START RESUME ---\n"
            "{resume_text}\n"
            "--- END RESUME ---\n\n"
            "Extract candidate contact details and evaluate the profile. "
            "Identify missing skills relevant to modern engineering frameworks, "
            "recommend layout formatting improvements, note grammar errors, and generate "
            "an actionable improvement plan."
        ),
        "mock_interview": (
            "You are a technical interviewer conducting a mock run for the role: {role}.\n"
            "Topic of evaluation: {topic}.\n"
            "Current conversation history:\n"
            "{chat_history}\n\n"
            "The candidate replied: '{candidate_response}'.\n\n"
            "Provide a brief evaluation of their response, and ask the next logical "
            "interview question to continue the loop."
        ),
        "coding_review": (
            "You are a Senior Staff Engineer. Review the following code content:\n"
            "```\n"
            "{code_content}\n"
            "```\n"
            "Target language: {language}.\n\n"
            "Identify architectural bugs, time/space complexity profiles, edge-case failures, "
            "and suggest optimized code modifications."
        ),
        "career_guidance": (
            "You are a career development coach. Provide career guidance and a target roadmap "
            "for a candidate aiming to transition into the role: {target_role}.\n"
            "Current professional profile and skills:\n"
            "{current_profile}\n\n"
            "Detail the gap areas, suggested certifications, and study resources."
        ),
        "feedback_generation": (
            "You are a Lead Evaluator. Generate a comprehensive performance feedback summary "
            "based on the following interview transcript:\n"
            "--- TRANSCRIPT ---\n"
            "{interview_transcript}\n"
            "--- END TRANSCRIPT ---\n\n"
            "Constructively rate communication, coding capabilities, system architecture mapping, "
            "and highlight overall recommendations."
        ),
        "question_generation": (
            "You are a Principal Architect compiling a question pool database.\n"
            "Generate {count} technical interview questions for the role: {role}.\n"
            "Difficulty level: {level}.\n"
            "Focus topics: {topics}."
        ),
        "coding_ai_review": (
            "You are a Senior Staff Engineer conducting a code review for a coding interview.\n"
            "The candidate solved the following problem:\n"
            "Problem: {problem_title} ({difficulty})\n"
            "Category: {category}\n\n"
            "Their {language} solution:\n"
            "```{language}\n"
            "{code}\n"
            "```\n\n"
            "Execution result: {verdict} ({passed_tests}/{total_tests} test cases passed)\n\n"
            "Provide a comprehensive code review with:\n"
            "1. quality_score (0-100): an overall code quality score\n"
            "2. time_complexity: Big-O notation (e.g. O(n log n))\n"
            "3. space_complexity: Big-O notation (e.g. O(n))\n"
            "4. bugs: list of objects with keys 'severity' (critical/major/minor), 'description', 'line_hint'\n"
            "5. suggestions: list of specific optimization and refactoring suggestions\n"
            "6. best_practices: list of best practice notes (naming, readability, error handling)\n"
            "7. interview_notes: a short paragraph on how this solution would be perceived in a real interview"
        ),
    }


class PromptBuilder:
    """
    Helper builder class to compile variables into prompt templates.
    """

    @staticmethod
    def compile(template_name: str, **kwargs: Any) -> str:
        if template_name not in PromptTemplates.TEMPLATES:
            raise KeyError(f"Prompt template '{template_name}' not registered in registry.")

        template = PromptTemplates.TEMPLATES[template_name]
        try:
            return template.format(**kwargs)
        except KeyError as e:
            raise ValueError(
                f"Missing required parameter '{str(e)}' to compile prompt template '{template_name}'."
            )
