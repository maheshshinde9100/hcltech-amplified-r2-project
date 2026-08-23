# PROJECT.md — Build Plan (Next.js Edition)

AI-Powered Personalized Learning Path Recommender — HCLTech Amplified,
Round 2. Step-by-step plan to take this from zero to a deployed,
demo-able prototype using **Next.js (App Router, plain JavaScript)**
end-to-end, deployed entirely on **Vercel** (no separate backend
platform, no cold-start delays).

See `diagrams.md` for architecture/flow/ER/deployment diagrams. See
`team.txt` for issue-by-issue ownership across 5 members.

---

## Phase 0 — Scaffolding (Owner: M1)

**Goal:** a runnable Next.js app with stub API routes + CI.

**Cursor Agent Prompt:**
```
Scaffold a Next.js 14+ app (App Router, JavaScript only — no
TypeScript) with Tailwind CSS pre-configured (use
`npx create-next-app@latest . --js --tailwind --eslint --app
--src-dir=false --import-alias "@/*"`).

Create these empty-but-runnable Route Handlers (each returns a stub
JSON response for now):
app/api/auth/register/route.js
app/api/auth/login/route.js
app/api/auth/me/route.js
app/api/profile/route.js
app/api/ai/parse-goal/route.js
app/api/ai/skill-gap/route.js
app/api/ai/recommend/route.js
app/api/ai/generate-path/route.js
app/api/ai/explain/route.js
app/api/path/generate/route.js
app/api/path/route.js
app/api/progress/route.js
app/api/milestone/[id]/status/route.js

Create these empty page stubs (Client Components where interactive):
app/onboarding/page.jsx, app/roadmap/page.jsx, app/dashboard/page.jsx,
app/login/page.jsx, app/register/page.jsx, app/settings/page.jsx

Create lib/mongodb.js exporting a `getDb()` function that reuses a
cached MongoClient across invocations (critical for serverless — use
the global-caching pattern in dev, module-scope singleton in
production). Read MONGODB_URI from process.env.

Create .env.local.example with MONGODB_URI, JWT_SECRET, GROQ_API_KEY,
GEMINI_API_KEY placeholders. Add .env.local to .gitignore.

Add .github/workflows/ci.yml running `npm ci`, `npm run build`,
`npm run lint` on push/PR to main.
```

**Checklist:**
- [ ] `npm run dev` serves the app at localhost:3000
- [ ] All stub routes return valid JSON when curled
- [ ] CI passes on an empty commit

---

## Phase 1 — Auth + Learner Profile (Owner: M1, Issues #2, #3)

**Cursor Agent Prompt:**
```
Implement:
1. lib/auth.js — hashPassword(plain), verifyPassword(plain, hash)
   using bcryptjs; signToken(payload), verifyToken(token) using
   jsonwebtoken and JWT_SECRET; getSessionUser(request) that reads the
   "token" httpOnly cookie and returns the decoded user or null.
2. app/api/auth/register/route.js (POST {name,email,password}) —
   validate, check for existing email in "learners" collection, hash
   password, insert, sign JWT, set httpOnly cookie, return the user
   (without passwordHash).
3. app/api/auth/login/route.js (POST {email,password}) — verify
   credentials, sign JWT, set cookie.
4. app/api/auth/me/route.js (GET) — return the current session user or
   401.
5. app/api/profile/route.js — GET (current learner's profile from
   "learner_profiles"), POST (create), PATCH (update). Require a valid
   session via getSessionUser; return 401 if absent.
Add a simple manual validator (no zod needed, but zod is fine if you
prefer) checking required fields and returning
{error:true, message} with 400 on failure.
```

**Checklist:**
- [ ] Register/login sets a working JWT cookie
- [ ] /api/auth/me reflects the logged-in user
- [ ] Profile GET/POST/PATCH works via curl or Thunder Client

---

## Phase 2 — Course/Resource Catalog + Seed Data (Owner: M5, Issue #4)

**Cursor Agent Prompt:**
```
Create scripts/seedResources.mjs — a standalone Node script (run with
`node scripts/seedResources.mjs`, using the `mongodb` driver directly
and dotenv to read .env.local) that populates a "resources" collection
with 150-250 documents across 4 domains: Web Development, Data
Science, DSA/Backend Engineering, Cloud/DevOps. Each document:
{ title, type: "course"|"project"|"article"|"video", url, difficulty:
"beginner"|"intermediate"|"advanced", topics: [string],
estimatedHours: number, prerequisites: [topic strings] }.
Use plausible real titles/urls from well-known free resources
(freeCodeCamp curriculum, MDN, official framework docs, roadmap.sh
topic lists, known YouTube playlists) — add a comment to verify URLs
before demo day.

Also create lib/skillTaxonomy.js exporting a plain JS object mapping
each of the 4 domains to an ordered list of {topic, prerequisites}
entries, and lib/skillGraph.js exporting a pure function
`topoSortMissingTopics(domain, coveredTopics)` that returns missing
topics in valid prerequisite order (no external graph library needed
— implement a simple Kahn's algorithm).
```

