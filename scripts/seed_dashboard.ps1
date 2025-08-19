# Requires: PowerShell 5+, backend running at http://localhost:4000
# This script will:
# 1) Create a test user (if needed) and log in
# 2) Create two projects
# 3) Create a diverse set of tasks across statuses, priorities, due dates, tags

$ErrorActionPreference = "Stop"

$Api = "http://localhost:4000"
$Email = "qa_dashboard@example.com"
$Password = "Passw0rd!"

function Invoke-JsonPost($Url, $Body, $Headers) {
  $json = $Body | ConvertTo-Json -Depth 10
  return Invoke-RestMethod -Method Post -Uri $Url -Headers $Headers -ContentType 'application/json' -Body $json
}

function Safe-LoginOrSignup {
  try {
    return Invoke-JsonPost "$Api/auth/login" @{ email = $Email; password = $Password } @{}
  } catch {
    Write-Host "Login failed, attempting signup..."
    return Invoke-JsonPost "$Api/auth/signup" @{ email = $Email; password = $Password; full_name = "QA Dashboard" } @{}
  }
}

Write-Host "Authenticating..."
$auth = Safe-LoginOrSignup
$token = $auth.token
if (-not $token) { throw "Failed to obtain token" }
$headers = @{ Authorization = "Bearer $token" }

Write-Host "Creating projects..."
$projA = Invoke-JsonPost "$Api/projects" @{ name = "Project A"; description = "QA Project A"; color = "#6b5aed" } @{}
$projB = Invoke-JsonPost "$Api/projects" @{ name = "Project B"; description = "QA Project B"; color = "#10b981" } @{}

function New-DueDate($offsetDays) {
  $d = Get-Date
  $d = $d.AddDays($offsetDays)
  # set time to 10:00 for stability
  $d = Get-Date -Date $d.ToString("yyyy-MM-dd 10:00:00")
  return $d.ToString("o")
}

$tasks = @(
  @{ title = "Urgent due today"; description = "Fix prod bug"; priority = "urgent"; due_date = (New-DueDate 0); tags = @("prod","bug"); estimated_duration = 60; project_id = $projA.id },
  @{ title = "High priority tomorrow"; description = "Prepare deck"; priority = "high"; due_date = (New-DueDate 1); tags = @("presentation"); estimated_duration = 90; project_id = $projA.id },
  @{ title = "Medium with no due"; description = "Write docs"; priority = "medium"; tags = @("docs","writing","internal","longtag"); estimated_duration = 45; project_id = $projB.id },
  @{ title = "Low, yesterday"; description = "Refactor utils"; priority = "low"; due_date = (New-DueDate -1); tags = @(); estimated_duration = 120; project_id = $projB.id },
  @{ title = "Done task today"; description = "Close ticket"; priority = "medium"; due_date = (New-DueDate 0); tags = @("ticket"); estimated_duration = 15; project_id = $projA.id },
  @{ title = "Very long title " * 5; description = "Very long description " * 20; priority = "high"; tags = @("lorem","ipsum"); estimated_duration = 0; project_id = $projA.id }
)

Write-Host "Creating tasks..."
foreach ($t in $tasks) {
  Invoke-JsonPost "$Api/tasks" $t $headers | Out-Null
}

# Mark one as done
$all = Invoke-RestMethod -Method Get -Uri "$Api/tasks" -Headers $headers
$done = $all | Where-Object { $_.title -like "*Done task today*" } | Select-Object -First 1
if ($done) {
  Invoke-RestMethod -Method Put -Uri "$Api/tasks/$($done.id)" -Headers $headers -ContentType 'application/json' -Body (@{ status = 'done'; completed_at = (Get-Date).ToString("o") } | ConvertTo-Json) | Out-Null
}

Write-Host "Seed complete. User: $Email"


