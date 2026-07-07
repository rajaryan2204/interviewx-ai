"""
Seed script: inserts 20 high-quality coding questions into the database.

Run: python -m app.core.ai.seed_questions
"""

import asyncio
from typing import Any

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.coding import CodingQuestion

# ---------------------------------------------------------------------------
# Default code stubs for each language
# ---------------------------------------------------------------------------

def _stubs(fn_sig_py: str, fn_sig_js: str, fn_sig_java: str, fn_sig_cpp: str) -> dict[str, str]:
    return {
        "python": fn_sig_py,
        "javascript": fn_sig_js,
        "java": fn_sig_java,
        "cpp": fn_sig_cpp,
        "c": "// C solution\n#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}",
    }


QUESTIONS: list[dict[str, Any]] = [
    # 1 — Arrays
    {
        "title": "Two Sum",
        "slug": "two-sum",
        "description": (
            "Given an array of integers `nums` and an integer `target`, "
            "return *indices* of the two numbers such that they add up to `target`.\n\n"
            "You may assume that each input would have **exactly one** solution, "
            "and you may not use the same element twice.\n\n"
            "You can return the answer in any order."
        ),
        "difficulty": "easy",
        "category": "Arrays",
        "tags": ["array", "hash-map"],
        "constraints": [
            "2 ≤ nums.length ≤ 10⁴",
            "-10⁹ ≤ nums[i] ≤ 10⁹",
            "-10⁹ ≤ target ≤ 10⁹",
            "Only one valid answer exists.",
        ],
        "examples": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] = 9"},
            {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass",
            "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};",
            "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
            "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
        ),
        "test_cases_public": [
            {"input": "2 7 11 15\n9", "output": "0 1"},
            {"input": "3 2 4\n6", "output": "1 2"},
        ],
        "test_cases_hidden": [
            {"input": "3 3\n6", "output": "0 1"},
            {"input": "0 4 3 0\n0", "output": "0 3"},
        ],
        "hints": ["Use a hash map to store complement of each number.", "O(n) solution exists."],
        "optimal_time_complexity": "O(n)",
        "optimal_space_complexity": "O(n)",
    },
    # 2 — Strings
    {
        "title": "Valid Parentheses",
        "slug": "valid-parentheses",
        "description": (
            "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, "
            "determine if the input string is **valid**.\n\n"
            "An input string is valid if:\n"
            "1. Open brackets must be closed by the same type of brackets.\n"
            "2. Open brackets must be closed in the correct order.\n"
            "3. Every close bracket has a corresponding open bracket of the same type."
        ),
        "difficulty": "easy",
        "category": "Stack",
        "tags": ["stack", "string"],
        "constraints": ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'"],
        "examples": [
            {"input": "s = \"()\"", "output": "true"},
            {"input": "s = \"()[]{}\"", "output": "true"},
            {"input": "s = \"(]\"", "output": "false"},
        ],
        "default_code": _stubs(
            "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass",
            "var isValid = function(s) {\n    \n};",
            "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
            "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
        ),
        "test_cases_public": [
            {"input": "()", "output": "true"},
            {"input": "()[]{}", "output": "true"},
            {"input": "(]", "output": "false"},
        ],
        "test_cases_hidden": [
            {"input": "([)]", "output": "false"},
            {"input": "{[]}", "output": "true"},
            {"input": "", "output": "true"},
        ],
        "hints": ["Use a stack to track opening brackets."],
        "optimal_time_complexity": "O(n)",
        "optimal_space_complexity": "O(n)",
    },
    # 3 — Linked List
    {
        "title": "Reverse Linked List",
        "slug": "reverse-linked-list",
        "description": (
            "Given the `head` of a singly linked list, reverse the list, and return *the reversed list*."
        ),
        "difficulty": "easy",
        "category": "Linked List",
        "tags": ["linked-list", "recursion"],
        "constraints": ["The number of nodes in the list is in the range [0, 5000].", "-5000 ≤ Node.val ≤ 5000"],
        "examples": [
            {"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]"},
            {"input": "head = [1,2]", "output": "[2,1]"},
        ],
        "default_code": _stubs(
            "# Definition for singly-linked list.\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nclass Solution:\n    def reverseList(self, head: ListNode) -> ListNode:\n        pass",
            "var reverseList = function(head) {\n    \n};",
            "class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}",
            "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "1 2 3 4 5", "output": "5 4 3 2 1"}],
        "test_cases_hidden": [{"input": "1 2", "output": "2 1"}, {"input": "", "output": ""}],
        "hints": ["Iterative solution: use prev, curr pointers.", "Recursive solution also valid."],
        "optimal_time_complexity": "O(n)",
        "optimal_space_complexity": "O(1)",
    },
    # 4 — Trees
    {
        "title": "Maximum Depth of Binary Tree",
        "slug": "maximum-depth-binary-tree",
        "description": (
            "Given the `root` of a binary tree, return its *maximum depth*.\n\n"
            "A binary tree's **maximum depth** is the number of nodes along the longest path "
            "from the root node down to the farthest leaf node."
        ),
        "difficulty": "easy",
        "category": "Trees",
        "tags": ["tree", "dfs", "bfs", "recursion"],
        "constraints": ["The number of nodes in the tree is in the range [0, 10⁴].", "-100 ≤ Node.val ≤ 100"],
        "examples": [
            {"input": "root = [3,9,20,null,null,15,7]", "output": "3"},
            {"input": "root = [1,null,2]", "output": "2"},
        ],
        "default_code": _stubs(
            "class Solution:\n    def maxDepth(self, root) -> int:\n        pass",
            "var maxDepth = function(root) {\n    \n};",
            "class Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}",
            "class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "3 9 20 -1 -1 15 7", "output": "3"}],
        "test_cases_hidden": [{"input": "1", "output": "1"}, {"input": "", "output": "0"}],
        "hints": ["Use DFS or BFS.", "Return 0 for null nodes."],
        "optimal_time_complexity": "O(n)",
        "optimal_space_complexity": "O(h) where h is height",
    },
    # 5 — Dynamic Programming
    {
        "title": "Climbing Stairs",
        "slug": "climbing-stairs",
        "description": (
            "You are climbing a staircase. It takes `n` steps to reach the top.\n\n"
            "Each time you can either climb `1` or `2` steps. "
            "In how many distinct ways can you climb to the top?"
        ),
        "difficulty": "easy",
        "category": "Dynamic Programming",
        "tags": ["dp", "math", "fibonacci"],
        "constraints": ["1 ≤ n ≤ 45"],
        "examples": [
            {"input": "n = 2", "output": "2", "explanation": "1+1, 2"},
            {"input": "n = 3", "output": "3", "explanation": "1+1+1, 1+2, 2+1"},
        ],
        "default_code": _stubs(
            "class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass",
            "var climbStairs = function(n) {\n    \n};",
            "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
            "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "2", "output": "2"}, {"input": "3", "output": "3"}],
        "test_cases_hidden": [{"input": "1", "output": "1"}, {"input": "5", "output": "8"}, {"input": "45", "output": "1836311903"}],
        "hints": ["f(n) = f(n-1) + f(n-2)", "This is the Fibonacci sequence."],
        "optimal_time_complexity": "O(n)",
        "optimal_space_complexity": "O(1)",
    },
    # 6 — Binary Search
    {
        "title": "Binary Search",
        "slug": "binary-search",
        "description": (
            "Given an array of integers `nums` which is sorted in ascending order, "
            "and an integer `target`, write a function to search `target` in `nums`. "
            "If `target` exists, then return its index. Otherwise, return `-1`.\n\n"
            "You must write an algorithm with `O(log n)` runtime complexity."
        ),
        "difficulty": "easy",
        "category": "Binary Search",
        "tags": ["binary-search", "array"],
        "constraints": ["1 ≤ nums.length ≤ 10⁴", "-10⁴ < nums[i], target < 10⁴", "All the integers in nums are unique.", "nums is sorted in ascending order."],
        "examples": [
            {"input": "nums = [-1,0,3,5,9,12], target = 9", "output": "4"},
            {"input": "nums = [-1,0,3,5,9,12], target = 2", "output": "-1"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        pass",
            "var search = function(nums, target) {\n    \n};",
            "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
            "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "-1 0 3 5 9 12\n9", "output": "4"}, {"input": "-1 0 3 5 9 12\n2", "output": "-1"}],
        "test_cases_hidden": [{"input": "5\n5", "output": "0"}, {"input": "2 5\n0", "output": "-1"}],
        "hints": ["Maintain left and right pointers.", "Check mid = left + (right - left) // 2"],
        "optimal_time_complexity": "O(log n)",
        "optimal_space_complexity": "O(1)",
    },
    # 7 — HashMap
    {
        "title": "Group Anagrams",
        "slug": "group-anagrams",
        "description": (
            "Given an array of strings `strs`, group the **anagrams** together. "
            "You can return the answer in **any order**.\n\n"
            "An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, "
            "using all the original letters exactly once."
        ),
        "difficulty": "medium",
        "category": "HashMap",
        "tags": ["hash-map", "string", "sorting"],
        "constraints": ["1 ≤ strs.length ≤ 10⁴", "0 ≤ strs[i].length ≤ 100", "strs[i] consists of lowercase English letters."],
        "examples": [
            {"input": "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", "output": "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]"},
            {"input": "strs = [\"\"]", "output": "[[\"\"]]"},
        ],
        "default_code": _stubs(
            "from typing import List\nfrom collections import defaultdict\n\nclass Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        pass",
            "var groupAnagrams = function(strs) {\n    \n};",
            "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}",
            "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "eat tea tan ate nat bat", "output": "3"}],
        "test_cases_hidden": [{"input": "a", "output": "1"}, {"input": " ", "output": "1"}],
        "hints": ["Sorted version of each string is the key.", "Use defaultdict(list)."],
        "optimal_time_complexity": "O(n * k log k)",
        "optimal_space_complexity": "O(n * k)",
    },
    # 8 — Sliding Window
    {
        "title": "Longest Substring Without Repeating Characters",
        "slug": "longest-substring-without-repeating-chars",
        "description": (
            "Given a string `s`, find the length of the **longest substring** without repeating characters."
        ),
        "difficulty": "medium",
        "category": "Sliding Window",
        "tags": ["sliding-window", "hash-map", "string"],
        "constraints": ["0 ≤ s.length ≤ 5 × 10⁴", "s consists of English letters, digits, symbols and spaces."],
        "examples": [
            {"input": "s = \"abcabcbb\"", "output": "3", "explanation": "\"abc\" has length 3"},
            {"input": "s = \"bbbbb\"", "output": "1"},
            {"input": "s = \"pwwkew\"", "output": "3"},
        ],
        "default_code": _stubs(
            "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass",
            "var lengthOfLongestSubstring = function(s) {\n    \n};",
            "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
            "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "abcabcbb", "output": "3"}, {"input": "bbbbb", "output": "1"}],
        "test_cases_hidden": [{"input": "pwwkew", "output": "3"}, {"input": "", "output": "0"}, {"input": " ", "output": "1"}],
        "hints": ["Use a set + two pointer sliding window.", "Expand right, shrink left when duplicate found."],
        "optimal_time_complexity": "O(n)",
        "optimal_space_complexity": "O(min(m,n))",
    },
    # 9 — Graph
    {
        "title": "Number of Islands",
        "slug": "number-of-islands",
        "description": (
            "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) "
            "and `'0'`s (water), return *the number of islands*.\n\n"
            "An **island** is surrounded by water and is formed by connecting adjacent lands "
            "horizontally or vertically. You may assume all four edges of the grid are all surrounded by water."
        ),
        "difficulty": "medium",
        "category": "Graph",
        "tags": ["graph", "dfs", "bfs", "union-find"],
        "constraints": ["m == grid.length", "n == grid[i].length", "1 ≤ m, n ≤ 300", "grid[i][j] is '0' or '1'"],
        "examples": [
            {"input": "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]", "output": "1"},
            {"input": "grid = [[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]]", "output": "3"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        pass",
            "var numIslands = function(grid) {\n    \n};",
            "class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}",
            "class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", "output": "1"}],
        "test_cases_hidden": [{"input": "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", "output": "3"}],
        "hints": ["DFS/BFS from every unvisited land cell.", "Mark visited cells as '0'."],
        "optimal_time_complexity": "O(m*n)",
        "optimal_space_complexity": "O(m*n)",
    },
    # 10 — Greedy
    {
        "title": "Jump Game",
        "slug": "jump-game",
        "description": (
            "You are given an integer array `nums`. You are initially positioned at the array's **first index**, "
            "and each element in the array represents your maximum jump length at that position.\n\n"
            "Return `true` if you can reach the last index, or `false` otherwise."
        ),
        "difficulty": "medium",
        "category": "Greedy",
        "tags": ["greedy", "array", "dp"],
        "constraints": ["1 ≤ nums.length ≤ 10⁴", "0 ≤ nums[i] ≤ 10⁵"],
        "examples": [
            {"input": "nums = [2,3,1,1,4]", "output": "true"},
            {"input": "nums = [3,2,1,0,4]", "output": "false"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def canJump(self, nums: List[int]) -> bool:\n        pass",
            "var canJump = function(nums) {\n    \n};",
            "class Solution {\n    public boolean canJump(int[] nums) {\n        \n    }\n}",
            "class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "2 3 1 1 4", "output": "true"}, {"input": "3 2 1 0 4", "output": "false"}],
        "test_cases_hidden": [{"input": "0", "output": "true"}, {"input": "2 0 0", "output": "true"}, {"input": "1 0 2", "output": "false"}],
        "hints": ["Track the farthest index reachable.", "If current index > farthest, return false."],
        "optimal_time_complexity": "O(n)",
        "optimal_space_complexity": "O(1)",
    },
    # 11 — Recursion
    {
        "title": "Generate Parentheses",
        "slug": "generate-parentheses",
        "description": (
            "Given `n` pairs of parentheses, write a function to *generate all combinations of well-formed parentheses*."
        ),
        "difficulty": "medium",
        "category": "Recursion",
        "tags": ["recursion", "backtracking", "string"],
        "constraints": ["1 ≤ n ≤ 8"],
        "examples": [
            {"input": "n = 3", "output": "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]"},
            {"input": "n = 1", "output": "[\"()\"]"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def generateParenthesis(self, n: int) -> List[str]:\n        pass",
            "var generateParenthesis = function(n) {\n    \n};",
            "class Solution {\n    public List<String> generateParenthesis(int n) {\n        \n    }\n}",
            "class Solution {\npublic:\n    vector<string> generateParenthesis(int n) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "1", "output": "1"}, {"input": "3", "output": "5"}],
        "test_cases_hidden": [{"input": "2", "output": "2"}, {"input": "4", "output": "14"}],
        "hints": ["Backtrack with open and close counters.", "Add '(' if open < n, add ')' if close < open."],
        "optimal_time_complexity": "O(4^n / sqrt(n))",
        "optimal_space_complexity": "O(n)",
    },
    # 12 — Sorting
    {
        "title": "Sort Colors",
        "slug": "sort-colors",
        "description": (
            "Given an array `nums` with `n` objects colored red, white, or blue, "
            "sort them **in-place** so that objects of the same color are adjacent, "
            "with the colors in the order red, white, and blue.\n\n"
            "We will use the integers `0`, `1`, and `2` to represent the color red, white, and blue, respectively.\n\n"
            "You must solve this problem without using the library's sort function."
        ),
        "difficulty": "medium",
        "category": "Sorting",
        "tags": ["sorting", "two-pointers", "dutch-national-flag"],
        "constraints": ["n == nums.length", "1 ≤ n ≤ 300", "nums[i] is either 0, 1, or 2"],
        "examples": [
            {"input": "nums = [2,0,2,1,1,0]", "output": "[0,0,1,1,2,2]"},
            {"input": "nums = [2,0,1]", "output": "[0,1,2]"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def sortColors(self, nums: List[int]) -> None:\n        pass",
            "var sortColors = function(nums) {\n    \n};",
            "class Solution {\n    public void sortColors(int[] nums) {\n        \n    }\n}",
            "class Solution {\npublic:\n    void sortColors(vector<int>& nums) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "2 0 2 1 1 0", "output": "0 0 1 1 2 2"}],
        "test_cases_hidden": [{"input": "2 0 1", "output": "0 1 2"}, {"input": "0", "output": "0"}, {"input": "1", "output": "1"}],
        "hints": ["Dutch National Flag algorithm: three pointers low, mid, high."],
        "optimal_time_complexity": "O(n)",
        "optimal_space_complexity": "O(1)",
    },
    # 13 — Queue
    {
        "title": "Implement Stack Using Queues",
        "slug": "implement-stack-using-queues",
        "description": (
            "Implement a last-in-first-out (LIFO) stack using only two queues. "
            "The implemented stack should support all the functions of a normal stack (`push`, `top`, `pop`, and `empty`).\n\n"
            "Implement the `MyStack` class:\n"
            "- `void push(int x)` — Pushes element x to the top of the stack.\n"
            "- `int pop()` — Removes the element on the top of the stack and returns it.\n"
            "- `int top()` — Returns the element on the top of the stack.\n"
            "- `boolean empty()` — Returns `true` if the stack is empty, `false` otherwise."
        ),
        "difficulty": "easy",
        "category": "Queue",
        "tags": ["queue", "stack", "design"],
        "constraints": ["1 ≤ x ≤ 9", "At most 100 calls will be made to push, pop, top, and empty.", "All the calls to pop and top are valid."],
        "examples": [
            {"input": "MyStack s; s.push(1); s.push(2); s.top(); s.pop(); s.empty();", "output": "null null 2 2 false"},
        ],
        "default_code": _stubs(
            "from collections import deque\n\nclass MyStack:\n    def __init__(self):\n        pass\n\n    def push(self, x: int) -> None:\n        pass\n\n    def pop(self) -> int:\n        pass\n\n    def top(self) -> int:\n        pass\n\n    def empty(self) -> bool:\n        pass",
            "var MyStack = function() {\n    \n};\nMyStack.prototype.push = function(x) {};\nMyStack.prototype.pop = function() {};\nMyStack.prototype.top = function() {};\nMyStack.prototype.empty = function() {};",
            "class MyStack {\n    public MyStack() {}\n    public void push(int x) {}\n    public int pop() { return 0; }\n    public int top() { return 0; }\n    public boolean empty() { return false; }\n}",
            "class MyStack {\npublic:\n    MyStack() {}\n    void push(int x) {}\n    int pop() { return 0; }\n    int top() { return 0; }\n    bool empty() { return false; }\n};",
        ),
        "test_cases_public": [{"input": "push 1\npush 2\ntop\npop\nempty", "output": "2\n2\nfalse"}],
        "test_cases_hidden": [{"input": "push 5\nempty\npop\nempty", "output": "false\n5\ntrue"}],
        "hints": ["On every push, rotate queue so the new element becomes the front."],
        "optimal_time_complexity": "O(n) push, O(1) others",
        "optimal_space_complexity": "O(n)",
    },
    # 14 — DP Medium
    {
        "title": "Longest Increasing Subsequence",
        "slug": "longest-increasing-subsequence",
        "description": (
            "Given an integer array `nums`, return the length of the longest **strictly increasing subsequence**."
        ),
        "difficulty": "medium",
        "category": "Dynamic Programming",
        "tags": ["dp", "binary-search", "greedy"],
        "constraints": ["1 ≤ nums.length ≤ 2500", "-10⁴ ≤ nums[i] ≤ 10⁴"],
        "examples": [
            {"input": "nums = [10,9,2,5,3,7,101,18]", "output": "4", "explanation": "[2,3,7,101]"},
            {"input": "nums = [0,1,0,3,2,3]", "output": "4"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        pass",
            "var lengthOfLIS = function(nums) {\n    \n};",
            "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        \n    }\n}",
            "class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "10 9 2 5 3 7 101 18", "output": "4"}],
        "test_cases_hidden": [{"input": "0 1 0 3 2 3", "output": "4"}, {"input": "7 7 7 7 7", "output": "1"}],
        "hints": ["O(n²) DP: dp[i] = max(dp[j]+1) for j<i where nums[j]<nums[i]", "O(n log n): patience sorting with binary search"],
        "optimal_time_complexity": "O(n log n)",
        "optimal_space_complexity": "O(n)",
    },
    # 15 — Graph Hard
    {
        "title": "Course Schedule",
        "slug": "course-schedule",
        "description": (
            "There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. "
            "You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that "
            "you **must** take course `bi` first if you want to take course `ai`.\n\n"
            "Return `true` if you can finish all courses. Otherwise, return `false`."
        ),
        "difficulty": "medium",
        "category": "Graph",
        "tags": ["graph", "topological-sort", "cycle-detection", "dfs"],
        "constraints": ["1 ≤ numCourses ≤ 2000", "0 ≤ prerequisites.length ≤ 5000", "prerequisites[i].length == 2", "All the pairs are unique."],
        "examples": [
            {"input": "numCourses = 2, prerequisites = [[1,0]]", "output": "true"},
            {"input": "numCourses = 2, prerequisites = [[1,0],[0,1]]", "output": "false"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        pass",
            "var canFinish = function(numCourses, prerequisites) {\n    \n};",
            "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        \n    }\n}",
            "class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "2\n1 0", "output": "true"}, {"input": "2\n1 0\n0 1", "output": "false"}],
        "test_cases_hidden": [{"input": "1\n", "output": "true"}, {"input": "3\n1 0\n2 1", "output": "true"}],
        "hints": ["Build adjacency list. DFS cycle detection.", "Topological sort with Kahn's algorithm."],
        "optimal_time_complexity": "O(V+E)",
        "optimal_space_complexity": "O(V+E)",
    },
    # 16 — Hard DP
    {
        "title": "Coin Change",
        "slug": "coin-change",
        "description": (
            "You are given an integer array `coins` representing coins of different denominations "
            "and an integer `amount` representing a total amount of money.\n\n"
            "Return the fewest number of coins that you need to make up that amount. "
            "If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\n"
            "You may assume that you have an infinite number of each kind of coin."
        ),
        "difficulty": "medium",
        "category": "Dynamic Programming",
        "tags": ["dp", "bfs", "greedy"],
        "constraints": ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2³¹ - 1", "0 ≤ amount ≤ 10⁴"],
        "examples": [
            {"input": "coins = [1,5,6,9], amount = 11", "output": "2", "explanation": "6+5=11"},
            {"input": "coins = [2], amount = 3", "output": "-1"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        pass",
            "var coinChange = function(coins, amount) {\n    \n};",
            "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}",
            "class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "1 5 6 9\n11", "output": "2"}, {"input": "2\n3", "output": "-1"}],
        "test_cases_hidden": [{"input": "1\n0", "output": "0"}, {"input": "1 2 5\n11", "output": "3"}],
        "hints": ["Bottom-up DP: dp[i] = min coins to make amount i.", "Initialize dp[0]=0, rest=infinity."],
        "optimal_time_complexity": "O(amount * coins.length)",
        "optimal_space_complexity": "O(amount)",
    },
    # 17 — String Hard
    {
        "title": "Minimum Window Substring",
        "slug": "minimum-window-substring",
        "description": (
            "Given two strings `s` and `t` of lengths `m` and `n` respectively, "
            "return the **minimum window substring** of `s` such that every character in `t` "
            "(including duplicates) is included in the window. "
            "If there is no such substring, return the empty string `\"\"`."
        ),
        "difficulty": "hard",
        "category": "Sliding Window",
        "tags": ["sliding-window", "hash-map", "string", "two-pointers"],
        "constraints": ["m == s.length", "n == t.length", "1 ≤ m, n ≤ 10⁵", "s and t consist of uppercase and lowercase English letters."],
        "examples": [
            {"input": "s = \"ADOBECODEBANC\", t = \"ABC\"", "output": "\"BANC\""},
            {"input": "s = \"a\", t = \"a\"", "output": "\"a\""},
            {"input": "s = \"a\", t = \"aa\"", "output": "\"\""},
        ],
        "default_code": _stubs(
            "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        pass",
            "var minWindow = function(s, t) {\n    \n};",
            "class Solution {\n    public String minWindow(String s, String t) {\n        \n    }\n}",
            "class Solution {\npublic:\n    string minWindow(string s, string t) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "ADOBECODEBANC\nABC", "output": "BANC"}],
        "test_cases_hidden": [{"input": "a\na", "output": "a"}, {"input": "a\naa", "output": ""}],
        "hints": ["Sliding window with two hashmaps: need and window.", "Shrink left when all chars satisfied."],
        "optimal_time_complexity": "O(m+n)",
        "optimal_space_complexity": "O(m+n)",
    },
    # 18 — SQL
    {
        "title": "Employees Earning More Than Managers",
        "slug": "employees-earning-more-than-managers",
        "description": (
            "Table: `Employee`\n\n"
            "```\n+-------------+---------+\n| Column Name | Type    |\n+-------------+---------+\n| id          | int     |\n| name        | varchar |\n| salary      | int     |\n| managerId   | int     |\n+-------------+---------+\n```\n\n"
            "`id` is the primary key. `managerId` is the ID of the manager (or NULL).\n\n"
            "Write a solution to find the employees who earn more than their managers.\n"
            "Return the result table in any order."
        ),
        "difficulty": "easy",
        "category": "SQL",
        "tags": ["sql", "self-join"],
        "constraints": [],
        "examples": [
            {
                "input": "Employee table: [(1,'Joe',70000,3),(2,'Henry',80000,4),(3,'Sam',60000,NULL),(4,'Max',90000,NULL)]",
                "output": "+----------+\n| Employee |\n+----------+\n| Joe      |\n+----------+",
            }
        ],
        "default_code": {
            "python": "# SQL problem - write your query below\nquery = \"\"\"\nSELECT\n    e1.name AS Employee\nFROM Employee e1\nJOIN Employee e2 ON e1.managerId = e2.id\nWHERE e1.salary > e2.salary;\n\"\"\"",
            "javascript": "// SQL problem\nconst query = `\nSELECT e1.name AS Employee\nFROM Employee e1\nJOIN Employee e2 ON e1.managerId = e2.id\nWHERE e1.salary > e2.salary;\n`;",
            "java": "// SQL problem - write query as string\nString query = \"SELECT e1.name AS Employee FROM Employee e1 JOIN Employee e2 ON e1.managerId = e2.id WHERE e1.salary > e2.salary;\";",
            "cpp": "// SQL problem",
            "c": "// SQL problem",
        },
        "test_cases_public": [{"input": "Self-join query", "output": "Joe"}],
        "test_cases_hidden": [],
        "hints": ["Self-join: JOIN Employee AS manager ON emp.managerId = manager.id", "Filter WHERE emp.salary > manager.salary"],
        "optimal_time_complexity": "O(n log n)",
        "optimal_space_complexity": "O(n)",
    },
    # 19 — JavaScript specific
    {
        "title": "Debounce Function",
        "slug": "debounce-function",
        "description": (
            "Implement a **debounce** function in JavaScript.\n\n"
            "A debounced function delays the invocation until after `wait` milliseconds have elapsed "
            "since the last time the debounced function was invoked.\n\n"
            "```js\nfunction debounce(fn, wait) { ... }\n```\n\n"
            "The returned function should:\n"
            "- Delay calling `fn` for `wait` ms after each call.\n"
            "- Cancel any previous pending call if called again within `wait` ms.\n"
            "- Preserve `this` context and arguments."
        ),
        "difficulty": "medium",
        "category": "JavaScript",
        "tags": ["javascript", "closures", "timers"],
        "constraints": ["0 ≤ wait ≤ 1000"],
        "examples": [
            {"input": "debounce(log, 100) called at t=0,50,150", "output": "log called once at t=250"},
        ],
        "default_code": {
            "python": "import time\n\ndef debounce(fn, wait):\n    \"\"\"Return a debounced version of fn.\"\"\"\n    timer = None\n    # Your implementation here\n    pass",
            "javascript": "/**\n * @param {Function} fn\n * @param {number} wait\n * @return {Function}\n */\nfunction debounce(fn, wait) {\n    let timer;\n    return function(...args) {\n        // your code here\n    };\n}",
            "java": "// Debounce concept (Java)\nimport java.util.concurrent.*;\n\npublic class Debounce {\n    private ScheduledFuture<?> future;\n    private final ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();\n    \n    public Runnable debounce(Runnable fn, long waitMs) {\n        return () -> {\n            if (future != null) future.cancel(false);\n            future = executor.schedule(fn, waitMs, TimeUnit.MILLISECONDS);\n        };\n    }\n}",
            "cpp": "// C++ debounce concept\n#include <functional>\n#include <thread>\n#include <chrono>\n\nstd::function<void()> debounce(std::function<void()> fn, int wait_ms) {\n    // Implementation\n    return fn;\n}",
            "c": "// Debounce in C (concept)\n#include <stdio.h>\nvoid debounced_function() {\n    // Implementation\n}",
        },
        "test_cases_public": [{"input": "wait=100\ncalls at 0 50 150", "output": "called once"}],
        "test_cases_hidden": [],
        "hints": ["Use setTimeout / clearTimeout.", "Return a closure capturing the timer reference."],
        "optimal_time_complexity": "O(1) per call",
        "optimal_space_complexity": "O(1)",
    },
    # 20 — Hard Backtracking
    {
        "title": "Word Search",
        "slug": "word-search",
        "description": (
            "Given an `m x n` grid of characters `board` and a string `word`, "
            "return `true` if `word` exists in the grid.\n\n"
            "The word can be constructed from letters of sequentially adjacent cells, "
            "where adjacent cells are horizontally or vertically neighboring. "
            "The same letter cell may not be used more than once."
        ),
        "difficulty": "medium",
        "category": "Recursion",
        "tags": ["backtracking", "dfs", "matrix"],
        "constraints": ["m == board.length", "n == board[i].length", "1 ≤ m, n ≤ 6", "1 ≤ word.length ≤ 15", "board and word consists of only lowercase and uppercase English letters."],
        "examples": [
            {"input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"", "output": "true"},
            {"input": "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"SEE\"", "output": "true"},
        ],
        "default_code": _stubs(
            "from typing import List\n\nclass Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        pass",
            "var exist = function(board, word) {\n    \n};",
            "class Solution {\n    public boolean exist(char[][] board, String word) {\n        \n    }\n}",
            "class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        \n    }\n};",
        ),
        "test_cases_public": [{"input": "A B C E\nS F C S\nA D E E\nABCCED", "output": "true"}],
        "test_cases_hidden": [{"input": "A B C E\nS F C S\nA D E E\nSEE", "output": "true"}, {"input": "A\nA", "output": "true"}],
        "hints": ["DFS + backtracking from each cell.", "Mark visited cells temporarily."],
        "optimal_time_complexity": "O(m*n*4^L)",
        "optimal_space_complexity": "O(L) where L = word length",
    },
]


async def seed_questions() -> None:
    """Insert seed coding questions (skips existing slugs)."""
    async with AsyncSessionLocal() as db:
        for q in QUESTIONS:
            # Skip if slug already exists
            existing = await db.execute(
                select(CodingQuestion).where(CodingQuestion.slug == q["slug"])
            )
            if existing.scalar_one_or_none():
                print(f"  ⏭  Skipping existing: {q['slug']}")
                continue

            question = CodingQuestion(**q)
            db.add(question)
            print(f"  ✅ Inserting: {q['slug']}")

        await db.commit()
        print(f"\n🎉 Seeded {len(QUESTIONS)} coding questions successfully.")


if __name__ == "__main__":
    asyncio.run(seed_questions())
