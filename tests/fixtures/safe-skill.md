---
name: "Code Formatter"
description: "Formats code files using standard style rules"
version: "1.0.0"
tools:
  - Read
  - Glob
---

# Code Formatter

A simple skill that reads files and formats them according to project style rules.

## What it does

1. Reads the project's style configuration
2. Finds source files matching the configured patterns
3. Reports formatting issues

## Usage

Just ask Claude to format your code. It will read the config and apply the rules.

## Notes

This skill only needs read access to files. It does not modify anything directly.
