#!/bin/bash

GITHUB_TOKEN=""
OWNER="SkySingh04"
REPO="PRism"

# Get all open pull requests
echo "Fetching open pull requests..."
PR_LIST=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/pulls?state=open")

# Extract PR numbers
PR_NUMBERS=$(echo "$PR_LIST" | jq -r '.[].number')

if [ -z "$PR_NUMBERS" ]; then
  echo "No open pull requests to close."
  exit 0
fi

# Close each pull request
for PR_NUMBER in $PR_NUMBERS; do
  echo "Closing PR #$PR_NUMBER..."
  curl -s -X PATCH -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"state": "closed"}' \
    "https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER" > /dev/null
  echo "PR #$PR_NUMBER closed."
done

echo "All open pull requests have been closed."
