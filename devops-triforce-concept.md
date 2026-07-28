# Proposed Concept: The DevOps Triforce

Students assemble three artifacts representing the major parts of a delivery pipeline.

| Triforce Piece | DevOps Concept | Student Challenge |
|---|---|---|
| **Power** | Continuous Integration | Build, lint, and test the application |
| **Wisdom** | DevSecOps | Scan dependencies, protect secrets, and review code |
| **Courage** | Continuous Deployment | Approve and deploy the release |

The central rule is:

> **The Triforce must be assembled in the correct order.**  
> Deploy before testing or security validation, and Lord Ganonix corrupts the release.

## Story Premise

Lord Ganonix, the Shadow Deploy Lord, seeks to seize the DevOps Triforce before the pipeline is ready. Whenever developers bypass testing, ignore security scans, expose secrets, or deploy directly to production, his power grows.

A recurring warning throughout the site can read:

> **Do not assemble the Triforce before the gates are secure.**  
> Build, test, scan, review, then deploy—or Lord Ganonix will corrupt the release.

## Suggested Learning Path

### 1. The Kingdom Is in Peril

Students inherit an application with broken tests, insecure dependencies, and an unsafe deployment process.

They must inspect the project, identify weaknesses, and prepare to rebuild the delivery pipeline.

### 2. Temple of Power: Continuous Integration

Students learn how continuous integration protects the project through:

- Commits and pull requests
- Automated builds
- Code linting
- Unit tests
- Build artifacts
- Workflow status checks

Completing the temple restores the **Triforce of Power**.

### 3. Temple of Wisdom: DevSecOps

Students secure the development process through:

- Secret scanning
- Dependency review
- CodeQL analysis
- Least-privilege workflow permissions
- Protected branches
- Required pull-request reviews
- Environment approvals

Completing the temple restores the **Triforce of Wisdom**.

### 4. Temple of Courage: Continuous Deployment

Students learn how to release software safely through:

- GitHub Actions deployment workflows
- GitHub Pages configuration
- Deployment environments
- Workflow logs
- Approval gates
- Rollback and recovery procedures

Completing the temple restores the **Triforce of Courage**.

### 5. The Premature Triforce Scenario

Students encounter a deliberately unsafe workflow that deploys every commit directly to production without tests, reviews, or security checks.

Lord Ganonix captures the Triforce, and the site enters a corrupted state.

Students must repair the workflow by enforcing the correct pipeline:

```text
Commit
   ↓
Build
   ↓
Test
   ↓
Security Scan
   ↓
Review or Approval
   ↓
Deploy
```

### 6. The Final Battle

Students receive a vulnerable release containing several pipeline problems.

To defeat Lord Ganonix, they must:

1. Repair the build.
2. Make all tests pass.
3. Resolve security findings.
4. Protect the production environment.
5. Obtain approval for the release.
6. Deploy the restored application successfully.

The final victory pipeline is:

```text
Commit → Build → Test → Security Scan → Review → Deploy
```

## Lord Ganonix's Attacks

Each attack represents a common CI/CD or DevSecOps failure.

| Ganonix's Attack | DevOps Failure |
|---|---|
| **Corruption of Power** | Broken builds or failed tests |
| **Theft of Wisdom** | Skipped security scans or exposed secrets |
| **Shattering of Courage** | Failed or reckless deployments |
| **Shadow Merge** | Unreviewed code merged into `main` |
| **Dark Artifact** | Compromised or unverified build artifact |
| **The Secret Curse** | Credentials committed to the repository |
| **The Unprotected Gate** | Production deployment without approval |
| **Dependency Blight** | Vulnerable or outdated third-party package |

## Interactive Website Features

The GitHub Pages site could include:

- A clickable Triforce progress indicator
- Animated pipeline stages
- A simulated GitHub Actions console
- Safe-deployment and deploy-too-early choices
- Security challenge cards
- Short knowledge checks
- A final printable completion badge
- A hidden Ganonix workflow students must identify
- A comparison of CI, CD, DevOps, and DevSecOps
- A corruption meter showing Lord Ganonix's strength
- A pipeline health dashboard
- Achievement badges for completing each temple

Because GitHub Pages hosts static content, challenges should use simulated credentials and fictional secrets rather than collecting real passwords, tokens, or sensitive information.

## Repository Structure

```text
devops-triforce/
├── index.html
├── power.html
├── wisdom.html
├── courage.html
├── final-battle.html
├── css/
│   └── style.css
├── js/
│   ├── progress.js
│   └── challenges.js
├── assets/
│   ├── icons/
│   └── backgrounds/
├── tests/
│   └── site.test.js
└── .github/
    └── workflows/
        ├── ci.yml
        ├── security.yml
        └── deploy.yml
```

The project should practice what it teaches:

- Pull requests trigger build, lint, and test jobs.
- Security scans run before deployment.
- Changes to `main` deploy only after required checks pass.
- The production environment can require approval.
- GitHub Pages hosts the final learning experience.

## Site Identity

### Recommended Title

# DevOps Triforce: Rise of Lord Ganonix

### Subtitle

> Master CI/CD, secure the pipeline, and stop the Shadow Deploy Lord from corrupting production.

### Alternative Titles

- **The DevOps Triforce**
- **Pipeline of the Triforce**
- **The Shadow Deployment**
- **Lord Ganonix and the Broken Build**
- **Guardians of the Deployment Gate**

## Visual Direction

The project should be inspired by classic fantasy-adventure games without copying protected characters, logos, music, artwork, or other franchise assets.

Possible original visual elements include:

- Three glowing triangular artifacts
- A fantasy kingdom represented as a software environment
- Temples representing CI, security, and deployment
- An original armored villain called Lord Ganonix
- A dark production castle
- Pipeline gates, build forges, test chambers, and security wards
- Original icons for builds, tests, scans, reviews, and deployments

This approach preserves the recognizable adventure metaphor while giving the project its own identity.

## Core Learning Message

The DevOps Triforce is not complete simply because code reaches production. A successful release requires all three forces to remain in balance:

- **Power** ensures the software builds and functions correctly.
- **Wisdom** ensures the software and pipeline are secure.
- **Courage** ensures the team can release responsibly and recover when failures occur.

When developers rush the process or bypass the gates, Lord Ganonix gains control. When they build, test, scan, review, and deploy in the correct order, the kingdom—and production—remain secure.
