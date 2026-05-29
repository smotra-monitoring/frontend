---
description: "Documentation requirements: new features must have a docs/features/ file, CHANGELOG entry, and updated docs/README.md; bug fixes must have a CHANGELOG entry. Use when implementing any feature or bug fix."
applyTo: "docs/**, CHANGELOG.md"
---

# Documentation

- API specification provided in OpenAPI format for easy integration and client generation available in `api/openapi/api/spec.yaml`.
- Guides and documentation for every feature located in the `docs/` directory, including setup instructions, usage guides, and troubleshooting tips.
- Refer to `docs/README.md` for an overview of the project and instructions for getting started.
- Refer to `docs/features/` for detailed descriptions and guides for each feature implemented in the project.

## Documentation Requirements

**New features MUST include:**
- A dedicated markdown file in `docs/features/<feature-name>.md` describing the feature, its design decisions, API, and usage examples.
- A `CHANGELOG.md` entry under `[Unreleased]` with the feature and a short description.
- Updated `docs/README.md` if a new feature doc is added (add link in the Feature Guides section).

**Bug fixes MUST include:**
- A `CHANGELOG.md` entry under `[Unreleased]` describing what was fixed and the root cause.

These documentation steps are non-negotiable — a feature is not complete until its docs exist.
