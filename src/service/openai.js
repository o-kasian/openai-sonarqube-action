const { Configuration, OpenAIApi } = require("openai");
const fetch = require("node-fetch");
const { rateLimiter } = require('../util/rateLimit');

const wrap = (text) => {
    return "```\n" + text + "\n```";
}

const unwrap = (text) => {
    return text.trim()
                .replace(/^```/g, '')
      			.replace(/```$/g, '')
                .replace(/```(.*)/g, '');
}

const generateSystemMessage = () => {
    return "You are a software engineer tasked to fix issues identified by SonarQube.";
}

const generatePrompt = (content, issues) => {
    const issuesText = issues.map(issue => `Line ${issue.line}: ${issue.message}`).join('\n')
    const lines = [
        "#### Issues identified by SonarQube:",
        wrap(issuesText),
        "### Code with issues:",
        wrap(content),
        "### Your task - Provide fixed code, no line numbers, no additional comments, no notes"
    ];
    return lines.join("\n").trim();
}

const constructOpenAiClient = (config) => {
    const configuration = new Configuration({
        apiKey: config.openAi.token,
        basePath: config.openAi.url
    });
    const client = new OpenAIApi(configuration);
    const rateLimit = rateLimiter(config.openAi.rateLimit, 60_000);
    const tryFix = async({ filename, content }, issues) => {
        const prompt = generatePrompt(content, issues);
        try {
            await rateLimit();
            const completion = await client.createChatCompletion({
                model: config.openAi.model,
                messages: [
                    {role: "system", content: generateSystemMessage()},
                    {role: "user", content: prompt}
                ]
            });
            const { choices = [] } = completion.data;
            if (choices.length !== 1) {
                return {
                    filename,
                    result: "error",
                    content: "No choices returned from openAPI"
                };
            }

            const result = await unwrap(choices[0].message.content);
            return {
                filename,
                success: true,
                content: result
            }
        } catch (error) {
            if (error.response) {
                return {
                    filename,
                    success: false,
                    content: `Skipped due to HTTP ${error.response.status}, '${JSON.stringify(error.response.data)}'`
                };
              } else {
                throw new Error(error.message);
              }
        }
    }
    
    return {
        tryFix
    };
};

module.exports = constructOpenAiClient;