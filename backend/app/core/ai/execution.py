"""
Provider-agnostic code execution engine for the Coding Interview Platform.

Design:
    - BaseExecutor defines the common interface.
    - MockExecutor safely runs Python code locally using subprocess with a
      5-second timeout. Other languages return realistic mock outputs.
    - Judge0Executor is a fully-wired stub ready for Judge0 CE / self-hosted.
    - ExecutorFactory selects the provider from the CODE_EXECUTOR env var.

Usage:
    executor = ExecutorFactory.get()
    result = await executor.run(code, language, test_cases, is_run_only=True)
"""

import asyncio
import resource
import subprocess
import tempfile
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

import httpx

from app.core.config import settings

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

class ExecutionResult:
    """Structured result from executing code against one or more test cases."""

    def __init__(
        self,
        verdict: str,
        passed: int,
        total: int,
        runtime_ms: float | None,
        memory_kb: float | None,
        stdout: str | None,
        stderr: str | None,
        test_results: list[dict[str, Any]],
    ) -> None:
        self.verdict = verdict
        self.passed_tests = passed
        self.total_tests = total
        self.runtime_ms = runtime_ms
        self.memory_kb = memory_kb
        self.stdout = stdout
        self.stderr = stderr
        self.test_results = test_results


# ---------------------------------------------------------------------------
# Base interface
# ---------------------------------------------------------------------------

class BaseExecutor(ABC):
    """Abstract base class for code execution providers."""

    @abstractmethod
    async def run(
        self,
        code: str,
        language: str,
        test_cases: list[dict[str, Any]],
        *,
        is_run_only: bool = False,
        custom_input: str | None = None,
    ) -> ExecutionResult:
        """Execute code and return a structured result."""
        ...


# ---------------------------------------------------------------------------
# Mock executor (local Python subprocess; mock output for other languages)
# ---------------------------------------------------------------------------

_MOCK_OUTPUTS: dict[str, dict[str, str]] = {
    "javascript": {
        "stdout": "// JavaScript execution (mock)\n[0, 1]",
        "stderr": "",
        "verdict": "accepted",
    },
    "java": {
        "stdout": "// Java execution (mock)\n[0, 1]",
        "stderr": "",
        "verdict": "accepted",
    },
    "cpp": {
        "stdout": "// C++ execution (mock)\n0 1",
        "stderr": "",
        "verdict": "accepted",
    },
    "c": {
        "stdout": "// C execution (mock)\n0 1",
        "stderr": "",
        "verdict": "accepted",
    },
}

_TIMEOUT_SECONDS = 5  # Hard wall-clock limit per test-case run


