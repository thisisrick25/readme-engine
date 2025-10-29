import type { Provider, BasePluginConfig, PluginModule } from './types.js';
import { pluginRegistry } from './plugins/index.js';

// Helper function to escape characters for use in a regular expression
function escapeRegExp(param: string): string {
    return param.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default async function runCore(provider: Provider, username: string, plugins: string[], readmeContent: string, pluginConfig: Record<string, BasePluginConfig>): Promise<string> {
    let newReadmeContent = readmeContent;

    for (const pluginName of plugins) {
        const pluginModule: PluginModule | undefined = pluginRegistry[pluginName];

        if (pluginModule) {
            try {
                console.log(`Running plugin: ${pluginName}...`);

                let result: string | undefined;

                // Prefer provider-specific implementation when available
                const impl = pluginModule.implementations?.[provider.providerType];
                if (impl) {
                    const client = provider.getClient();
                    result = await impl(client, username, pluginConfig[pluginName] || {});
                } else if (pluginModule.default) {
                    // Fallback to default provider-agnostic implementation
                    result = await pluginModule.default(provider, username, pluginConfig[pluginName] || {});
                } else {
                    console.warn(`Plugin "${pluginName}" has no implementation for provider "${provider.providerType}" and no default.`);
                }

                if (result !== undefined) {
                    const tagName = pluginName.toUpperCase();
                    const startComment = `<!-- ${tagName}:START -->`;
                    const endComment = `<!-- ${tagName}:END -->`;
                    const replacement = `${startComment}\n${result}\n${endComment}`;
                    const regex = new RegExp(`${escapeRegExp(startComment)}[\\s\\S]*${escapeRegExp(endComment)}`);

                    newReadmeContent = newReadmeContent.replace(regex, replacement);
                    console.log(`Plugin ${pluginName} finished successfully.`);
                }

            } catch (error) {
                console.error(`Error running plugin ${pluginName}:`, error);
            }
        } else {
            console.warn(`Plugin "${pluginName}" is not recognized or registered.`);
        }

    }

    return newReadmeContent;
}