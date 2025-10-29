// Lightweight types and provider abstraction to support multiple providers (GitHub, GitLab)

/**
 * A normalized shape for pull/merge request items used by plugins.
 */
/**
 * The Provider interface is intentionally minimal for Option B (Extensible Plugin System).
 * Providers expose repo I/O and the raw client so plugins can implement provider-specific logic.
 */
export type Provider = {
  // The provider id/type (e.g., 'github', 'gitlab')
  providerType: string;

  // Return the underlying client instance (Octokit for GitHub, Gitlab client for GitLab)
  getClient(): any;

  // Read README.md content from the repository. Returns the content and an opaque SHA/id used for updates when available.
  getReadmeContent(): Promise<{ content: string; sha?: string | number | undefined }>;

  // Update or create the README.md file. Implementations decide how to use sha or project refs.
  updateReadme(content: string, commitMessage?: string): Promise<void>;

  // Return the canonical username/org used for queries (useful for local test mode).
  getRepoOwner(): Promise<string>;
};

/**
 * Defines the configuration options that can be passed to any plugin.
 * We can extend this for more specific plugin configs.
 */
export interface BasePluginConfig {
  maxPrs?: number;
  // Add other common options here in the future
}

/**
 * Defines the function signature for a readme-engine plugin.
 * This is the "contract" that all plugins must adhere to.
 */
/**
 * A provider-specific plugin implementation receives the raw client for that provider.
 * For GitHub this will be an Octokit instance; for GitLab the Gitlab client.
 */
export type PluginImplementation = (client: any, username: string, config: BasePluginConfig) => Promise<string>;

/**
 * The plugin module may export per-provider implementations or a default provider-agnostic function
 * that receives the full Provider. Plugins should export at least one of these.
 */
export type PluginModule = {
  implementations?: Record<string, PluginImplementation>;
  // default receives the Provider for maximum flexibility
  default?: (provider: Provider, username: string, config: BasePluginConfig) => Promise<string>;
};

/**
 * The main configuration object, mapping plugin names to their specific configs.
 */
export type PluginsConfig = Record<string, BasePluginConfig>;

/**
 * Defines the shape of the data we get back from `octokit.rest.repos.getContent`.
 * We only care about the `content` and `sha` properties for a file response.
 */
export interface GetContentResponseData {
  content?: string;
  sha?: string;
}