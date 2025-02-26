@echo off
echo GitHub Push Verification Tool
echo ============================

echo 1. Checking git installation...
git --version
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in your PATH.
    goto :end
)

echo 2. Checking current repository status:
git status

echo 3. Checking remote configuration:
git remote -v

echo 4. Checking current branch:
git branch

echo 5. Testing GitHub connectivity:
git ls-remote
if %errorlevel% neq 0 (
    echo ERROR: Failed to connect to remote repository.
    echo This could be due to:
    echo - Authentication issues (try creating a personal access token)
    echo - Invalid repository URL
    echo - Network connectivity problems
    goto :end
)

echo 6. Checking last commit:
git log -1

echo 7. Attempting push with debug info:
set GIT_CURL_VERBOSE=1
git push -v
set GIT_CURL_VERBOSE=

echo 8. Recommended actions:
echo - If authentication failed, create a personal access token in GitHub
echo - If branch issues occurred, try "git push -u origin main" or "git push -u origin master"
echo - For "non-fast-forward" errors, try "git pull" first, then push again
echo - If all else fails, try a force push (with caution): "git push -f origin main"
echo - Ensure .git/config has the correct repository URL

:end
echo ============================
pause
