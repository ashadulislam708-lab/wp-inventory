# Git Workflow & Commit Standards

## 🎯 Overview

This project uses **Husky** to enforce code quality and commit standards through Git hooks. All checks run automatically when you commit or push code.

Additionally, **linting runs automatically in watch mode** during development (`npm run start:dev`) to show you errors and warnings in real-time as you code.

---

## 🚀 Development Mode with Real-Time Linting

When you start the development server, ESLint runs automatically in watch mode alongside your application:

```bash
npm run start:dev
```

This will:

- ✅ Start the NestJS server in watch mode
- ✅ Run ESLint in watch mode (shows errors/warnings as you save files)
- ✅ Display both outputs side-by-side with colored prefixes

**Benefits:**

- See linting errors/warnings immediately as you code
- Fix issues before committing
- No surprises during git push
- Better developer experience

---

## 🔧 Git Hooks Setup

### Pre-Commit Hook (Fast - Staged Files Only)

Runs automatically when you `git commit`:

- ✅ **ESLint**: Lints and auto-fixes TypeScript files
- ✅ **Prettier**: Formats code automatically
- ✅ **Only staged files**: Fast execution

### Pre-Push Hook (Thorough - Full Project)

Runs automatically when you `git push`:

- ✅ **Type Check**: Validates TypeScript compilation
- ✅ **Lint Check**: Validates entire project
- ✅ **Tests**: Runs all unit tests
- ✅ **Build**: Ensures project builds successfully

### Commit-Msg Hook

Runs automatically when you `git commit`:

- ✅ **Conventional Commits**: Validates commit message format

---

## 📝 Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format Structure:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:

| Type       | Description                  | Example                            |
| ---------- | ---------------------------- | ---------------------------------- |
| `feat`     | New feature                  | `feat: add user authentication`    |
| `fix`      | Bug fix                      | `fix: resolve login timeout issue` |
| `docs`     | Documentation only           | `docs: update API documentation`   |
| `style`    | Code style (no logic change) | `style: format code with prettier` |
| `refactor` | Code refactoring             | `refactor: simplify user service`  |
| `perf`     | Performance improvement      | `perf: optimize database queries`  |
| `test`     | Add or update tests          | `test: add unit tests for auth`    |
| `build`    | Build system changes         | `build: update webpack config`     |
| `ci`       | CI/CD changes                | `ci: add GitHub Actions workflow`  |
| `chore`    | Other changes                | `chore: update dependencies`       |
| `revert`   | Revert previous commit       | `revert: revert commit abc123`     |

### Examples:

✅ **Valid Commits:**

```bash
git commit -m "feat: add JWT authentication"
git commit -m "fix: resolve memory leak in user service"
git commit -m "docs: update README with setup instructions"
git commit -m "refactor(auth): simplify token validation logic"
```

❌ **Invalid Commits:**

```bash
git commit -m "added new feature"           # Missing type
git commit -m "Fix: bug fix"                 # Type should be lowercase
git commit -m "feat: Added new feature."     # Should not end with period
git commit -m "update"                       # No type specified
```

### Commit with Body and Footer:

```bash
git commit -m "feat: add user profile endpoint

Add new GET /users/:id/profile endpoint that returns
detailed user information including bio and preferences.

Closes #123
```

---

## 🚀 Workflow Examples

### Example 1: Making Changes

```bash
# 1. Create a new branch
git checkout -b feat/user-profile

# 2. Make changes to files
vim src/modules/users/user.controller.ts

# 3. Stage changes
git add .

# 4. Commit (pre-commit hook runs automatically)
git commit -m "feat: add user profile endpoint"

# 🔍 Pre-commit hook runs:
#   ✅ ESLint fixes code
#   ✅ Prettier formats code
#   ✅ Changes auto-added to commit

# 5. Push (pre-push hook runs automatically)
git push origin feat/user-profile

# 🚀 Pre-push hook runs:
#   ✅ Type checking
#   ✅ Full lint check
#   ✅ All tests pass
#   ✅ Build succeeds
```

### Example 2: Hook Failure

```bash
# Try to commit with invalid message
git commit -m "added feature"

# ❌ Output:
# ⧗   input: added feature
# ✖   subject may not be empty [subject-empty]
# ✖   type may not be empty [type-empty]

# Fix and try again
git commit -m "feat: add feature"
# ✅ Success!
```

### Example 3: Skipping Hooks (Not Recommended)

```bash
# Skip pre-commit hook (USE WITH CAUTION)
git commit -m "feat: quick fix" --no-verify

# Skip pre-push hook (USE WITH CAUTION)
git push --no-verify
```

