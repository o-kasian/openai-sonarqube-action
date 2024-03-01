const fs = require('fs');
const path = require('path');
const config = require("./config");
const constructSonarQubeService = require("./service/sonarqube");
const constructOpenAiService = require("./service/openai");
const constructFilesystemService = require("./service/filesystem");
const core = require('@actions/core');

const sonar = constructSonarQubeService(config);
const openAi = constructOpenAiService(config);
const fileSystem = constructFilesystemService(config);

const resolveIssuesForFile = async(filename, issues) => {
    const content = await fileSystem.loadFile(filename);
    const fix = await openAi.tryFix({ filename, content }, issues);
    return fix;
}

const run = async() => {
    // read issues
    const issues = await sonar.fetchIssues(config.sonarProjectKey, config.sonarBranch);
    const issuesByFile = issues.reduce((prev, cur) => {
        const [repo, file] = cur.component.split(':');
        if (!prev[file]) {
            prev[file] = [];
        }
        prev[file].push(cur);
        return prev;
    }, {});

    // provide fixes
    const fixes = [];
    for (const file in issuesByFile) {
        console.log(`Resolving issues for ${file}`)
        const resolution = await resolveIssuesForFile(file, issuesByFile[file]);

        if (resolution.success) {
            fixes.push(resolution);
        } else {
            core.warning(resolution.content);
        }
    }

    // write results
    for (const i in fixes) {
        const { filename, content } = fixes[i];
        await fileSystem.writeFile(filename, content);
    }

    //output number of files changed
    core.setOutput('files-changed', fixes.length);
};

run().catch(err => {
    console.error(err);
    core.setFailed(`Unhandled error: ${err}`)
});