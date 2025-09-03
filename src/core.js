const path = require('path');
const fs = require('fs');

// Helper function to escape characters for use in a regular expression
function escapeRegExp(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = async function(octokit, username, plugins, readmeContent, pluginConfig) {
    let newReadmeContent = readmeContent;

    const allPlugins = {};
    const pluginsDir = path.join(__dirname, 'plugins');
    const availablePluginNames = fs.readdirSync(pluginsDir);

    for (const pluginName of availablePluginNames) {
        const pluginPath = path.join(pluginsDir, pluginName, 'index.js');
        if (fs.existsSync(pluginPath)) {
            allPlugins[pluginName] = require(pluginPath);
        }
    }

    for (const pluginName of plugins) {
        try {
            const plugin = allPlugins[pluginName];
            if (!plugin) {
                console.warn(`Plugin "${pluginName}" not found or not implemented.`);
                continue;
            }
            const result = await plugin(octokit, username, pluginConfig[pluginName] || {});

            const tagName = pluginName.toUpperCase();
            const startComment = `<!-- ${tagName}:START -->`;
            const endComment = `<!-- ${tagName}:END -->`;

            const replacement = `${startComment}\n${result}\n${endComment}`;

            const regex = new RegExp(`${escapeRegExp(startComment)}[\\s\\S]*${escapeRegExp(endComment)}`);
            
            newReadmeContent = newReadmeContent.replace(regex, replacement);
        } catch (error) {
            console.error(`Error running plugin ${pluginName}:`, error);
        }
    }

    return newReadmeContent;
}