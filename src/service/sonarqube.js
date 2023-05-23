const { posix } = require("path");
const { stringify } = require('node:querystring');
const fetch = require("node-fetch");

const constructSonarQubeClient = (config) => {
    const baseUrl = new URL(config.sonar.url).origin;
    const basePath = new URL(config.sonar.url).pathname;
    const endpoint = (path) => new URL(posix.join(basePath, path), baseUrl).href;
    const headers = {
        'Authorization': Buffer.from(`${config.sonar.token}:`).toString('base64'),
        'Accept': 'application/json'
    };
    const pageSize = 15;
    const baseParams = {
        ...config.sonar.query,
        componentKeys: config.sonar.projectKey,
        branch: config.sonar.branch,
        ps: pageSize
    };

    const filterResult = (result) => {
        return result;
    };

    const fetchIssues = async() => {
        const result = [];

        let page = 1;
        while(true) {
            const params = {
                ...baseParams,
                p: page
            };
            const url = `${endpoint('issues/search')}?${stringify(params)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers
            });

            if (response.status !== 200) {
                const reason = await response.text();
                throw new Error(reason);
            }
            const data = await response.json();
            result.push(...(data.issues || []));
            if (pageSize * page >= data.paging.total) {
                return filterResult(result);
            }

            page++;
        }
    }

    return {
        fetchIssues
    };
}

module.exports = constructSonarQubeClient;