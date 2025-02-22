#!/bin/bash

# Replace these variables with your details
GITHUB_TOKEN="some_token"
OWNER="SkySingh04"
REPO="PRism"
DEFAULT_BRANCH="main"  # Replace with your default branch name (e.g., master)

# Fetch all branches
echo "Fetching branches from remote..."
BRANCHES=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/branches" | jq -r '.[].name')

if [ -z "$BRANCHES" ]; then
  echo "No branches found."
  exit 0
fi

# Loop through and delete branches
for BRANCH in $BRANCHES; do
  if [ "$BRANCH" != "$DEFAULT_BRANCH" ]; then
    echo "Deleting remote branch: $BRANCH..."
    # Delete remote branch
    curl -s -X DELETE -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/$OWNER/$REPO/git/refs/heads/$BRANCH"
    echo "Remote branch $BRANCH deleted."

    # Delete local branch
    if git branch --list | grep -q "$BRANCH"; then
      echo "Deleting local branch: $BRANCH..."
      git branch -D "$BRANCH"
    else
      echo "Local branch $BRANCH not found, skipping."
    fi
  else
    echo "Skipping default branch: $BRANCH"
  fi
done

echo "All non-default branches have been deleted from remote and local."
