#!/bin/bash

# Configuration
REPO_PATH="$(pwd)"
BRANCH_NAME="update-trigger-$(date +%s)"
COMMIT_MESSAGE="Update trigger.md with timestamp"
PR_TITLE="Automated PR: Update trigger.md"
PR_BODY="Automated PR to update trigger.md with current timestamp"

# # Ensure we're in a git repository
# if [ ! -d ".git" ]; then
#     echo "Error: Not a git repository"
#     exit 1
# fi

# Create new branch
git checkout -b "$BRANCH_NAME" || exit 1

# Update trigger.md
echo "Last updated: $(date)" >> trigger.md

# Stage, commit and push changes
git add trigger.md
git commit -m "$COMMIT_MESSAGE"

# Push to remote
git push https://<TOKEN>@github.com/SkySingh04/PRism.git "$BRANCH_NAME" || {
    echo "Error: Failed to push changes"
    git checkout main
    git branch -D "$BRANCH_NAME"
    exit 1
}

# Create PR using GitHub CLI (assumes gh is installed)
if command -v gh &> /dev/null; then
    gh pr create \
        --title "$PR_TITLE" \
        --body "$PR_BODY" \
        --base main \
        --head "$BRANCH_NAME"
else
    echo "GitHub CLI not found. Please install it or create PR manually:"
    echo "Branch: $BRANCH_NAME"
fi

# Cleanup
git checkout main