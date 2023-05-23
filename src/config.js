const { parse } = require('yaml');
const fs = require('fs');
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

// parse sonar-project.properties
if (!sonarConfig.projectKey && fs.existsSync('sonar-project.properties')) {
    const data = fs.readFileSync('sonar-project.properties');
    const contents = data.toString('utf-8');
    const props = contents.split('\n')
        .map(str => str.trim())
        .filter(str => !!str)
        .filter(str => !str.startsWith("#"))
        .map(str => str.split('=', 2))
        .filter(arr => arr.length == 2)
        .reduce((prev, [name, value]) => ({...prev, [name]: value}), {});
    sonarConfig.projectKey = props['sonar.projectKey'];
}

// if no sonarConfig.projectKey, take it as owner_repo
if (!sonarConfig.projectKey) {
    sonarConfig.projectKey = `${process.env.GITHUB_REPOSITORY_OWNER}_${process.env.GITHUB_REPOSITORY}`;
}

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