**Checklist:**
- [ ] `resources` collection has 150+ documents across 4 domains
- [ ] `topoSortMissingTopics` has a couple of manual test calls proving
      correct ordering

---

## Phase 3 — AI Logic (Owner: M2, Issues #5–#10)

Build these as separate, focused Cursor sessions.

**3a. LLM client wrapper — Cursor Agent Prompt:**
```
Create lib/llmClient.js exporting `async function askLLM(systemPrompt,
userPrompt, { jsonMode = false } = {})`. It calls Groq's
/openai/v1/chat/completions endpoint (model llama-3.1-8b-instant or
similar free-tier model) via fetch with GROQ_API_KEY, using
response_format json_object when jsonMode is true and the prompt
explicitly asks for JSON-only output. On any fetch error or non-2xx
response, retry once against Gemini's generateContent REST endpoint
using GEMINI_API_KEY as a fallback. When jsonMode is true, JSON.parse
the result; on parse failure, make one more LLM call appending
"Return ONLY valid JSON, no prose, no markdown fences" and parse
again; if that still fails, throw a clear error the caller can catch.
```

**3b. Goal parser route — Cursor Agent Prompt:**
```
Implement app/api/ai/parse-goal/route.js (POST {message, sessionId,
knownFields}). Build a system prompt instructing the LLM to return
strict JSON: {goal, domain, targetRole, experienceLevel, interests:
[string], timeframe, missingFields: [string], followUpQuestion:
string|null}. Call askLLM(..., {jsonMode:true}). Manually validate
required keys exist (no external schema lib needed, just check
typeof/Array.isArray). Upsert whatever fields were extracted into the
current learner's learner_profiles document (partial update, only
non-null fields). Return the parsed result to the client.
```

**3c. Skill-gap route — Cursor Agent Prompt:**
```
Implement app/api/ai/skill-gap/route.js (POST {domain,
experienceLevel, completedCourses, goal}). No LLM call needed — use
lib/skillGraph.js's topoSortMissingTopics against lib/skillTaxonomy.js,
inferring "covered" topics heuristically from completedCourses +
experienceLevel (e.g. beginner covers nothing extra, intermediate
covers the taxonomy's first N entries, or match completedCourses
titles against topic keywords). Return {missingTopics:
[{topic, prerequisites}], coveredTopics: [string]}.
```

**3d. Recommendation route — Cursor Agent Prompt:**
```
Implement app/api/ai/recommend/route.js (POST {missingTopics,
experienceLevel, learningStyle}). Create lib/recommender.js exporting
a pure function `scoreResource(resource, { topic, experienceLevel })`
returning a numeric score (topic overlap weighted highest, difficulty
match next, small bonus for type diversity across the picks). In the
route, for each missing topic query "resources" by topics array
overlap, score and sort candidates, return top 3 per topic.
```

**3e. Path generator route — Cursor Agent Prompt:**
```
Implement app/api/ai/generate-path/route.js (POST {learnerId, goal,
missingTopicsWithResources}). Order milestones per the already-sorted
missingTopics order (already topologically valid from skill-gap step).
Build one batched LLM prompt asking for a JSON array of {topic,
title, description, estimatedDuration} for all milestones in one call
(avoid N separate LLM calls). Assemble the full learning_paths +
milestones documents matching the schema in diagrams.md, insert into
MongoDB, and return the roadmap JSON.
```

**3f. Explanation & Q&A route — Cursor Agent Prompt:**
```
Implement app/api/ai/explain/route.js (POST {learnerId, milestoneId,
question}). Fetch only the relevant learner_profiles doc + the
specific milestone + its resources from MongoDB (grounded context).
Build a short LLM prompt including just that context, and: if
question is falsy, ask for a 2-3 sentence "why this was recommended"
explanation referencing a real profile fact; if question is provided,
answer it using the same context. Cap the response around 120 words
in the prompt instructions.
```

**Checklist:**
- [ ] All 6 AI routes tested independently (curl/Thunder Client)
- [ ] LLM calls never crash a route on malformed JSON — always return a
      valid response or a clean 500 error shape

---

## Phase 4 — Orchestration + Progress Routes (Owner: M1 & M5, Issues #11, #13)

**Cursor Agent Prompt:**
```
Implement app/api/path/generate/route.js (POST, no body — uses the
session user). Import and call the skill-gap, recommend, and
generate-path logic as plain JS functions (extract the core logic out
of each route handler into lib/ functions so this route can call them
directly in-process instead of doing HTTP fetches to itself — much
faster on Vercel). Persist and return the final roadmap.

Implement app/api/path/route.js (GET) — return the current learner's
active learning_paths doc + its milestones.

Implement app/api/progress/route.js (GET) — aggregate: percentComplete,
skillsGained (topics from completed milestones), currentMilestone,
nextRecommendedAction.

Implement app/api/milestone/[id]/status/route.js (PATCH {status,
feedback}) — update the milestone doc and insert a progress_logs
entry. If status is "struggling" or feedback looks negative, call the
generate-path logic in-process again, passing only the remaining
(not-completed) milestones' topics, and replace them in the roadmap
(leave completed milestones untouched).
```

