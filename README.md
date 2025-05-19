# APODS & AI-Automation Suite

A unified workspace that brings together:

* **APODS** – Automated Print-On-Demand System with secure biometric authentication  
* **MCP Server Manager** – cross-platform launcher for Model Context Protocol servers (memory, filesystem, Playwright, n8n, browserMCP, Bright Data, etc.)  
* **AI-Enhanced Dev Environment** – React + Tailwind UI, Monaco-powered IDE modules, live tests, CI/CD, and GitHub integration  
* **Aux Projects** – Raggedy Bears generator, Mean Monkeys game prototype, ProfilePays ad platform, grant/pitch discovery automations, and more

## Features

| Area | Highlights |
|------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui, Framer Motion, accessible dark/light themes |
| **Backend / Services** | Node.js micro-services, MCP servers, Python automation scripts, AI inference helpers |
| **CI/CD** | GitHub Actions: lint → unit tests → build → Playwright end-to-end tests |
| **Testing** | Vitest/Jest for TS/JS, Pytest for Python, Playwright for full-stack flows |
| **Quality** | ESLint, Prettier, flake8, isort; commit-lint & conventional commits workflow |
| **Licensing** | MIT |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/rblake2320/apods-ai-automation-suite.git && cd apods-ai-automation-suite

# 2. Install JS deps
pnpm install         # or npm i / yarn

# 3. Install Python deps (if used)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 4. Run dev servers
pnpm dev             # React/Vite frontend
pnpm dev:servers     # MCP Server Manager (cross-platform JSON config)
```

## Project Scripts (package.json)

| Script        | Purpose                                   |
| ------------- | ----------------------------------------- |
| `dev`         | start Vite + Tailwind watcher             |
| `dev:servers` | launch MCP Server Manager                 |
| `test`        | unit tests via Vitest/Jest                |
| `test:e2e`    | Playwright suite                          |
| `lint`        | ESLint + Prettier                         |
| `build`       | production build                          |
| `deploy`      | optional GitHub Pages / Docker image push |

## Folder Outline

```
.github/             – workflows & issue templates
apps/
  frontend/          – React UI
  backend/           – Node/Python services
  mcp-servers.json   – unified server config
scripts/             – automation & migration helpers
```

## Contributing

1. Fork ➜ create feature branch (`feat/...`)
2. Commit using Conventional Commits
3. Open PR → CI must pass
4. PR reviewed & merged into `main`

---

© 2025 Craig (see LICENSE)