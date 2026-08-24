# TESTING.md — Integration & QA Checklist

This document tracks the end-to-end testing and quality assurance of the AI-Powered Personalized Learning Path Recommender.

## 1. Authentication & Profiling
- [x] **Registration:** Successfully register a new user. The system hashes the password, sets an HTTP-only JWT cookie, and creates a basic user record.
- [x] **Login:** Logging in with valid credentials successfully returns a session and sets the cookie.
- [x] **Session Persistence:** Navigating between routes maintains session state using the `/api/auth/me` endpoint.
- [x] **Logout:** Clicking logout successfully clears the cookie and redirects to `/login`.

## 2. Onboarding Flow (Chat UI)
- [x] **Goal Parsing:** Interacting with the chat UI successfully sends free-text to `/api/ai/parse-goal`.
- [x] **Validation:** The AI recognizes missing fields (e.g., target role, experience level) and prompts the user for follow-up questions.
- [x] **Profile Completion:** When all required fields are parsed, the system successfully hits `/api/profile` to save the profile.
- [x] **Path Generation Handoff:** Completing onboarding seamlessly triggers `/api/path/generate` and transitions the user to the roadmap.

## 3. Path Generation & AI Orchestration
- [x] **Skill Gap Analysis:** The system correctly matches the learner's parsed goal and experience level against `lib/skillTaxonomy.js` to find missing topics.
- [x] **Resource Matching:** Missing topics successfully pull 3 recommended resources (courses, videos, articles) from the database.
- [x] **Milestone Construction:** Groq/Gemini correctly batches missing topics into structured JSON milestones with `estimatedDuration`.
- [x] **Persistence:** The final generated path is successfully saved to the `learning_paths` and `milestones` MongoDB collections.

## 4. Roadmap & Interactive Nodes
- [x] **ReactFlow Rendering:** The roadmap correctly fetches from `/api/path` and draws interconnected nodes.
- [x] **Status Badges:** Nodes accurately reflect `not_started`, `in_progress`, or `completed` states.
- [x] **Explanation Side-Panel:** Clicking a node opens a side panel that displays curated resources.
- [x] **Status Updates:** Modifying a node's status via the panel successfully triggers a `PATCH /api/milestone/[id]/status` call.

## 5. Adaptive Loop ("Struggling" Status)
- [x] **Trigger Adaptive Re-plan:** Setting a milestone status to "struggling" or providing negative feedback tells the AI to regenerate the *remaining* path.
- [x] **Partial Regeneration:** Completed milestones remain untouched, while the future nodes are re-organized.

## 6. Progress Dashboard
- [x] **Progress Percentage:** The radial chart correctly calculates `(completed / total) * 100`.
- [x] **Milestone Timeline:** The list of milestones reflects the current status of the roadmap accurately.
- [x] **Weeks Remaining:** The bar chart successfully computes the sum of estimated weeks for all incomplete nodes.

## 7. Error Handling & Robustness
- [x] **Frontend Try/Catch:** All `fetch` calls are wrapped in `try/catch` and use the `Toast.jsx` component to display user-friendly error messages (e.g., "Failed to load dashboard").
- [x] **API Consistency:** Every Route Handler uses a unified error response shape: `{ error: true, message: "..." }`.
- [x] **LLM Failover:** If Groq fails or returns invalid JSON, the system correctly falls back to Gemini or retries parsing.

---
**Status:** ✅ Fully Tested on Local Environment. Ready for Vercel Deployment.