**Checklist:**
- [ ] Full chain works: generate path -> get path -> update milestone
      status -> progress reflects the change
- [ ] "Struggling" status visibly regenerates only the remaining
      milestones

---

## Phase 5 — Frontend (Owners: M3 onboarding/auth, M4 roadmap/dashboard)

**5a. Chat onboarding — Cursor Agent Prompt (M3):**
```
Build app/onboarding/page.jsx (Client Component, "use client") — a
chat-style UI where the learner types free-text goals, posting each
message to /api/ai/parse-goal. Show the AI's follow-up questions and a
small profile-completeness progress bar. When missingFields is empty,
call POST /api/profile then POST /api/path/generate, then
router.push('/roadmap'). Components: components/ChatBubble.jsx,
components/ChatInput.jsx, components/TypingIndicator.jsx. Tailwind
styling, minimal and clean.
```

**5b. Roadmap visualization — Cursor Agent Prompt (M4):**
```
npm install reactflow. Build app/roadmap/page.jsx using React Flow:
fetch GET /api/path, render milestones as nodes in order with
prerequisite edges, node color/badge by status (locked/in-progress/
completed). Clicking a node opens a side panel showing its resources
(title, type, link, difficulty) and calls POST /api/ai/explain to show
"why recommended" text, plus a small input for follow-up questions
about that milestone.
```

**5c. Dashboard — Cursor Agent Prompt (M4):**
```
npm install recharts. Build app/dashboard/page.jsx — fetch GET
/api/progress and render: completion % (a simple radial/progress
ring), skills-gained bar chart (recharts), milestone timeline
(simple stepper component), and a "next recommended action" card
linking into /roadmap at that milestone's node.
```

**5d. Auth pages + settings + layout — Cursor Agent Prompt (M3):**
```
Build app/login/page.jsx, app/register/page.jsx, app/settings/page.jsx
(edit profile fields manually) wired to the auth/profile API routes.
Create middleware.js that checks the "token" cookie and redirects
unauthenticated users away from /onboarding, /roadmap, /dashboard,
/settings to /login. Build components/Navbar.jsx and a shared
app/layout.jsx with Tailwind styling applied globally.
```

**Checklist:**
- [ ] Full user journey clickable end-to-end in the browser
- [ ] Loading/error states present on every async call

---

## Phase 6 — Integration, QA & Adaptive Loop (Owner: M5, with support)

**Cursor Agent Prompt:**
```
Walk through and fix the full flow: register -> onboarding chat ->
profile saved -> path generated -> roadmap rendered -> mark a
milestone "struggling" -> confirm the remaining path updates ->
dashboard reflects new progress. Add try/catch + user-facing error
states for every fetch call in the frontend (toast or inline message).
Ensure every Route Handler returns a consistent
{error:true, message} JSON shape on failure with an appropriate status
code. Write a TESTING.md checklist covering each step above.
```

---

## Phase 7 — Deployment (Owner: M5, Issue #17) — 100% free, single platform

**Steps:**
1. **MongoDB Atlas** — create a free M0 shared cluster, whitelist
   `0.0.0.0/0` for hackathon simplicity, copy the connection string.
2. **Vercel** — import the GitHub repo as a new Vercel project (auto-
   detects Next.js). In Project Settings → Environment Variables, add
   MONGODB_URI, JWT_SECRET, GROQ_API_KEY, GEMINI_API_KEY for
   Production + Preview.
3. Push to `main` — Vercel auto-builds and deploys. Every PR also gets
   its own preview URL automatically, useful for reviewing teammates'
   feature branches before merging.
4. Run the seed script once locally (or as a one-off `vercel env pull`
   + local run) pointed at the Atlas cluster to populate `resources`.
5. Add the deployed URL to the top of README.md.

**Why this is faster than the Spring Boot + FastAPI setup:** everything
runs as Vercel serverless functions on the same platform as the
frontend — no separate free-tier container service that spins down
after inactivity, so there's no cold-start delay during the demo.

---

## Phase 8 — Documentation & Demo (Owner: M5 + whole team)

- [ ] Solution Documentation PDF/PPT: problem understanding, approach,
      architecture (paste diagrams.md renders), AI/ML techniques,
      features/workflows, challenges faced.
- [ ] 3–5 min demo video: onboarding -> roadmap -> dashboard -> adaptive
      re-plan in one continuous walkthrough.
- [ ] Final README polish.
- [ ] ZIP the source (excluding node_modules, .next/, .env.local).

---

## Suggested commit cadence

Each phase above = one feature branch + PR reviewed by at least one
other teammate before merging to main, so the commit history clearly
shows incremental development (required by submission guidelines).
