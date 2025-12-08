# Simple startup script for Dopamine CRM API

Write-Host "========================================"
Write-Host "🚀 Starting Dopamine CRM API..."
Write-Host "========================================"

# Set the path to the API directory
$apiPath = ".\dopamine-crm-api"

# Check if the API directory exists
if (-not (Test-Path $apiPath)) {
    Write-Host "❌ Error: API directory not found at '$apiPath'."
    Write-Host "Please ensure you are running this script from the project root."
    exit 1
}

# Navigate to the API directory
Set-Location $apiPath

# Check if node_modules exists, if not, run npm install
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 'node_modules' not found. Running 'npm install'..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: 'npm install' failed. Please check for errors."
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully."
} else {
    Write-Host "✅ Dependencies already installed."
}

# Start the development server
Write-Host "🔥 Starting the development server..."
Write-Host "API will be available at http://localhost:5000 (check .env for port)"
Write-Host "Press CTRL+C to stop the server."

npm run dev