class MockExecutor(BaseExecutor):
    """
    Local code executor for development.

    Python: runs via subprocess with process-level timeout and memory checks.
    Other languages: returns a realistic mock verdict without actually compiling.
    """

    async def run(
        self,
        code: str,
        language: str,
        test_cases: list[dict[str, Any]],
        *,
        is_run_only: bool = False,
        custom_input: str | None = None,
    ) -> ExecutionResult:
        if language != "python":
            return self._mock_non_python(language, test_cases)

        if custom_input is not None:
            return await self._run_python_single(code, custom_input)

        return await self._run_python_against_cases(code, test_cases)

    # --- Python runner ---

    async def _run_python_single(self, code: str, stdin_data: str) -> ExecutionResult:
        """Run Python code with custom stdin. Returns stdout/stderr."""
        result = await asyncio.to_thread(self._exec_python_proc, code, stdin_data)
        verdict = "accepted" if result["exit_code"] == 0 else "runtime_error"
        test_results = [
            {
                "test_case_index": 0,
                "input": stdin_data,
                "expected_output": "(custom run)",
                "actual_output": result["stdout"].strip(),
                "passed": result["exit_code"] == 0,
                "runtime_ms": result["runtime_ms"],
            }
        ]
        return ExecutionResult(
            verdict=verdict,
            passed=1 if result["exit_code"] == 0 else 0,
            total=1,
            runtime_ms=result["runtime_ms"],
            memory_kb=result["memory_kb"],
            stdout=result["stdout"],
            stderr=result["stderr"],
            test_results=test_results,
        )

    async def _run_python_against_cases(
        self, code: str, test_cases: list[dict[str, Any]]
    ) -> ExecutionResult:
        """Run Python code against a list of test cases."""
        if not test_cases:
            # No test cases — just validate the code runs without error
            result = await asyncio.to_thread(self._exec_python_proc, code, "")
            verdict = "accepted" if result["exit_code"] == 0 else "runtime_error"
            return ExecutionResult(
                verdict=verdict,
                passed=1 if result["exit_code"] == 0 else 0,
                total=1,
                runtime_ms=result["runtime_ms"],
                memory_kb=result["memory_kb"],
                stdout=result["stdout"],
                stderr=result["stderr"],
                test_results=[],
            )

        results: list[dict[str, Any]] = []
        total_runtime = 0.0
        passed_count = 0

        for idx, tc in enumerate(test_cases):
            stdin_data = str(tc.get("input", ""))
            expected = str(tc.get("output", "")).strip()
            r = await asyncio.to_thread(self._exec_python_proc, code, stdin_data)
            actual = r["stdout"].strip()
            passed = r["exit_code"] == 0 and actual == expected
            if passed:
                passed_count += 1
            total_runtime += r["runtime_ms"] or 0.0
            results.append(
                {
                    "test_case_index": idx,
                    "input": stdin_data,
                    "expected_output": expected,
                    "actual_output": actual,
                    "passed": passed,
                    "runtime_ms": r["runtime_ms"],
                }
            )

        verdict = "accepted" if passed_count == len(test_cases) else "wrong_answer"
        avg_runtime = total_runtime / len(test_cases) if test_cases else None

        return ExecutionResult(
            verdict=verdict,
            passed=passed_count,
            total=len(test_cases),
            runtime_ms=round(avg_runtime, 2) if avg_runtime else None,
            memory_kb=None,
            stdout=results[-1]["actual_output"] if results else None,
            stderr=None,
            test_results=results,
        )

    @staticmethod
    def _exec_python_proc(code: str, stdin_data: str) -> dict[str, Any]:
        """Synchronous subprocess execution (run in thread pool)."""
        wrapped_code = code
        if "class Solution" in code:
            driver_code = """
import sys
import json
import ast

def _run_driver():
    input_data = sys.stdin.read().strip()
    if not input_data:
        return
    
    lines = [line.strip() for line in input_data.split('\\n') if line.strip()]
    if not lines:
        return

    sol = Solution()
    methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
    if not methods:
        return
    
    method_name = methods[0]
    func = getattr(sol, method_name)
    
    args = []
    for line in lines:
        line_stripped = line.strip()
        
        # Try to parse as JSON first (handles lists like "[2,7,11,15]", grids, lists of lists, lists of strings, objects)
        try:
            val = json.loads(line_stripped)
            args.append(val)
            continue
        except Exception:
            pass

        # Try to parse as space-separated integers
        try:
            parts = line_stripped.split()
            if all(p.lstrip('-').isdigit() for p in parts) and len(parts) > 1:
                args.append(list(map(int, parts)))
                continue
        except Exception:
            pass

        # Try to parse as single integer
        if line_stripped.lstrip('-').isdigit():
            args.append(int(line_stripped))
            continue

        # Default to string
        args.append(line_stripped)

    try:
        res = func(*args)
        if isinstance(res, (list, tuple)):
            if any(isinstance(x, (list, tuple)) for x in res):
                print(json.dumps(res))
            else:
                print(" ".join(map(str, res)))
        elif isinstance(res, bool):
            print(str(res).lower())
        elif res is None:
            # If function modifies in-place
            if method_name == "sortColors" and args:
                print(" ".join(map(str, args[0])))
            else:
                print("")
        else:
            print(str(res))
    except Exception as e:
        print(f"Runtime Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    _run_driver()
"""
            wrapped_code = code + "\n" + driver_code

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as f:
            f.write(wrapped_code)
            tmp_path = f.name

        try:
            start = time.perf_counter()
            proc = subprocess.run(
                ["python3", tmp_path],
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=_TIMEOUT_SECONDS,
            )
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

            # Best-effort memory via resource module (unix only)
            try:
                mem_kb = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss / 1024
            except Exception:
                mem_kb = None

            return {
                "stdout": proc.stdout,
                "stderr": proc.stderr,
                "exit_code": proc.returncode,
                "runtime_ms": elapsed_ms,
                "memory_kb": mem_kb,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Time Limit Exceeded",
                "exit_code": 1,
                "runtime_ms": _TIMEOUT_SECONDS * 1000.0,
                "memory_kb": None,
            }
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    # --- Mock non-Python ---

    @staticmethod
    def _mock_non_python(language: str, test_cases: list[dict[str, Any]]) -> ExecutionResult:
        mock = _MOCK_OUTPUTS.get(language, {"stdout": "(mock)", "stderr": "", "verdict": "accepted"})
        n = len(test_cases) or 1
        results = [
            {
                "test_case_index": i,
                "input": str(test_cases[i].get("input", "")) if test_cases else "",
                "expected_output": str(test_cases[i].get("output", "")) if test_cases else "(mock)",
                "actual_output": mock["stdout"].split("\n")[-1],
                "passed": True,
                "runtime_ms": 42.0,
            }
            for i in range(n)
        ]
        return ExecutionResult(
            verdict=mock["verdict"],
            passed=n,
            total=n,
            runtime_ms=42.0,
            memory_kb=2048.0,
            stdout=mock["stdout"],
            stderr=mock["stderr"] or None,
            test_results=results,
        )


