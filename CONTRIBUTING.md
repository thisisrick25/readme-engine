# Contributing to `readme-engine`

We welcome contributions to `readme-engine`. Before you get started, please take a moment to review these guidelines.

## 🤝 Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## 🚀 How to Contribute

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
5. **Test your changes** thoroughly (see [Testing](#-testing) section).
6. **Commit your changes** using [Conventional Commits](#-commit-messages).
7. **Push your branch** to your forked repository.
8. **Open a Pull Request** to the `main` branch of the original repository.

## 🛠️ Local Development Setup

To get `readme-engine` running on your local machine for development and testing:

1. **Install dependencies:**

   ```bash
   npm install
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

## ✅ Testing

Thorough testing is crucial. `readme-engine` provides two ways to test your changes locally:

### 1. Unit/Local Testing (`local-test.js`)

This method is ideal for quickly testing the core logic of the action without the overhead of a full GitHub Actions environment. It directly runs the `src/core.js` logic.

- **Purpose:** Fast iteration and debugging of the action's core functionality.
- **How to run:**

  ```bash
  node local-test.js
  ```

- **Output:** This will generate `local-output.md` in your project root, containing the updated README content based on your local changes.

### 2. Integration Testing (`local-test-workflow.yml` with `act`)

First, ensure you have `act` installed. `act` is a tool that allows you to run GitHub Actions locally. Follow the official installation guide: [https://github.com/nektos/act](https://github.com/nektos/act)

This method simulates the GitHub Actions environment using `act` and runs the actual workflow defined in `local-test-workflow.yml`. This provides a more accurate representation of how your action will behave on GitHub.

- **Purpose:** Verify the action's behavior within a simulated GitHub Actions workflow, including input/output handling and environment variables.
- **How to run:**

  ```bash
  act -b workflow_dispatch -W local-test-workflow.yml
  ```

- **Output:** This will also generate `local-output.md` in your project root. Check the console output for any errors or warnings from the workflow run.

## 📝 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for our commit messages. This helps in generating changelogs and understanding the history of the project.

Examples:

- `feat: add new plugin for notable contributions`
- `fix: resolve issue with PR fetching logic`
- `docs: update README with testing instructions`
- `chore: update dependencies`

## ➡️ Pull Request Guidelines

- Ensure your branch is up-to-date with the `main` branch.
- Provide a clear and concise description of your changes.
- Reference any related issues (e.g., `Closes #123`).
- Ensure all tests pass.

## 💅 Code Style and Linting

(Coming soon - details on code style and linting tools will be added here.)

## 📄 License

By contributing to `readme-engine`, you agree that your contributions will be licensed under its MIT License.
