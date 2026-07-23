# WakaTime Plugin

This plugin fetches and displays your coding activity from [WakaTime](https://wakatime.com) over the last 30 days, including a summary of total time, top programming languages, and top editors.

## Prerequisites

You need a WakaTime account and its API key:

1. Sign up at [wakatime.com](https://wakatime.com) and install the WakaTime plugin in your editor(s).
2. Copy your API key from [wakatime.com/settings/api-key](https://wakatime.com/settings/api-key).
3. Add it as a repository secret named `WAKATIME_API_KEY` in the repository where this action runs (**Settings → Secrets and variables → Actions → New repository secret**).

## Usage

To enable this plugin, include `wakatime` in the `PLUGINS` input and pass the API key to the step via the `WAKATIME_API_KEY` environment variable:

```yaml
- name: Update README with readme-engine
  uses: thisisrick25/readme-engine@v2
  env:
    WAKATIME_API_KEY: ${{ secrets.WAKATIME_API_KEY }}
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PLUGINS: wakatime
```

The API key is read from the environment (`process.env.WAKATIME_API_KEY`) and is intentionally **not** part of `PLUGIN_CONFIG`, keeping the secret out of the README output and config JSON.

## Placeholder

Add the following placeholder comments to your target Markdown file where you want the stats injected:

```markdown
<!-- WAKATIME:START -->
<!-- WAKATIME:END -->
```

The content between these comments is automatically replaced by the generated WakaTime stats block.

## Example Output

```markdown
<!-- WAKATIME:START -->
### WakaTime (Last 30 Days)

**Total:** 42 hrs 18 mins • **Daily average:** 1 hr 24 mins

**Languages**

​```text
TypeScript  ██████████░░░░░░░░░░   48.2%  20 hrs 24 mins
Python      █████░░░░░░░░░░░░░░░░   24.1%  10 hrs 12 mins
Markdown    ██░░░░░░░░░░░░░░░░░░░   11.0%  4 hrs 39 mins
​```

**Editors**

​```text
VS Code     ████████████████░░░░   82.5%  34 hrs 54 mins
Neovim      ███░░░░░░░░░░░░░░░░░░   17.5%  7 hrs 24 mins
​```
<!-- WAKATIME:END -->
```

## Configuration

This plugin does not require `PLUGIN_CONFIG`. It optionally honors a `maxPrs`-style top-N limit (defaults to `5`) for how many languages and editors are shown, but the recommended setup needs no configuration.

The WakaTime API key **must** be provided via the `WAKATIME_API_KEY` environment variable, not `PLUGIN_CONFIG`.
