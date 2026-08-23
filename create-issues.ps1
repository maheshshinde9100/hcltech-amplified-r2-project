$ErrorActionPreference = "Stop"

$owner = "maheshshinde9100"
$repo = "hcltech-amplified-r2-project"

if (-not $env:GITHUB_TOKEN) {
    Write-Host "GITHUB_TOKEN is not set." -ForegroundColor Red
    Write-Host 'Run: $env:GITHUB_TOKEN = Read-Host "Enter GitHub token"'
    exit
}

$headers = @{
    Authorization = "Bearer $env:GITHUB_TOKEN"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$baseUrl = "https://api.github.com/repos/$owner/$repo"

$issues = @(
    @{
        title = "[Data] Course/Resource Catalog + Seed Script"
        labels = @("data", "priority-high")
        body = "Create a seed script to populate 150-250 learning resources across four technical domains. Include difficulty, topics, prerequisites, URLs, type, and estimated hours. Create a reusable skill taxonomy and prerequisite graph for skill-gap analysis."
    },
    @{
        title = "[AI] LLM Client Wrapper"
        labels = @("ai-ml", "priority-high")
        body = "Build a reusable LLM client using Groq as the primary provider and Gemini as fallback. Support JSON mode with parsing and one retry when invalid JSON is returned. Keep API keys server-side and make the wrapper reusable across AI features."
    },
    @{
        title = "[API] AI Goal Parser"
        labels = @("ai-ml", "api", "priority-high")
        body = "Create the conversational goal-parsing API for extracting learner goals from natural language. Identify goals, domain, target role, experience, interests, timeframe, and missing fields. Generate follow-up questions and progressively update the learner profile."
    },
    @{
        title = "[API] AI Skill-Gap Analyzer"
        labels = @("ai-ml", "api", "priority-high")
        body = "Build the skill-gap API using the predefined skill taxonomy and prerequisite graph. Compare current learner skills with the target goal and identify missing skills. Return missing topics in the correct prerequisite and learning order."
    },
    @{
        title = "[API] AI Recommendation Engine"
        labels = @("ai-ml", "api", "priority-high")
        body = "Build the resource recommendation API based on identified skill gaps. Score resources using topic relevance, difficulty compatibility, and resource-type diversity. Return the best learning resources for each missing topic from MongoDB."
    },
    @{
        title = "[API] AI Learning Path Generator"
        labels = @("ai-ml", "api", "priority-high")
        body = "Generate a structured personalized roadmap from missing skills and recommended resources. Use prerequisite ordering and an LLM call to create milestone titles and descriptions. Persist the generated learning path and milestones in MongoDB."
    },
    @{
        title = "[API] AI Explanation and Q&A"
        labels = @("ai-ml", "api", "priority-medium")
        body = "Create an AI endpoint that explains why a milestone or resource was recommended. Use relevant learner profile, milestone, and resource information as grounded context. Support learner questions and provide concise, personalized responses."
    },
    @{
        title = "[API] Progress + Milestone Status"
        labels = @("api", "priority-high")
        body = "Implement APIs for learner progress, milestone status, feedback, and next recommended action. Calculate completion percentage, skills gained, current milestone, and upcoming action. When a learner struggles, regenerate only the remaining milestones adaptively."
    },
    @{
        title = "[Frontend] Conversational Onboarding Chat UI"
        labels = @("frontend", "priority-high")
        body = "Build the conversational onboarding interface for collecting learner goals and profile information. Connect the chat to the goal parser and display follow-up questions and profile completeness. After completion, trigger skill-gap, recommendation, and roadmap generation."
    },
    @{
        title = "[API] Learning Path Orchestration"
        labels = @("api", "priority-high")
        body = "Create a server-side endpoint that runs skill-gap analysis, recommendations, and path generation. Use shared backend functions instead of internal HTTP requests between API routes. Persist and return the learner's complete personalized roadmap."
    },
    @{
        title = "[Frontend] Roadmap Visualization"
        labels = @("frontend", "priority-high")
        body = "Build the interactive learning roadmap using React Flow. Display milestones with prerequisite relationships and status-based visual states. Add milestone details with resources, AI explanations, and milestone-specific Q&A."
    },
    @{
        title = "[Frontend] Progress Dashboard"
        labels = @("frontend", "priority-medium")
        body = "Create the learner dashboard showing completion and skill development. Display progress statistics, milestone timeline, and the next recommended action. Connect the dashboard to the progress API and roadmap milestone navigation."
    },
    @{
        title = "[Frontend] Auth, Profile Settings + Layout"
        labels = @("frontend", "priority-medium")
        body = "Build login, registration, and profile/settings pages with a shared application layout. Add navigation and protected-route handling using the JWT authentication system. Apply consistent Tailwind styling across the application."
    },
    @{
        title = "[QA/Deploy] Integration Testing + Deployment + Documentation"
        labels = @("qa", "deployment", "docs", "priority-high")
        body = "Test the complete flow from registration and onboarding through roadmap generation and adaptive replanning. Deploy the application to Vercel with MongoDB Atlas and required environment variables. Prepare the solution documentation, GitHub repository, deployment link, and 3-5 minute demo video."
    }
)

Write-Host ""
Write-Host "Checking GitHub connection..." -ForegroundColor Cyan

try {
    $user = Invoke-RestMethod `
        -Uri "https://api.github.com/user" `
        -Headers $headers `
        -Method Get

    Write-Host "Authenticated as: $($user.login)" -ForegroundColor Green
}
catch {
    Write-Host "GitHub authentication failed." -ForegroundColor Red
    Write-Host "Check your GITHUB_TOKEN." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Getting existing issues..." -ForegroundColor Cyan

$existingIssues = Invoke-RestMethod `
    -Uri "$baseUrl/issues?state=all&per_page=100" `
    -Headers $headers `
    -Method Get

$existingTitles = @{}

foreach ($existing in $existingIssues) {
    $existingTitles[$existing.title] = $true
}

Write-Host ""
Write-Host "Creating issues..." -ForegroundColor Cyan
Write-Host ""

$createdCount = 0

foreach ($issue in $issues) {

    if ($existingTitles.ContainsKey($issue.title)) {
        Write-Host "SKIPPED: $($issue.title)" -ForegroundColor Yellow
        continue
    }

    $payload = @{
        title = $issue.title
        body = $issue.body
        labels = $issue.labels
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod `
            -Uri "$baseUrl/issues" `
            -Headers $headers `
            -Method Post `
            -Body $payload `
            -ContentType "application/json"

        Write-Host "CREATED #$($result.number): $($result.title)" -ForegroundColor Green
        $createdCount++
    }
    catch {
        Write-Host "FAILED: $($issue.title)" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Finished!" -ForegroundColor Green
Write-Host "Created: $createdCount issues" -ForegroundColor Green
Write-Host "View: https://github.com/$owner/$repo/issues" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan