#!/usr/bin/env bash

set -euo pipefail

DEV_BRANCH="dev"

if [[ ${1-} == "" ]]; then
  echo "Usage: $0 <release-name-or-version>" >&2
  exit 1
fi

RELEASE_NAME="$1"
RELEASE_BRANCH="release/${RELEASE_NAME}"

# Ensure clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

echo "Fetching latest refs..."
git fetch --all --prune

echo "Checking out ${DEV_BRANCH} and updating..."
git checkout "${DEV_BRANCH}"
git pull --rebase --autostash || git pull --rebase

if git rev-parse --verify -q "${RELEASE_BRANCH}" >/dev/null; then
  echo "Release branch ${RELEASE_BRANCH} already exists locally. Resuming..."
else
  echo "Starting git-flow release ${RELEASE_NAME} from ${DEV_BRANCH}..."
  git flow release start "${RELEASE_NAME}"
fi

echo "Pushing ${RELEASE_BRANCH} to origin..."
git push -u origin "${RELEASE_BRANCH}"

echo "Checking out ${RELEASE_BRANCH}..."
git checkout "${RELEASE_BRANCH}"

echo "Bumping version in package.json..."
# If the provided name looks like a semver, set it explicitly; otherwise bump patch
if [[ "${RELEASE_NAME}" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.+]+)?$ ]]; then
  export HUSKY=0
  npm version "${RELEASE_NAME}" --no-git-tag-version
else
  export HUSKY=0
  npm version patch --no-git-tag-version
fi

VERSION=$(node -p "require('./package.json').version")
echo "Version is now ${VERSION}. Committing change..."
git add package.json package-lock.json || true
git commit -m "chore(release): bump version to ${VERSION}"
git push

echo "Release branch ready: ${RELEASE_BRANCH} (version ${VERSION})"


