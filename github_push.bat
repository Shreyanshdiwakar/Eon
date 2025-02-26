@echo off
echo GitHub Repository Setup and Push Script
echo ======================================

REM Initialize git repository if not already done
if not exist .git (
    echo Initializing git repository...
    git init
    echo Repository initialized.
) else (
    echo Git repository already exists.
)

REM Create a default .gitignore file if it doesn't exist
if not exist .gitignore (
    echo Creating default .gitignore...
    echo node_modules> .gitignore
    echo .DS_Store>> .gitignore
    echo Thumbs.db>> .gitignore
    echo *.log>> .gitignore
    echo .env>> .gitignore
    echo .gitignore created.
)

REM Add all files to staging
echo Adding files to staging...
git add .
echo Files added.

REM Commit changes
set /p commit_msg="Enter commit message (or press Enter for default message): "
if "%commit_msg%"=="" set commit_msg="Initial commit"
echo Committing changes with message: %commit_msg%
git commit -m "%commit_msg%"
echo Changes committed.

REM Setup remote repository
set /p repo_url="https://github.com/Shreyanshdiwakar/Eon.git"
if "%repo_url%"=="" (
    echo No repository URL provided. Exiting.
    exit /b 1
)

REM Add remote origin
echo Setting up remote repository...
git remote remove origin 2>nul
git remote add origin %repo_url%
echo Remote repository set.

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin master
if %errorlevel% neq 0 (
    echo Trying main branch instead...
    git push -u origin main
)
echo Repository pushed to GitHub.

echo ======================================
echo Process complete!
pause
