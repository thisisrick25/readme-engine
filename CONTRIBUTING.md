# Contributing to `readme-engine`

Contributions to `readme-engine` are welcomed and greatly appreciated. Before you get started, please take a moment to review these guidelines.

If you're looking to add a new feature, a great place to start is by [adding a new plugin](#adding-a-new-plugin).

## Prerequisites

### Before you begin, you will need the following installed on your system

- Node.js (v20.x or later)
- npm (usually comes with Node.js)
- Docker (docker engine must be installed and running for integration tests)
- act (for running GitHub Actions workflows locally)

## How to Contribute

1. **Fork** the repository on GitHub.
2. **Clone** your forked repository to your local machine.

   ```bash
   git clone https://github.com/your-username/readme-engine.git
   cd readme-engine
   ```

3. **Create a new branch** for your feature or bug fix.

   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Make your changes** and ensure they adhere to the project's coding style.
5. **Test your changes** thoroughly (see [Testing](#testing) section).
6. **Commit your changes** using [Conventional Commits](#commit-messages).
7. **Push your branch** to your forked repository.
8. **Open a Pull Request** to the `main` branch of the original repository.

## Local Development Setup

To get `readme-engine` running on your local machine for development and testing:

1. **Install dependencies:**

   ```bash
   npm ci
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root of your project with the following content:

   ```bash
   GITHUB_TOKEN=your_github_token
   GITHUB_USERNAME=your_github_username
   LOCAL_TEST_MODE=true
   ```

   Create a `.secrets` file in the root of your project with your GitHub Token:

   ```bash
   GITHUB_TOKEN=your_github_token
   ```

   _(Note: `act` will automatically pick up variables from `.env` and `.secrets` files.)_

3. **Build the action:**
   After making changes to the source code, you need to build the `dist` folder:

   ```bash
   npm run build
   ```

## Project Structure

```bash
.
├── .github/
│   └── workflows/
│       ├── release-please.yml   # Main CI/CD and release workflow
│       └── ...
├── dist/
│   └── index.js                 # The compiled, single-file output for the Action
├── scripts/
│   └── generate-plugin-registry.js # Auto-generates the plugin registry
├── src/
│   ├── core.ts                  # The central engine that orchestrates plugins
│   ├── index.ts                 # Main entry point for the GitHub Action
│   ├── types.ts                 # All shared TypeScript type definitions
│   └── plugins/
│       ├── prs/                 # Example: 'prs' plugin
│       │   └── index.ts
│       ├── notable-contributions/ # Example: 'notable-contributions' plugin
│       │   └── index.ts
│       └── index.ts               # ⛔ (Auto-Generated) The plugin registry. DO NOT EDIT.
└── tests/
│   ├── local-test.ts            # Script for a quick, visual run of the action
│   ├── local-template.md
│   └── local-test-workflow.yml    # Workflow file for `act` integration tests
│
├── action.yml                   # GitHub Action metadata file
├── CONTRIBUTING.md              # You are here!
├── package.json                 # Project dependencies and npm scripts
└── tsconfig.json                # TypeScript compiler configuration
```

## Testing

Thorough testing is crucial. `readme-engine` provides two ways to test your changes locally:

### 1. Unit/Local Testing

This method is ideal for quickly testing the core logic of the action without the overhead of a full GitHub Actions environment. It directly runs the `src/core.js` logic.

- **Purpose:** Fast iteration and debugging of the action's core functionality.
- **How to run:**

  ```bash
  npm run test:local
  ```

- **Output:** This will generate `local-output.md` in your project root, containing the updated README content based on your local changes.

### 2. Integration Testing (with `act`)

First, ensure you have `act` installed. `act` is a tool that allows you to run GitHub Actions locally. Follow the official installation guide: [https://github.com/nektos/act](https://github.com/nektos/act)

This method simulates the GitHub Actions environment using `act` and runs the actual workflow defined in `local-test-workflow.yml`. This provides a more accurate representation of how your action will behave on GitHub.

- **Purpose:** Verify the action's behavior within a simulated GitHub Actions workflow, including input/output handling and environment variables.
- **How to run:**

  ```bash
  npm run test:integration
  ```

  _(Note: This test requires Docker to be installed and the Docker engine to be running on your machine before you execute the script.)_

- **Output:** This will also generate `local-output.md` in your project root. Check the console output for any errors or warnings from the workflow run.

## Adding a New Plugin

Our system is designed to make adding new plugins easy.

1. **Create Plugin Files**: Create a new folder for your plugin inside `src/plugins/`. For a plugin named my-plugin, you would create `src/plugins/my-plugin/`.

2. **Implement the Plugin**: Inside this new folder, create an `index.ts` file. This file must export a default function that conforms to the Plugin type defined in `src/types.ts`.

   ```ts
   // src/plugins/my-plugin/index.ts
   import { Plugin } from "../../types.js";

   const myPlugin: Plugin = async (octokit, username, config) => {
     // Your plugin logic here...
     return `Hello, ${username}!`;
   };

   export default myPlugin;
   ```

3. That's It! The plugin registry is automatically updated. The next time you run npm test, `npm run test:local`, or `npm run build`, the pre script will run and automatically add your new plugin to `src/plugins/index.ts`.

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for our commit messages. This helps in generating changelogs and understanding the history of the project.

Examples:

- `feat: add new plugin for notable contributions`
- `fix: resolve issue with PR fetching logic`
- `docs: update README with testing instructions`
- `chore: update dependencies`

## Pull Request Guidelines

- Ensure your branch is up-to-date with the `main` branch.
- Provide a clear and concise description of your changes.
- Reference any related issues (e.g., `Closes #123`).
- Ensure all tests pass.

## Code Style and Linting

(Coming soon - details on code style and linting tools will be added here.)

## License

By contributing to `readme-engine`, you agree that your contributions will be licensed under its MIT License.