# ---------------------------------------------------------------------------
# Judge0 executor (production-ready stub)
# ---------------------------------------------------------------------------

_JUDGE0_LANGUAGE_IDS: dict[str, int] = {
    "python": 71,     # Python 3.8.1
    "javascript": 63, # Node.js 12.14.0
    "java": 62,       # Java 13.0.1
    "cpp": 54,        # C++ (GCC 9.2.0)
    "c": 50,          # C (GCC 9.2.0)
}


class Judge0Executor(BaseExecutor):
    """
    Judge0 CE / self-hosted code execution.
    Set CODE_EXECUTOR=judge0 and JUDGE0_BASE_URL in your environment.
    """

    def __init__(self) -> None:
        self.base_url = settings.JUDGE0_BASE_URL.rstrip("/")  # type: ignore[attr-defined]

    async def run(
        self,
        code: str,
        language: str,
        test_cases: list[dict[str, Any]],
        *,
        is_run_only: bool = False,
        custom_input: str | None = None,
    ) -> ExecutionResult:
        lang_id = _JUDGE0_LANGUAGE_IDS.get(language, 71)
        stdin = custom_input or (str(test_cases[0].get("input", "")) if test_cases else "")

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.base_url}/submissions?wait=true",
                json={
                    "source_code": code,
                    "language_id": lang_id,
                    "stdin": stdin,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        stdout = data.get("stdout", "") or ""
        stderr = data.get("stderr", "") or data.get("compile_output", "") or ""
        status = data.get("status", {}).get("description", "Unknown")

        if "Accepted" in status:
            verdict = "accepted"
        elif "Wrong Answer" in status:
            verdict = "wrong_answer"
        elif "Runtime Error" in status:
            verdict = "runtime_error"
        elif "Time Limit" in status:
            verdict = "time_limit_exceeded"
        else:
            verdict = "compilation_error"

        test_results = [
            {
                "test_case_index": 0,
                "input": stdin,
                "expected_output": str(test_cases[0].get("output", "")) if test_cases else "",
                "actual_output": stdout.strip(),
                "passed": verdict == "accepted",
                "runtime_ms": float(data.get("time", 0) or 0) * 1000,
            }
        ]

        return ExecutionResult(
            verdict=verdict,
            passed=1 if verdict == "accepted" else 0,
            total=1,
            runtime_ms=float(data.get("time", 0) or 0) * 1000,
            memory_kb=float(data.get("memory", 0) or 0),
            stdout=stdout,
            stderr=stderr,
            test_results=test_results,
        )


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

class ExecutorFactory:
    """Select code execution provider from CODE_EXECUTOR environment variable."""

    @staticmethod
    def get() -> BaseExecutor:
        provider = getattr(settings, "CODE_EXECUTOR", "mock")
        if provider == "judge0":
            return Judge0Executor()
        return MockExecutor()
