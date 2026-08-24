# Current State of the Project

## What is implemented
- **Phase 0:** Project scaffolded, Tailwind CSS configured (v4), `.env` managed.
- **Phase 1:** Auth routes (register, login, me, logout) implemented using JWT cookies and bcrypt.
- **Phase 2:** Database schema and domain seed data implemented (`scripts/seedResources.mjs`).
- **Phase 3:** LLM pipeline setup (`lib/llmClient.js`), core AI routes (parsing, gap analysis, roadmap generation).
- **Phase 4:** Frontend UI scaffolded including Landing, Register, Login, Onboarding, Dashboard (Recharts), Roadmap (ReactFlow), Settings, Navbar, and Toast components.
- **Fix:** Fixed CSS `@import` order in `globals.css` (Tailwind CSS v4 compatibility) which was breaking the Next.js build.

## What is working
- Full build passes without errors (`npm run build`).
- Frontend pages are built and serve successfully.
- ReactFlow and Recharts components render successfully on the frontend.
- API endpoints exist for all major CRUD and AI operations.

## What is partially working
- The AI integration works in theory but depends heavily on the presence of valid `.env.local` keys (`GROQ_API_KEY`, `GEMINI_API_KEY`, `MONGODB_URI`). Wait for live test to verify edge cases in prompt generation.

## Current bugs/issues
- No active runtime issues detected. Build passes cleanly (with warnings about missing `MONGODB_URI` environment variable during static collection, which is expected without a `.env` in the CI/build context).

## Recent changes
- Fixed a broken Next.js build by reordering `@import url(...)` and `@import "tailwindcss"` in `app/globals.css`.
- Installed missing dependencies `reactflow` and `recharts`.
- Created `.ai-context/` directory to store AI synchronization notes.

## Current task
- Syncing up context and finalizing `.ai-context` structure.
- Committing the build fix.
- Preparing to start work on "the remaining things for this project as once we complete with the nextjs app, then next go with the remaining things like the python code etc..."

## Pending tasks
- Discover what the Python code refers to (was not in standard Next.js stack, possibly a data ingestion script, model training script, or backend microservice).
- Implement the requested Python code / remaining features.
- Final deployment configuration.

## Important configuration
- Next.js requires `jsconfig.json` for `@/*` aliases.
- Tailwind v4 configured via `postcss.config.mjs` and `@tailwindcss/postcss`.

## Important decisions
- Keep Next.js routing entirely in App Router.
- Stick to plain JavaScript, no TypeScript.
- Using `mongodb` native driver (cached) instead of Mongoose for performance.

## Next recommended work
- Commit the build fix to Git.
- Ask the user or search repo for specifications regarding the "Python code" to complete the final phase.
