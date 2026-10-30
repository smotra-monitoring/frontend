## Security PR

<!--
Do not disclose unpatched vulnerabilities publicly beyond what is needed for this PR.
All four sections below are required. PRs missing any of them are closed.
See CONTRIBUTING.md#contribution-policy
-->

## 1. Vulnerability explanation (required)

- Affected component / files:
- Vulnerability type (e.g. XSS, token leakage, CSRF, open redirect, CWE id):
- Impact and severity:
- Attack scenario:

## 2. Steps to reproduce (required)

1.
2.
3.

Expected result:
Actual result:

## 3. Unit test reproducing the vulnerability (required)

- Test file: <!-- e.g. tests/unit/utils/url-utils.test.ts -->
- [ ] Test fails on the base branch without the fix
- [ ] Test passes with the fix

## 4. Proposed fix or mitigation (required)

<!-- Describe the fix, why it closes the vulnerability, and any trade-offs or remaining risk -->

## Checklist

- [ ] `CHANGELOG.md` entry under `[Unreleased]`
- [ ] `npm run build` and `npm test` pass
- [ ] No unrelated changes

## Contribution integrity

- [ ] I reproduced the vulnerability locally
- [ ] I can explain every line of this PR
- [ ] AI/LLM assistance: <!-- none / describe which tools and how they were used -->
