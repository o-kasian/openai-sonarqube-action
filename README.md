# OpenAI SonarQube Action

Loosly based on https://github.com/odegay/sonar-gpt-fixes - the idea is to take suggestions from sonarqube code analysis and use generative model to fix the code. While the result might not be 100% accurate, it can save developers time by switching their role from "implementor" to "reviewer". This action allows fine-tuning to skip some suggestions and produce cleaner results.

## Usage example

To use this action you will need to have:
- Project to be configured and scanned by sonarqube, you can use github-action or framework specific plugins (maven, gradle, dotnet)
- SonarQube API URL must be accessible from a github workflow, use self-hosted runners for internal network
- SonarQube token to be provided to action, easiest path is to put it to repository secrets
- OpenAI instance, either public or Azure OpenAI service endpoint must be accessible from workflow
- OpenAI token must be provided to action

### Basic Usage

To run the action you will need at-least `sonar-token` and `openai-token`. Everything else is optional.

The action will not:
1. Run Sonarqube scan
2. Create new branch
3. Push the code

You will need additional steps in a workflow to handle that.

```
...
jobs:
  test:
    runs-on: ubuntu-latest
    steps:

      ...
      - name: OpenAI Sonar fix
        uses: o-kasian/openai-sonarqube-action@main
        with:
          sonar-token: ${{ secrets.SONAR_TOKEN }}
          openai-token: ${{ secrets.OPENAI_TOKEN }}

```

### Simple Workflow

This simple example will use standard configuration, with Sonar Cloud and OpenAI public API
Working example - https://github.com/o-kasian/openai-sonarqube-test/blob/main/.github/workflows/build.yaml

This workflow does:
1. Checkout code
2. Run SonarCloud Scan
3. Checkout clean version of code as new branch
4. Run `openai-sonarqube-action` to fix code in new branch
5. Push new branch

```
...

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: SonarCloud Scan
        uses: sonarsource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: Checkout new copy to work with
        id: checkout_branch
        run: |
          cd "${RUNNER_TEMP}"
          git clone "https://${GITHUB_REPOSITORY_OWNER}:${{ secrets.PAT_TOKEN }}@github.com/${GITHUB_REPOSITORY}" result
          cd result
          git checkout sonar/${GITHUB_REF_NAME} 2>/dev/null || git checkout -b sonar/${GITHUB_REF_NAME}
          echo "output_dir=${RUNNER_TEMP}/result" >> $GITHUB_OUTPUT

      - name: OpenAI Sonar fix
        uses: o-kasian/openai-sonarqube-action@main
        with:
          sonar-token: ${{ secrets.SONAR_TOKEN }}
          openai-token: ${{ secrets.OPENAI_TOKEN }}
          output-dir: ${{ steps.checkout_branch.outputs.output_dir }}

      - name: Push the changes
        run: |
          cd "${RUNNER_TEMP}"/result
          git config --global user.email "noreply@example.com"
          git config --global user.name "OpenAI GPT"

          git add .
          git commit -m 'chore: fixes from GPT'
          git push --set-upstream origin sonar/${GITHUB_REF_NAME}
```

## Configuration

Action allows fine-tuning, you can use these parameters for:
- Make action focus on certain issues
- Use your own SonarQube instance
- Use your own OpenAI instance, f.ex. Azure OpenAI Service
- Use different model, f.ex. gpt-4
- Adjust performance

| Parameter Name        | Required     | Default Value                  | Description |
| --------------------- | ------------ | ------------------------------ | ----------- |
| sonar-token           | true         |                                | SonarQube token to fetch infromation |
| sonar-project-key     | false        |                                | Project key in sonarqube, if not specified explicitly will look for sonar-project.properties, or use ${owner}_${repo} if not found |
| sonar-branch          | false        | github.refName                 | Branch name in sonarqube to fetch information from, by default will use current branch |
| sonar-url             | false        | https://sonarcloud.io/api/     | API url of sonarqube instance, by default Sonar Cloud |
| sonar-query           | false        |                                | Yaml containing additional parameters supported by api/issues/search https://next.sonarqube.com/sonarqube/web_api/api/issues/search |
| sonar-exclude-files   | false        |                                | Coma-separated list of GLOB patterns for sources to be excluded from autofix |
| sonar-exclude-rules   | false        |                                | Coma-separated list of SonarQube rules to include |
| openai-token          | true         |                                | OpenAI token to use for API calls |
| openai-rate-limit     | false        | 3                              | OpenAI API rate limit per minute |
| openai-url            | false        | https://api.openai.com/v1      | URL of OpenAI instance to use |
| openai-model          | false        | gpt-3.5-turbo                  | OpenAI model name |
| sources-dir           | false        | github.workspace               | Sources directory, must contain same code as sonar-branch |
| output-dir            | false        | sources-dir                    | Output directory to put modified files to |