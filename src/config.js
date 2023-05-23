const { parse } = require('yaml');
const core = require('@actions/core');

const sonarConfig = {
    token: core.getInput('sonar-token'),
    projectKey: core.getInput('sonar-project-key'),
    branch: core.getInput('sonar-branch'),
    url: core.getInput('sonar-url'),
    query: core.getInput('sonar-query'),
    excludeFiles: core.getInput('sonar-exclude-files'),
    excludeRules: core.getInput('sonar-exclude-rules')
};
sonarConfig.branch = sonarConfig.branch || process.env.GITHUB_REF_NAME;
sonarConfig.query = (sonarConfig.query && parse(sonarConfig.query)) || {};
sonarConfig.excludeFiles = (sonarConfig.excludeFiles || '').split(',').map(str => str.trim()).filter(str => !!str);
sonarConfig.excludeRules = (sonarConfig.excludeRules || '').split(',').map(str => str.trim()).filter(str => !!str);

const openAiConfig = {
    token: core.getInput('openai-token'),
    rateLimit: core.getInput('openai-rate-limit'),
    url: core.getInput('openai-url'),
    model: core.getInput('openai-model')
};

const config = {
    sonar: sonarConfig,
    openAi: openAiConfig,
    sourcesDir: core.getInput('sources-dir'),
    outputDir: core.getInput('output-dir')
};
config.sourcesDir = config.sourcesDir || process.env.GITHUB_WORKSPACE;
config.outputDir = config.outputDir || config.sourcesDir;

console.log(JSON.stringify(config));

module.exports = config;