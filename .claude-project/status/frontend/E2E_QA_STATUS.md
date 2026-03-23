# E2E QA Status: glam-lavish (Frontend)

## Overview

This document tracks end-to-end test coverage for the frontend application.

**Tech Stack:** Playwright, TypeScript, Page Object Model

**Last Updated:** YYYY-MM-DD

---

## Test Coverage Matrix

### Authentication

| URL (Route) | Test Scenario Name | Status | Lasted at |
|-------------|-------------------|--------|-----------|
| /login | Display login form | | |
| /login | Show validation errors for empty form | | |
| /login | Login with valid credentials | | |
| /login | Show error for invalid credentials | | |
| /signup | Display signup form | | |
| /signup | Complete registration flow | | |
| /forgot-password | Request password reset | | |

### [Feature] Pages

<!-- Copy this section for each feature area -->

| URL (Route) | Test Scenario Name | Status | Lasted at |
|-------------|-------------------|--------|-----------|
| | | | |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| Not Started | Test not yet implemented |
| In Progress | Test currently being developed |
| Complete | Test implemented and passing |
| Skipped | Test exists but skipped (see test file for reason) |
| Blocked | Cannot implement due to dependency |

---

## Test Infrastructure

### Directory Structure

```
frontend/
├── playwright.config.ts              # Playwright configuration
└── test/
    ├── tests/                        # Test files by category
    │   ├── auth/
    │   │   ├── login.spec.ts
    │   │   └── signup.spec.ts
    │   └── [feature]/
    │       └── *.spec.ts
    ├── pages/                        # Page Object Models
    │   ├── base.page.ts
    │   └── auth/
    │       └── login.page.ts
    ├── fixtures/                     # Test fixtures
    │   └── auth.fixture.ts
    └── utils/                        # Test utilities
        └── test-helpers.ts
```

### Page Objects

| Page Object | File | Routes Covered |
|-------------|------|----------------|
| | | |

---

## Running Tests

### Prerequisites

1. **Start Backend Server**
```bash
cd backend && npm run start:dev
# Backend runs on http://localhost:3000
```

2. **Start Frontend Dev Server**
```bash
cd frontend && npm run dev
# Frontend runs on http://localhost:5173
```

3. **Ensure Test Users Exist**

| Role | Username | Password |
|------|----------|----------|
| | | |

### Commands

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- test/tests/auth/login.spec.ts

# Run tests with UI mode (debugging)
npm run test:e2e:ui

# Run tests in headed browser
npm run test:e2e:headed

# Generate tests by recording actions
npm run test:e2e:codegen

# View test report
npm run test:e2e:report
```

---

## Test Summary

| Category | Total | Complete | Skipped | Not Started |
|----------|-------|----------|---------|-------------|
| Authentication | | | | |
| [Feature] | | | | |
| **Total** | | | | |

---

## Known Gaps & TODOs

### High Priority

| Route | Gap | Reason |
|-------|-----|--------|
| | | |

### Medium Priority

| Route | Gap | Reason |
|-------|-----|--------|
| | | |

---

## Notes

<!-- Add test infrastructure notes, patterns used, blockers -->
