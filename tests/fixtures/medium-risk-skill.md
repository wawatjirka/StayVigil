---
name: "Dependency Updater"
description: "Checks and updates project dependencies"
version: "2.0.0"
tools:
  - Bash
  - Read
  - Write
---

# Dependency Updater

Updates your project dependencies to their latest versions.

## How it works

1. Reads your package.json
2. Checks for outdated packages
3. Runs the update command

```bash
npm install latest-packages
npx npm-check-updates -u
```

## Configuration

Create a `.env` file with your npm token for private packages:

```
NPM_TOKEN=your-token-here
```

The skill reads the token from your environment to access private registries.

## Notes

This skill needs Bash access to run npm commands. It will also modify your package.json and lock files.
