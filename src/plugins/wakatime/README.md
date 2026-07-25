# WakaTime Plugin

This plugin fetches and displays your coding activity from [WakaTime](https://wakatime.com). You choose which sections to render via the `sections` config option, and **each selected section is emitted under its own marker** so you can place sections anywhere in your README — including side by side inside an HTML table.

Each section key is a **time window** (`today`, `last7`, `last30`, `allTime`, `lastYear`) combined with a **facet** (`Total`, `Languages`, `Editors`, `Categories`, `BestDay`, `AiCost`, `AiTokens`), giving keys like `last30Languages` or `todayAiCost`. There is also a standalone `sinceToday` key. Every window reads a free-tier endpoint.

**Windows:**

| Window     | Range              | Endpoint               |
| ---------- | ------------------ | ---------------------- |
| `today`    | Today so far       | `status_bar/today`     |
| `last7`    | Last 7 days        | `stats/last_7_days`    |
| `last30`   | Last 30 days       | `stats/last_30_days`   |
| `allTime`  | Lifetime           | `stats/all_time`       |
| `lastYear` | Rolling 12 months  | `stats/last_year`      |

**Facets** (append to any window, e.g. `last7Languages`, `todayAiCost`):

| Facet        | Renders                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `Total`      | Total coding time and daily average headline.                              |
| `Languages`  | Top languages with percentages, bars, and per-item AI/manual split.        |
| `Editors`    | Top editors with percentages, bars, and per-item AI/manual split.          |
| `Categories` | Top activity categories (e.g. AI Coding, Writing Docs) with percentages.   |
| `BestDay`    | The single most productive day in the window.                              |
| `AiCost`     | Total AI model spend plus a per-model cost breakdown with bars.            |
| `AiTokens`   | AI input and output token counts (abbreviated, e.g. `4.2M`).               |

> The `today` window omits `Total`'s daily-average line and has no `BestDay` (a single day); those render nothing.

**Standalone keys:**

| Section key  | Renders                                                                        | Endpoint               |
| ------------ | ----------------------------------------------------------------------------- | ---------------------- |
| `sinceToday` | **All-Time Total** — a single lifetime total coding time headline.             | `all_time_since_today` |
| `summaries`  | **Last 7 Days — Activity** — a per-day bar chart plus the weekly total.        | `summaries`            |
| `today`      | **Today** — today's total coding time as a single line.                        | `status_bar/today`     |
| `projects`   | **Recent Projects** — a list of your most recently active projects.            | `projects`             |
| `leaders`    | **Global Rank** — your position on the public WakaTime leaderboard.            | `leaders`              |
| `goals`      | **Active Goals** — the count of configured goals (omitted when you have none). | `goals`                |
| `durations`  | **Today's Sessions** — count and total duration of today's coding sessions.    | `durations`            |

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

## Placeholders

Each selected section is injected into **its own marker pair**, named `WAKATIME_<SECTIONKEY>` where `<SECTIONKEY>` is the config key uppercased. Add a marker pair for every section you list in `sections`:

```markdown
<!-- WAKATIME_LAST30LANGUAGES:START -->
<!-- WAKATIME_LAST30LANGUAGES:END -->

<!-- WAKATIME_SINCETODAY:START -->
<!-- WAKATIME_SINCETODAY:END -->
```

The content between each pair is automatically replaced with that section's rendered output. Only markers you add are populated — a section with no matching marker is silently skipped.

### Side-by-side layout

Because every section has its own marker, you can wrap them in an HTML table to render sections in columns. The plugin renders bars inside `<pre>` blocks (not fenced code), which display correctly inside `<td>` cells on GitHub:

```html
<table>
  <tr>
    <td>
      <!-- WAKATIME_LAST30LANGUAGES:START -->
      <!-- WAKATIME_LAST30LANGUAGES:END -->
    </td>
    <td>
      <!-- WAKATIME_ALLTIMELANGUAGES:START -->
      <!-- WAKATIME_ALLTIMELANGUAGES:END -->
    </td>
  </tr>
</table>
```

## Example Output

With `sections: ["last30Languages", "sinceToday"]`, the `WAKATIME_LAST30LANGUAGES` marker is populated with:

```html
<!-- WAKATIME_LAST30LANGUAGES:START -->
**Last 30 Days: Languages**

<pre>
TypeScript  ██████████░░░░░░░░░░   48.2%  20 hrs 24 mins [AI 61% · Manual 39%]
Python      █████░░░░░░░░░░░░░░░░   24.1%  10 hrs 12 mins [AI 45% · Manual 55%]
</pre>
<!-- WAKATIME_LAST30LANGUAGES:END -->
```

…and the `WAKATIME_SINCETODAY` marker with:

```html
<!-- WAKATIME_SINCETODAY:START -->
**All-Time Total:** 2,264 hrs 20 mins (since Thu Sep 3rd 2020)
<!-- WAKATIME_SINCETODAY:END -->
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
          "sections": ["today", "last7Total", "last30Total", "sinceToday", "summaries", "last30Languages", "last30Editors", "last30Categories", "last30BestDay", "lastYearLanguages", "projects", "leaders"]
        }
      }
```

The number of languages and editors shown in each breakdown defaults to `5`.

The WakaTime API key **must** be provided via the `WAKATIME_API_KEY` environment variable, not `PLUGIN_CONFIG`.
