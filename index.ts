// Deployments API example
// See: https://developer.github.com/v3/repos/deployments/ to learn more

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
import { getAllPrDetails } from "./pr.js";
import { handlePrAnalysis } from "./llm.js";
import { handleKeployWorkflowTrigger } from "./keploy.js";
import { handleError } from "./utils.js";
import { handleSecurityWorkflowTrigger } from "./security.js";
import { promptUserConfig } from './src/cli.js';
import { reviewPR } from './diffparser.js';
import { handleLintWorkflowTrigger } from "./lint.js";
import { App, Config, GithubContext } from "./types.js";
import { savePrAsPdf } from "./pdf-export.js";

let config: Config;

export default async (app: App) => {
    try {
        // Get user configuration through CLI
        config = await promptUserConfig();
        // selectedModel = config.model;
        app.log.info(`Initialized with API url: ${config.apiEndpoint} for use case: ${config.useCase} and model : ${config.selectedModel}`);
    } catch (error) {
        app.log.info("Failed to get user configuration");
        // Using Node.js process API
        if (typeof process !== 'undefined') {
            process.exit(1);
        }
    }

    app.log.info("Yay, the app was loaded!");

    const handlePrEvent = async (context: GithubContext) => {
        try {
            const prData = await getAllPrDetails(context, app);
            app.log.info("Full PR data collected", { prData: JSON.stringify(prData) });

            const llmOutput = await handlePrAnalysis(context, prData , config.apiEndpoint , config.selectedModel, app);
            // const stringllmOutput = await JSON.stringify(llmOutput);
            // app.log.info(JSON.stringify(stringllmOutput), "LLM analysis complete");
            await reviewPR(context as any, app, llmOutput);
            // await reviewPR(context, app);
            
            // Export PR data to PDF
            try {
                const { owner, repo } = context.repo();
                const prNumber = context.payload.pull_request.number;
                const pdfFilename = await savePrAsPdf(prData, owner, repo, prNumber);
                app.log.info(`PR exported to PDF: ${pdfFilename}`);
                
                // Post comment with PDF info
                await context.octokit.issues.createComment({
                    owner,
                    repo,
                    issue_number: prNumber,
                    body: `📄 PR summary has been exported as PDF: ${pdfFilename}`
                });
            } catch (pdfError) {
                app.log.error("Failed to export PR as PDF", pdfError);
            }
            
            // Run all workflow triggers in parallel
            await Promise.all([
                handleKeployWorkflowTrigger(context),  
                handleSecurityWorkflowTrigger(context),
                handleLintWorkflowTrigger(context)
            ]);
        } catch (error) {
            await handleError(context, app, error);
        }
    };

    if (app.on) {
        app.on(["pull_request.opened", "pull_request.synchronize"], handlePrEvent);
    }
};
