# Master Prompt for Cursor AI (Next.js Edition)

Paste this as the first prompt in Cursor (Composer/Agent mode) in an
empty repo. Then follow up with the phase-by-phase prompts in
PROJECT.md.

---

```
You are helping me build an AI-Powered Personalized
Learning Path Recommender — for a hackathon (HCLTech Amplified, Round 2).
Team of 5, deadline-driven, must deploy 100% free with fast responses.

TECH STACK (fixed, do not deviate):
- Framework: Next.js 14+ (App Router), plain JavaScript — NO
  TypeScript, NO .tsx/.ts files.
- Styling: Tailwind CSS
- Charts/Graph UI: recharts (dashboard charts), reactflow (roadmap
  graph)
- Database: MongoDB Atlas (free M0 cluster) via the official `mongodb`
  npm driver, with a cached connection helper for serverless
  (lib/mongodb.js) — never create a new MongoClient per request.
- Auth: JWT (jsonwebtoken) stored in an httpOnly cookie, passwords
  hashed with bcryptjs. No NextAuth — keep it simple and explicit for
  the demo.
- AI/LLM: call the Groq API (Llama 3, free tier) directly via fetch
  from Next.js Route Handlers, with Gemini 1.5 Flash (free tier) as a
  fallback provider if Groq fails. No separate Python service, no
  paid AI SDKs.
- Deployment: single Vercel project (Hobby/free tier) for the whole
  app. MongoDB Atlas free tier for data. No Render/Railway/Fly —
  Vercel serverless functions avoid the "server sleeping" cold-start
  problem of free container platforms.

PROJECT STRUCTURE:
/app
  /api
    /auth/register/route.js
    /auth/login/route.js
    /auth/me/route.js
    /profile/route.js
    /ai/parse-goal/route.js
    /ai/skill-gap/route.js
    /ai/recommend/route.js
    /ai/generate-path/route.js
    /ai/explain/route.js
    /path/generate/route.js
    /path/route.js
    /progress/route.js
    /milestone/[id]/status/route.js
  /onboarding/page.jsx
  /roadmap/page.jsx
  /dashboard/page.jsx
  /login/page.jsx
  /register/page.jsx
  /settings/page.jsx
  layout.jsx
/components   (ChatBubble.jsx, ChatInput.jsx, MilestoneNode.jsx,
               ProgressRing.jsx, Navbar.jsx, etc.)
/lib          (mongodb.js, auth.js, llmClient.js, recommender.js,
               skillTaxonomy.js, skillGraph.js)
/scripts      (seedResources.mjs)
/middleware.js  (route protection via JWT cookie check)
.env.local.example
README.md
PROJECT.md

CORE DOMAIN MODEL (MongoDB collections — same as diagrams.md):
- learners (id, name, email, passwordHash)
- learner_profiles (learnerId, interests[], experienceLevel,
  completedCourses[], careerGoal, learningStyle, timeframe)
- resources (id, title, type, url, difficulty, topics[],
  estimatedHours, prerequisites[])
- learning_paths (id, learnerId, goal, status, milestones[])
- milestones (id, pathId, title, description, order, prerequisites[],
  resourceIds[], status, explanation)
- progress_logs (id, learnerId, milestoneId, status, updatedAt)

REQUIRED FEATURES (build incrementally, one feature per commit/PR):
1. Conversational onboarding — free-text goal input, LLM extracts a
   structured profile (strict JSON via prompt + manual parse/validate,
   no TS types needed — just check required keys exist), asks
   clarifying follow-ups for missing fields.
2. Learner profiling engine — persisted profile, editable via a
   settings page.
3. Recommendation engine — content-based matching (topic/difficulty/
   type scoring) against the resources collection.
4. Learning path generator — topologically-ordered milestones with
   explicit prerequisites.
5. Explanation & Q&A assistant — grounded, per-milestone "why this was
   recommended" text plus free-form Q&A.
6. Progress dashboard — completion %, skills gained, milestone
   timeline, next recommended action.
7. Adaptive feedback loop — "struggling" status on a milestone
   triggers regeneration of the remaining path only.

RULES FOR YOU (the AI IDE):
- Work feature-by-feature. After each feature, tell me exactly how to
  run and test it (curl commands or browser steps) before moving on.
- Plain JavaScript only — no TypeScript files, no type annotations.
- Keep all secrets in .env.local (never commit it); keep
  .env.local.example up to date.
- Every Route Handler needs basic try/catch with a consistent JSON
  error shape: { error: true, message: string }.
- Every LLM call must have a strict expected-JSON-shape prompt with a
  manual parse + one retry-with-correction on failure, and a safe
  fallback so the route never 500s just because the LLM returned
  malformed text.
- Do not introduce any paid/keyed service that has no free tier.
- Do not add a separate backend service — everything is Next.js Route
  Handlers in this one app.
- Update README.md and PROJECT.md checkboxes as features are completed.

GIT WORKFLOW (follow this for every single feature, no exceptions):
1. Before writing any code for a feature, create and switch to a new
   branch off the latest main:
   git checkout main && git pull origin main
   git checkout -b feature/<short-feature-name>
   (e.g. feature/auth-routes, feature/onboarding-chat-ui,
   feature/skill-gap-route — use the issue title from team.txt,
   kebab-cased)
2. Implement ONLY that feature on this branch. Do not mix unrelated
   changes in.
3. Stage and commit in small, logical commits as you go — not one
   giant commit at the end:
   git add <specific files>
   git commit -m "<type>: <short description>"
   Use conventional commit prefixes: feat, fix, chore, docs, refactor,
   test — e.g. "feat: add JWT register/login routes",
   "feat: add getSessionUser auth helper".
4. When the feature is complete and tested, push the branch:
   git push -u origin feature/<short-feature-name>
5. Open a pull request back into main using the GitHub CLI (assume
   `gh` is installed and authenticated — if not, tell me to run
   `gh auth login` first):
   gh pr create --base main --head feature/<short-feature-name> \
     --title "<Issue title from team.txt>" \
     --body "Closes #<issue-number>. <1-2 line summary of what this PR does and how to test it.>"
6. After telling me the PR command output/URL, STOP and wait for me to
   say the PR is merged (or merge it yourself with
   `gh pr merge --squash --delete-branch` only if I explicitly tell you
   to) before starting the next feature branch off the updated main:
   git checkout main && git pull origin main
7. Never commit directly to main. Never force-push. Never skip the
   branch/PR steps even for tiny fixes — keep the commit history
   mapped cleanly to team.txt issues, since the submission guidelines
   require commit history to reflect real incremental development.

Start with Phase 0: scaffold the Next.js app (JavaScript, App Router,
Tailwind), the folder structure above (empty but runnable route
handlers returning stub JSON), lib/mongodb.js connection helper,
.env.local.example, and a GitHub Actions workflow that runs
`npm run build` and `npm run lint`. Then stop and wait for my
go-ahead before Phase 1.
```

---

## Follow-up prompts

Copy the matching "Cursor Agent Prompt" block from PROJECT.md for
whichever phase/issue you're working on — they're written to be pasted
directly into Cursor once the scaffolding from the prompt above is in
place.

Each teammate should prefix their pasted PROJECT.md prompt with a
one-line reminder so Cursor applies the branch/PR workflow every time,
e.g.:

```
Follow the git workflow rules from before: create branch
feature/goal-parser-route off main first, commit as you go, then open
a PR with gh when done and stop.

<paste the Phase 3b prompt from PROJECT.md here>
```

This matters because Cursor doesn't retain the git-workflow rule
reliably across separate chat sessions/teammates — restate it each
time you start a new feature in a fresh Cursor session.
