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

REM Show current git status
echo Current git status:
git status

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

REM Check for existing remotes
echo Checking existing remotes:
git remote -v

REM Setup remote repository
set /p repo_url="Enter GitHub repository URL (or press Enter for default): "
if "%repo_url%"=="" set repo_url=https://github.com/Shreyanshdiwakar/Eon.git
echo Using repository URL: %repo_url%

REM Add remote origin
echo Setting up remote repository...
git remote remove origin 2>nul
git remote add origin %repo_url%
echo Remote repository set.

REM Verify credentials
echo Checking GitHub authentication...
git config --get user.name
git config --get user.email

REM Check if main or master branch
echo Checking current branch:
git branch

REM Push to GitHub with verbose output
echo Pushing to GitHub (this may ask for your GitHub credentials)...
echo If this is your first time, use a Personal Access Token as your password

git push -v -u origin master
if %errorlevel% neq 0 (
    echo Master branch push failed. Trying main branch instead...
    git push -v -u origin main
)

REM Verify the push
echo Verifying push status...
git remote show origin

echo ======================================
echo If push appears successful but changes aren't showing on GitHub:
echo 1. Make sure you're looking at the correct repository
echo 2. Try running: git push -f origin master  (or main)
echo 3. Check if authentication succeeded (no error messages above)
echo 4. Verify your repository URL is correct: %repo_url%
echo ======================================
echo Process complete!
pause
