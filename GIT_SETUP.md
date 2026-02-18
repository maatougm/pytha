# School Hub - Git Setup Guide

This guide explains the git configuration for production-ready development.

## 🚀 Quick Start

```bash
# On Linux/Mac
./scripts/git-setup.sh

# On Windows
.\scripts\git-setup.bat
```

## 📋 What's Configured

### 1. Git Hooks (`.githooks/`)

**Pre-commit Hook** - Runs automatically before each commit:
- ✅ Blocks sensitive files (`.env`, `.pem`, `.key`)
- ✅ Checks for large files (>10MB)
- ✅ Detects merge conflict markers
- ✅ Warns about `console.log` statements
- ✅ Runs linting checks

### 2. Git Attributes (`.gitattributes`)

Controls line endings:
- **Shell scripts** (`.sh`): LF (Unix)
- **Batch files** (`.bat`): CRLF (Windows)
- **Source code**: LF (cross-platform)
- **Binary files**: No conversion

### 3. Enhanced `.gitignore`

Protects against committing:
- Environment files (`.env`, `.env.production`)
- Dependencies (`node_modules/`)
- Build outputs (`build/`, `dist/`)
- IDE files (`.idea/`, `.vscode/`)
- Logs and uploads
- SSL certificates

## 🔒 Security Features

### Pre-commit Protection

The pre-commit hook prevents accidental commits of:

```
.env files        → BLOCKED
*.pem files       → BLOCKED
*.key files       → BLOCKED
password files    → BLOCKED
secret files      → BLOCKED
```

### Bypassing Hooks (Emergency)

If you need to bypass the pre-commit hook:

```bash
git commit --no-verify -m "Your message"
```

⚠️ **Warning**: Only use this in emergencies. Never commit secrets!

## 📝 Committing Changes

### Standard Workflow

```bash
# 1. Make your changes
# Edit files...

# 2. Stage changes
git add .

# 3. Commit (hooks run automatically)
git commit -m "feat: add new feature"

# 4. Push
git push origin main
```

### Commit Message Format

We recommend conventional commits:

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting (no code change)
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance tasks
```

Examples:
```bash
git commit -m "feat: add demo login buttons"
git commit -m "fix: resolve auth storage bug"
git commit -m "docs: update deployment guide"
```

## 🌿 Branch Strategy

### Main Branches

- **`main`** - Production-ready code
- **`develop`** - Development/integration branch
- **`feature/*`** - Feature branches
- **`hotfix/*`** - Emergency fixes

### Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push branch
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review, merge to main
```

## 🔧 Manual Configuration

If you need to configure git manually:

```bash
# Set hooks path
git config core.hooksPath .githooks

# Configure line endings
git config core.autocrlf input      # Linux/Mac
git config core.autocrlf true       # Windows

# Set pull behavior
git config pull.rebase true

# Set default push
git config push.default simple
```

## 🆘 Troubleshooting

### Hook Not Running

```bash
# Make hook executable (Linux/Mac)
chmod +x .githooks/pre-commit

# Or run setup script again
./scripts/git-setup.sh
```

### Line Ending Issues

```bash
# Normalize all files
git add --renormalize .
git commit -m "Normalize line endings"
```

### CRLF Warnings

These warnings are normal and can be ignored:
```
warning: in the working copy of 'file.txt', CRLF will be replaced by LF
```

Git is just informing you about the conversion.

## 📚 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Hooks Guide](https://githooks.com/)

## ✅ Pre-commit Checklist

Before committing, the hook checks:

- [ ] No sensitive files staged
- [ ] No files >10MB
- [ ] No merge conflicts
- [ ] No debug console statements
- [ ] Code passes linting

All checks must pass to commit.
