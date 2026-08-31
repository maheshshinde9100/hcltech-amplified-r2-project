# AI-Powered Personalized Learning Path Recommender

Built for **HCLTech Amplified Hackathon — Round 2**

An AI-powered platform that converts a learner's goal into a personalized, prerequisite-aware learning roadmap and adapts the path based on progress.

> **Note:** This project is currently **under development**.

## Problem

Online learning platforms provide a large number of courses, but learners often struggle to identify:

* What to learn first
* Which skills they are missing
* Which resources are relevant
* How different skills depend on each other

This project aims to solve this by generating a structured and personalized learning path.

## Key Features

* Natural-language learning goal input
* AI-powered learner profiling
* Skill-gap analysis
* Personalized course/resource recommendations
* Prerequisite-aware learning roadmap
* Explainable recommendations
* Progress tracking
* Adaptive re-planning based on learner feedback

## AI Approach

The project uses a combination of **Google Gemini and Groq** for LLM-powered features such as goal understanding, profile extraction, roadmap generation, and explanations.

A rule-based skill taxonomy and prerequisite graph are used alongside the LLM to improve learning-path sequencing and consistency.

## Tech Stack

* **Frontend:** Next.js, JavaScript, Tailwind CSS
* **Visualization:** Recharts, React Flow
* **Backend:** Next.js API Route Handlers
* **Database:** MongoDB Atlas
* **AI:** Google Gemini + Groq
* **Authentication:** JWT + bcryptjs
* **Deployment:** Vercel
* **CI:** GitHub Actions

## Architecture

```text
Browser
   |
   v
Next.js App
   |
   +---- MongoDB Atlas
   |
   +---- Google Gemini
   |
   +---- Groq
```

## Project Structure

```text
app/            Next.js pages and API routes
components/     Reusable UI components
lib/            Auth, MongoDB, LLM, recommendation and skill-graph logic
scripts/        Resource seeding
docs/           Architecture and solution documentation
```

## Local Setup

```bash
git clone https://github.com/maheshshinde9100/hcltech-amplified-r2-project.git
cd hcltech-amplified-r2-project
npm install
```

Create `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Run:

```bash
npm run dev
```

## Project Status

**Status: In Development**

Core architecture, AI integration, recommendation logic, and roadmap functionality are being developed and refined for the HCLTech Amplified Hackathon.

## Links

* **GitHub:** https://github.com/maheshshinde9100/hcltech-amplified-r2-project
* **Live App:** Coming soon
* **Demo Video:** Coming soon

## License

MIT
