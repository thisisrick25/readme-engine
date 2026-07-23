# readme-engine

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/thisisrick25/readme-engine/release-please.yml?branch=main)

A GitHub Action to dynamically update sections of your profile README. It features a plugin-based architecture, allowing you to easily showcase your latest GitHub activity right on your profile.

The action works by finding placeholder comments in your README and replacing the content between them with the output from the specified plugins.

## Features

- **Dynamic Content Generation:** Automatically updates sections of your README.
- **Extensible Plugin System:** Easily add new content types via plugins.
- **Pull Request Integration:** Display your latest merged PRs.
- **Automated Releases:** Integrated with Release Please for seamless versioning and publishing.

## Usage

To use this action, create a workflow file (e.g., `.github/workflows/update-readme.yml`) in your repository. Here is an example that runs the action every 6 hours:

```yaml
name: Update README

on:
  schedule:
    - cron: "0 */6 * * *" # Runs every 6 hours
  workflow_dispatch: # Allows manual triggering

jobs:
  update-readme:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Update README with readme-engine
        uses: thisisrick25/readme-engine@v2 # Use the latest major version
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PLUGINS: prs
```

Next, add the placeholder comments to your `README.md` file where you want the content to be injected. The tag name corresponds to the plugin name in uppercase.

```markdown
## My Recent Pull Requests

<!-- PRS:START -->
<!-- This content will be replaced by the `prs` plugin -->
<!-- PRS:END -->

## My Notable Open Source Contributions

<!-- NOTABLE-CONTRIBUTIONS:START -->
<!-- This content will be replaced by the `notable-contributions` plugin -->
<!-- NOTABLE-CONTRIBUTIONS:END -->
```

### Inputs

| Input Name      | Description                                                                   | Required |
| :-------------- | :---------------------------------------------------------------------------- | :------- |
| `GITHUB_TOKEN`        | The GitHub token to use for authentication.                                                                                                       | `true`   |
| `PLUGINS`             | A comma-separated list of plugins to run.                                                                                                         | `true`   |
| `PLUGIN_CONFIG`       | An optional JSON string for providing specific configurations to each plugin.                                                                     | `false`  |
| `COMMIT_AUTHOR_NAME`  | Optional. Name to attribute the automated commit to. Must be set together with `COMMIT_AUTHOR_EMAIL`, otherwise the commit is made by the token identity (`github-actions[bot]`). | `false`  |
| `COMMIT_AUTHOR_EMAIL` | Optional. Email to attribute the automated commit to. Must be verified on the target GitHub account to link the commit and count contributions. Must be set together with `COMMIT_AUTHOR_NAME`. | `false`  |

### Plugins

`readme-engine` is designed with a plugin system to allow for various types of dynamic content. Each plugin is responsible for generating a specific section of your README.

| Plugin Name                                                  | Description                                                                    |
| :----------------------------------------------------------- | :----------------------------------------------------------------------------- |
| [`notable-contributions`](src/plugins/notable-contributions) | Displays your most recent merged pull requests to repositories you do not own. |
| [`prs`](src/plugins/prs)                                     | Fetches and displays your latest merged Pull Requests.                         |
| [`wakatime`](src/plugins/wakatime)                           | Displays your WakaTime coding activity (languages, editors, total time) over the last 30 days. |

## Configuration

You can customize the behavior of each plugin using the `PLUGIN_CONFIG` input. This input accepts a JSON string where keys are the plugin names.

### Example: Customizing `maxPrs`

To change the maximum number of pull requests displayed by each plugin, you can provide the following configuration:

```yaml
- name: Update README
        uses: thisisrick25/readme-engine@v2
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PLUGINS: prs, notable-contributions
          PLUGIN_CONFIG: '{ "prs": { "maxPrs": 8 }, "notable-contributions": { "maxPrs": 4 } }'
```

This configuration will:

- Show up to 8 pull requests for the `prs` plugin.
- Show up to 4 pull requests for the `notable-contributions` plugin.

### WakaTime API Key

The [`wakatime`](src/plugins/wakatime) plugin requires a WakaTime API key. For security, this is provided via the `WAKATIME_API_KEY` environment variable rather than `PLUGIN_CONFIG`. Add your key from [wakatime.com/settings/api-key](https://wakatime.com/settings/api-key) as a repository secret named `WAKATIME_API_KEY`, then pass it to the step:

```yaml
- name: Update README
  uses: thisisrick25/readme-engine@v2
  env:
    WAKATIME_API_KEY: ${{ secrets.WAKATIME_API_KEY }}
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PLUGINS: prs, notable-contributions, wakatime
```

See the [WakaTime plugin README](src/plugins/wakatime) for full setup instructions.

### Commit Author Attribution

By default the automated README commit is authored by the token identity (`github-actions[bot]`). To attribute it to your own account instead, set both `COMMIT_AUTHOR_NAME` and `COMMIT_AUTHOR_EMAIL`:

```yaml
- name: Update README
  uses: thisisrick25/readme-engine@v2
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PLUGINS: prs, notable-contributions
    COMMIT_AUTHOR_NAME: your-username
    COMMIT_AUTHOR_EMAIL: your-verified-email@example.com
```

Both inputs are required together. The email must be verified on your GitHub account for the commit to link to your profile and count toward your contribution graph. No personal access token is needed — the default `GITHUB_TOKEN` still authorizes the request.

## Contributing

Contributions to `readme-engine` are welcomed! If you're interested in improving this action or [adding a new plugin](CONTRIBUTING.md#adding-a-new-plugin), please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to set up your environment and run tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