⚠️ **Warning**: Only skip hooks in emergency situations. Your code quality will suffer!

---

## 🛠️ Available NPM Scripts

### Linting

```bash
npm run lint              # Auto-fix linting issues
npm run lint:check        # Check linting without fixing
```

### Formatting

```bash
npm run format            # Format all TypeScript files
npm run format:check      # Check formatting without fixing
```

### Linting

```bash
npm run lint              # Auto-fix linting issues
npm run lint:check        # Check linting without fixing
npm run lint:watch        # Watch mode - shows errors as you save
```

### Formatting

```bash
npm run format            # Format all TypeScript files
npm run format:check      # Check formatting without fixing
```

### Type Checking

```bash
npm run type-check        # Validate TypeScript compilation
npm run type-check:watch  # Watch mode - continuous type checking
```

### Testing

```bash
npm run test              # Run tests in watch mode
npm run test:ci           # Run tests for CI/CD
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run end-to-end tests
```

### Building

```bash
npm run build             # Build the project
```

---

## 🔍 Debugging Hooks

### View Hook Output

Hooks will show detailed output when they run:

```bash
🔍 Running pre-commit checks...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✔ Preparing lint-staged...
✔ Running tasks for staged files...
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Pre-commit checks passed!
```

### Check Which Files Are Staged

```bash
git status
git diff --cached --name-only
```

### Test Hooks Manually

```bash
# Test pre-commit hook
npx lint-staged

# Test commit message
echo "feat: test" | npx commitlint

# Test pre-push checks
npm run type-check && npm run lint:check && npm run test:ci && npm run build
```

---

## 📦 Configuration Files

### `.lintstagedrc.json`

Defines what commands run on staged files:

```json
{
  "*.ts": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

### `commitlint.config.js`

Defines commit message rules:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', ...]],
    'header-max-length': [2, 'always', 100],
  },
};
```

### `.husky/` Directory

Contains Git hook scripts:

- `pre-commit` - Runs lint-staged
- `pre-push` - Runs type-check, lint, tests, build
- `commit-msg` - Validates commit message format

---

## 🎓 Best Practices

### 1. Commit Frequently

Make small, focused commits that are easy to review:

```bash
✅ git commit -m "feat: add user entity"
✅ git commit -m "feat: add user repository"
✅ git commit -m "feat: add user service"

❌ git commit -m "feat: add entire user module"  # Too big
```

### 2. Write Descriptive Subjects

```bash
✅ git commit -m "fix: resolve null pointer in user service"
❌ git commit -m "fix: bug fix"
```

### 3. Use Scopes for Clarity

```bash
✅ git commit -m "feat(auth): add JWT token refresh"
✅ git commit -m "fix(users): resolve email validation"
✅ git commit -m "test(features): add integration tests"
```

### 4. Reference Issues

```bash
git commit -m "fix: resolve login timeout

Increased timeout from 5s to 10s to handle slow connections.

Closes #456
Refs #123"
```

### 5. Before Pushing

Always ensure:

- ✅ All tests pass locally: `npm run test`
- ✅ Build succeeds: `npm run build`
- ✅ No TypeScript errors: `npm run type-check`
- ✅ Code is formatted: `npm run format`

---

## 🆘 Troubleshooting

### Hook Not Running?

```bash
# Reinstall Husky hooks
rm -rf .husky
npm run prepare
```

### Hook Permission Issues (Unix/Mac)?

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
chmod +x .husky/commit-msg
```

### Bypass Hook in Emergency?

```bash
# Use --no-verify (NOT RECOMMENDED)
git commit -m "feat: emergency fix" --no-verify
git push --no-verify
```

### Check Hook Installation

```bash
# Verify hooks are installed
ls -la .husky/

# Should see:
# pre-commit
# pre-push
# commit-msg
```

---

## 📚 Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [commitlint Documentation](https://commitlint.js.org/)

---

## ✅ Quick Reference

```bash
# Good commit examples
git commit -m "feat: add user authentication"
git commit -m "fix: resolve memory leak"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify auth logic"
git commit -m "test: add unit tests for users"

# Run checks manually
npm run lint              # Auto-fix linting
npm run format            # Format code
npm run type-check        # Check TypeScript
npm run test              # Run tests
npm run build             # Build project

# Test hooks manually
npx lint-staged           # Test pre-commit
npm run test:ci           # Test part of pre-push
```

---

**Remember**: These hooks are here to help maintain code quality, not to slow you down. If you find them too restrictive, let's discuss adjusting the configuration! 🚀
