import asyncio
from collections.abc import AsyncGenerator
from typing import Any

from app.core.ai.providers.base import BaseAIProvider


class MockProvider(BaseAIProvider):
    """
    Mock AI Provider returning deterministic, realistic data for development.
    Simulates streaming latency and generates valid structured JSON schemas.
    """

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> str:
        prompt_lower = prompt.lower()
        if "follow-up" in prompt_lower or "followup" in prompt_lower:
            return "How would you handle split-brain scenarios in that Redis cluster setup?"
        elif "interview" in prompt_lower:
            return (
                "Here is your next interview question: 'Explain how you would design a "
                "distributed lock manager using Redis. What are the potential failure modes?'"
            )
        elif "code" in prompt_lower:
            return (
                "Coding Review:\n- Time Complexity: O(N) is optimal.\n"
                "- Space Complexity: O(1) can be achieved by using pointer swapping.\n"
                "- Suggestions: Handle empty list boundaries first."
            )
        else:
            return "InterviewX AI Mock Provider response. Centralized engine operational."

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncGenerator[str, None]:
        response = await self.generate(prompt, system_prompt, history)
        # Split response into words and stream them with delay to simulate latency
        words = response.split(" ")
        for i, word in enumerate(words):
            yield (word + " " if i < len(words) - 1 else word)
            await asyncio.sleep(0.02)

    async def generate_json(  # noqa: C901
        self,
        prompt: str,
        schema: dict[str, Any],
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        prompt_lower = prompt.lower()

        # 1. Feedback Generation Mock Schema
        if "feedback" in prompt_lower or "transcript" in prompt_lower or "evaluator" in prompt_lower:
            return {
                "overall_score": 8.2,
                "technical_score": 8.0,
                "communication_score": 8.5,
                "confidence_score": 8.0,
                "grammar_score": 8.5,
                "strengths": [
                    "Strong STAR method structuring of behavioral answers.",
                    "Good deep dive into async DB connection pooling parameters."
                ],
                "weaknesses": [
                    "System scaling latency bounds could be more quantitative.",
                    "Slightly abstract overview of horizontal replica synchronization times."
                ],
                "improvement_plan": [
                    "Formulate architectural metrics using specific milliseconds indexes.",
                    "Review zero-downtime database migration constraints."
                ],
                "learning_roadmap": [
                    "Milestone 1: Read database replica lag synchronization structures.",
                    "Milestone 2: Practice horizontal partitioning models."
                ],
                "suggested_answers": {
                    "1": "A suggested response should explicitly mention aiosqlite pool sizes...",
                    "2": "For write replica lag, mention consistent hashing layouts..."
                }
            }

        # 2. Resume Analysis Mock Schema
        elif "resume" in prompt_lower or "candidate" in prompt_lower:
            return {
                "candidate_info": {
                    "name": "Raj Aryan",
                    "email": "raj@example.com",
                    "phone": "123-456-7890",
                    "skills": ["Python", "FastAPI", "Docker", "AWS", "React", "TypeScript"],
                    "education": ["Bachelor of Science in Computer Science"],
                    "experience": ["Lead System Architect at SaaS Corp"],
                    "projects": ["Real-time API loops, caching layouts"],
                    "certifications": ["AWS Certified Solutions Architect"],
                },
                "ats_score": 88,
                "overall_score": 8.8,
                "missing_skills": ["Kubernetes", "Redis", "SQLAlchemy", "PostgreSQL"],
                "grammar_suggestions": [
                    "Ensure active voice verb usage (e.g. Led, Optimized).",
                    "Verify trailing period punctuation consistency across bullets.",
                ],
                "formatting_suggestions": [
                    "Align experience timelines uniformly to the right margin.",
                    "Optimize margins to keep the content to a standard 1-page count.",
                ],
                "recruiter_feedback": (
                    "Strong background in SaaS backend architecture. Core skills align "
                    "well with distributed systems expectations. Standard optimizations "
                    "will raise ATS index rankings."
                ),
                "improvement_plan": [
                    "Rewrite project metrics to emphasize quantitative outcomes.",
                    "Integrate Redis/caching configuration parameters in experience summaries.",
                    "Incorporate Kubernetes cluster management indicators.",
                ],
            }

        # 2. Coding Review Mock Schema
        elif "code" in prompt_lower or "review" in prompt_lower:
            return {
                "verdict": "Minor Optimizations Suggested",
                "time_complexity": "O(N)",
                "space_complexity": "O(N)",
                "suggestions": [
                    "Swap standard list usage for generator expressions to optimize memory.",
                    "Handle boundaries where the list argument might be None.",
                ],
                "improved_code": "def solve(items):\n    if not items:\n        return\n    yield from items",
            }

        # 3. Question Generation Mock Schema
        elif "question" in prompt_lower:
            import re
            match = re.search(r"generate (\d+)", prompt_lower)
            count = int(match.group(1)) if match else 5

            pool = [
                {"question_text": "How do you handle connection pooling issues in async DB engines?", "topic": "Database"},
                {"question_text": "Explain a scenario where write replica lag caused data inconsistency.", "topic": "Replication"},
                {"question_text": "How would you design a distributed lock manager using Redis?", "topic": "Caching"},
                {"question_text": "Explain vertical vs horizontal scaling trade-offs.", "topic": "Scaling"},
                {"question_text": "Describe the STAR method steps you would use for a behavioral issue.", "topic": "Behavioral"},
                {"question_text": "Explain the difference between optimistic and pessimistic locking.", "topic": "Concurrency"},
                {"question_text": "What is the role of an API gateway in microservices architectures?", "topic": "Microservices"},
                {"question_text": "How do you manage database schema upgrades in zero-downtime environments?", "topic": "Migrations"},
                {"question_text": "How does HTTPS establish a secure session context?", "topic": "Security"},
                {"question_text": "Explain the CAP theorem trade-offs.", "topic": "System Design"}
            ]

            selected = pool[:count]
            return {
                "role": "Staff Backend Engineer",
                "questions": selected
            }



        # Generic Schema fallback matching structure parameters
        fallback: dict[str, Any] = {}
        for key, value in schema.get("properties", {}).items():
            prop_type = value.get("type")
            if prop_type == "string":
                fallback[key] = "Mock String Output"
            elif prop_type == "integer":
                fallback[key] = 80
            elif prop_type == "number":
                fallback[key] = 8.0
            elif prop_type == "array":
                fallback[key] = ["Item A", "Item B"]
            elif prop_type == "object":
                fallback[key] = {"nested_key": "nested_value"}
            else:
                fallback[key] = None

        return fallback
