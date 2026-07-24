# WakaTime Plugin

This plugin fetches and displays your coding activity from [WakaTime](https://wakatime.com) as a single combined block. You choose which sections to render via the `sections` config option.

Each section key is a **time window** (`last7`, `last30`, `allTime`, `lastYear`) combined with a **facet** (`Total`, `Languages`, `Editors`, `Categories`, `BestDay`), giving keys like `last30Languages` or `allTimeCategories`. There is also a standalone `sinceToday` key. Every window reads a `stats/:range` endpoint that is accessible on the free tier.

**Windows** (each reads `stats/<range>`):

| Window     | Range              | Endpoint               |
| ---------- | ------------------ | ---------------------- |
| `last7`    | Last 7 days        | `stats/last_7_days`    |
| `last30`   | Last 30 days       | `stats/last_30_days`   |
| `allTime`  | Lifetime           | `stats/all_time`       |
| `lastYear` | Rolling 12 months  | `stats/last_year`      |

**Facets** (append to any window, e.g. `last7Languages`):

| Facet        | Renders                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `Total`      | Total coding time and daily average headline.                              |
| `Languages`  | Top languages with percentages, bars, and per-item AI/manual split.        |
| `Editors`    | Top editors with percentages, bars, and per-item AI/manual split.          |
| `Categories` | Top activity categories (e.g. AI Coding, Writing Docs) with percentages.   |
| `BestDay`    | The single most productive day in the window.                              |

**Standalone key:**

| Section key  | Renders                                                            | Endpoint               |
| ------------ | ----------------------------------------------------------------- | ---------------------- |
| `sinceToday` | **All-Time Total** — a single lifetime total coding time headline. | `all_time_since_today` |

> Each facet is an independent section key. Keys sharing an endpoint (for example `last30Total`, `last30Languages`, `last30Editors` all read `stats/last_30_days`) reuse a single request per run.
>
> `Languages`, `Editors`, and `Categories` items are annotated inline with their AI-assisted vs. manual coding split (e.g. `[AI 62% · Manual 38%]`) when WakaTime provides those figures.

Sections render in the order you list them. Each section also degrades gracefully: if an endpoint or facet is unavailable, that section is simply omitted and the rest still render.

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
### WakaTime

**All-Time Total:** 2,264 hrs 20 mins (since Thu Sep 3rd 2020)

#### Last 30 Days

**Total:** 42 hrs 18 mins • **Daily average:** 1 hr 24 mins

#### Last 30 Days — Languages

​```text
TypeScript  ██████████░░░░░░░░░░   48.2%  20 hrs 24 mins [AI 61% · Manual 39%]
Python      █████░░░░░░░░░░░░░░░░   24.1%  10 hrs 12 mins [AI 45% · Manual 55%]
​```

#### Last 30 Days — Editors

​```text
VS Code     ████████████████░░░░   82.5%  34 hrs 54 mins [AI 58% · Manual 42%]
​```

#### Last 30 Days — Categories

​```text
AI Coding   ███████████████░░░░░   73.2%  30 hrs 58 mins
Coding      ██░░░░░░░░░░░░░░░░░░░   10.3%   4 hrs 21 mins
​```

#### Last 30 Days — Best Day

**4 hrs 0 mins** on 2026-07-23

#### Last Year — Languages

​```text
TypeScript  ████████░░░░░░░░░░░░   40.1%  161 hrs 25 mins [AI 55% · Manual 45%]
Python      ████░░░░░░░░░░░░░░░░   18.3%   73 hrs 40 mins [AI 40% · Manual 60%]
​```
<!-- WAKATIME:END -->
```

## Configuration

Configure which sections to display via the `wakatime.sections` key in `PLUGIN_CONFIG`. It accepts an array of section keys, each being a window (`last7`, `last30`, `allTime`, `lastYear`) + facet (`Total`, `Languages`, `Editors`, `Categories`, `BestDay`) — e.g. `last7Total`, `last30Languages`, `allTimeCategories`, `lastYearBestDay` — plus the standalone `sinceToday`. Sections render in the order given, and duplicates are ignored.

**If `sections` is omitted, only `last30Languages` is rendered** (the default).

```yaml
- name: Update README with readme-engine
  uses: thisisrick25/readme-engine@v2
  env:
    WAKATIME_API_KEY: ${{ secrets.WAKATIME_API_KEY }}
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PLUGINS: wakatime
    PLUGIN_CONFIG: |
      {
        "wakatime": {
          "sections": ["last30Total", "last30Languages", "last30Editors", "last30Categories", "last30BestDay", "lastYearLanguages", "sinceToday"]
        }
      }
```

The number of languages and editors shown in each breakdown defaults to `5`.

The WakaTime API key **must** be provided via the `WAKATIME_API_KEY` environment variable, not `PLUGIN_CONFIG`.
