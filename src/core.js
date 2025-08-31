const path = require('path');

// Helper function to escape characters for use in a regular expression
function escapeRegExp(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = async function(octokit, username, plugins, readmeContent, maxPrs) {
    let newReadmeContent = readmeContent;

    for (const pluginName of plugins) {
        try {
            const pluginPath = path.join(__dirname, 'plugins', pluginName, 'index.js');
            const plugin = require(pluginPath);
            const result = await plugin(octokit, username, maxPrs);

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