# Husky Setup - Quick Reference

## ✅ Installation Complete!

Your project now has Git hooks configured to maintain code quality.

---

## 🔄 What Happens When You Commit?

```bash
git add .
git commit -m "feat: add new feature"
```

**Pre-commit hook runs automatically:**

1. ✅ ESLint checks and fixes TypeScript files
2. ✅ Prettier formats your code
3. ✅ Only staged files are checked (fast!)

**Commit-msg hook validates:**

- ✅ Commit message follows conventional commits format

---

## 🚀 What Happens When You Push?

```bash
git push origin your-branch
```

**Pre-push hook runs automatically:**

1. ✅ Type checks entire project (`npm run type-check`)
2. ✅ Lints entire project (`npm run lint:check`)
3. ✅ Runs all tests (`npm run test:ci`)
4. ✅ Builds project (`npm run build`)

---

## 📝 Valid Commit Messages

```bash
✅ feat: add user authentication
✅ fix: resolve login bug
✅ docs: update README
✅ refactor: simplify auth logic
✅ test: add unit tests
✅ chore: update dependencies

❌ added feature         # Missing type
❌ Fix: bug             # Type must be lowercase
❌ feat: add feature.   # No period at end
```

---

## 🛠️ Manual Commands

### Run Pre-Commit Checks Manually

```bash
npx lint-staged
```

### Run Pre-Push Checks Manually

```bash
npm run type-check
npm run lint:check
npm run test:ci
npm run build
```

### Test Commit Message

```bash
echo "feat: test message" | npx commitlint
```

### Auto-Fix Code Issues

```bash
npm run lint              # Fix linting issues
npm run format            # Format code
```

---

## 🚨 Bypass Hooks (Emergency Only!)

```bash
# Skip hooks (NOT RECOMMENDED)
git commit --no-verify
git push --no-verify
```

⚠️ Only use this in emergencies!

---

## 📦 Files Added/Modified

- `.husky/pre-commit` - Runs lint-staged
- `.husky/pre-push` - Runs type-check, lint, tests, build
- `.husky/commit-msg` - Validates commit messages
- `.lintstagedrc.json` - Configures what lint-staged does
- `commitlint.config.js` - Defines commit message rules
- `package.json` - Added scripts and prepare hook

---

## 🎓 Full Documentation

For detailed information, see: [`docs/GIT-WORKFLOW-GUIDE.md`](./GIT-WORKFLOW-GUIDE.md)

---

## 🆘 Troubleshooting

### Hooks not running?

```bash
npm run prepare
```

### Need to reinstall?

```bash
rm -rf .husky
npm run prepare
```

---

**🎉 You're all set! Happy coding with quality checks!**
