# AI-Powered Personalized Learning Path Recommender — Diagrams (Next.js Edition)

## 1. System Architecture

```mermaid
graph TB
    subgraph Browser["Browser"]
        UI[Chat / Onboarding UI]
        DASH[Progress Dashboard]
        ROADMAP[Learning Path View]
    end

    subgraph Vercel["Next.js App (JavaScript) — Vercel"]
        subgraph Pages["App Router Pages"]
            P1["/onboarding"]
            P2["/roadmap"]
            P3["/dashboard"]
            P4["/login /register"]
        end

        subgraph API["Route Handlers (app/api/*)"]
            A_AUTH["/api/auth/*"]
            A_PROFILE["/api/profile"]
            A_CHAT["/api/ai/parse-goal"]
            A_GAP["/api/ai/skill-gap"]
            A_RECO["/api/ai/recommend"]
            A_PATH["/api/ai/generate-path"]
            A_EXPLAIN["/api/ai/explain"]
            A_PROGRESS["/api/progress"]
            A_MILESTONE["/api/milestone/[id]/status"]
        end

        LIB["lib/ — mongodb.js, jwt.js, llmClient.js, recommender.js, skillTaxonomy.js"]
    end

    subgraph Data["MongoDB Atlas (Free M0)"]
        MONGO[(learners, learner_profiles,
        resources, learning_paths,
        milestones, progress_logs)]
    end

    subgraph External["Free LLM API"]
        LLM[Groq API - Llama 3
        or Gemini 1.5 Flash]
    end

    UI --> P1
    DASH --> P3
    ROADMAP --> P2

    Pages --> API
    API --> LIB
    LIB --> MONGO
    A_CHAT --> LLM
    A_PATH --> LLM
    A_EXPLAIN --> LLM
```

**Why this is simpler:** everything — frontend, auth, business logic,
and AI orchestration — lives in one Next.js codebase deployed as one
Vercel project. Route Handlers (`app/api/**/route.js`) run as Vercel
serverless/edge functions, calling MongoDB Atlas and the LLM API
directly via `fetch`. No separate backend service to deploy, no
cold-start "server sleeping" issue like a free Render instance.

## 2. Learner Onboarding & Profiling Flow

```mermaid
sequenceDiagram
    actor U as Learner
    participant FE as Onboarding Page (Client Component)
    participant API as /api/ai/parse-goal (Route Handler)
    participant LLM as Groq/Gemini
    participant DB as MongoDB Atlas

    U->>FE: Describes goal in natural language
    FE->>API: POST {message, sessionId, knownFields}
    API->>LLM: Structured-JSON extraction prompt
    LLM-->>API: {goal, domain, level, interests, missingFields}
    API->>DB: Upsert learner_profiles (partial)
    API-->>FE: {profile, followUpQuestion}
    FE-->>U: Shows AI's clarifying question
    U->>FE: Answers follow-ups (repeat until missingFields empty)
    FE->>API: POST /api/profile (finalize)
    API->>DB: Save finalized profile
    API-->>FE: {profileComplete: true}
    FE->>FE: Redirect to /roadmap (triggers path generation)
```

## 3. Learning Path Generation Flow

```mermaid
flowchart TD
    A[Finalized Learner Profile] --> B["/api/ai/skill-gap"]
    B --> C{Compare current skills vs goal requirements}
    C --> D[Missing topics, ordered by prerequisite]
    D --> E["/api/ai/recommend"]
    E --> F[(Query resources collection)]
    F --> G[Score by topic overlap + difficulty + type diversity]
    G --> H["/api/ai/generate-path"]
    H --> I[Topological sort into milestones]
    I --> J[LLM writes milestone titles/descriptions]
    J --> K[(Save to learning_paths + milestones)]
    K --> L[Return roadmap JSON]
    L --> M[Render on /roadmap with React Flow]
```

## 4. Adaptive Feedback Loop

```mermaid
stateDiagram-v2
    [*] --> PathAssigned
    PathAssigned --> InProgress: Learner starts milestone
    InProgress --> Completed: Marked complete
    InProgress --> Struggling: Low feedback / stuck
    Struggling --> PathAdjusted: PATCH /api/milestone/[id]/status
                                  triggers /api/ai/generate-path
                                  for remaining milestones only
    PathAdjusted --> InProgress: New resource suggested
    Completed --> NextMilestone: /api/progress recalculated
    NextMilestone --> InProgress
    NextMilestone --> GoalAchieved: All milestones done
    GoalAchieved --> [*]
```

## 5. Data Model (ER-style, unchanged)

```mermaid
erDiagram
    LEARNER ||--o{ LEARNER_PROFILE : has
    LEARNER ||--o{ LEARNING_PATH : owns
    LEARNING_PATH ||--o{ MILESTONE : contains
    MILESTONE ||--o{ RESOURCE : recommends
    LEARNER ||--o{ PROGRESS_LOG : generates
    MILESTONE ||--o{ PROGRESS_LOG : tracked_in

    LEARNER {
        string id
        string name
        string email
        string passwordHash
    }
    LEARNER_PROFILE {
        string learnerId
        list interests
        string experienceLevel
        list completedCourses
        string careerGoal
        string learningStyle
    }
    LEARNING_PATH {
        string id
        string learnerId
        string goal
        string status
        date createdAt
    }
    MILESTONE {
        string id
        string pathId
        string title
        list prerequisites
        int order
        string status
        string explanation
    }
    RESOURCE {
        string id
        string title
        string type
        string url
        string difficulty
        list topics
    }
    PROGRESS_LOG {
        string id
        string learnerId
        string milestoneId
        string status
        date updatedAt
    }
```

## 6. Deployment Architecture (Free, single platform)

```mermaid
graph LR
    subgraph Vercel[Vercel - Free Hobby Tier]
        NEXT[Next.js App
        Pages + API Route Handlers]
    end
    subgraph Atlas[MongoDB Atlas - Free M0]
        DB[(Shared Cluster)]
    end
    subgraph GroqCloud[Groq Cloud - Free API]
        LLM[Llama 3 Inference]
    end

    Browser -->|HTTPS| NEXT
    NEXT -->|mongodb+srv| DB
    NEXT -->|REST API key| LLM
```

**Deployment note:** Vercel serverless functions are fast and don't
"sleep" the way a free Render/Railway web service does — this is the
main latency win over the Spring Boot + FastAPI split-service setup.
