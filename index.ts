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

export default (app: {
    log: { info: (arg0: string, arg1?: string) => void };
    on: (arg0: string[], arg1: (context: any) => Promise<void>) => void;
}) => {
    app.log.info("Yay, the app was loaded!");

    const handlePrEvent = async (context: any) => {
        try {
            const prData = await getAllPrDetails(context, app);
            app.log.info(JSON.stringify(prData), "Full PR data collected");

            await handlePrAnalysis(context, prData);
            await handleKeployWorkflowTrigger(context);
            await handleSecurityWorkflowTrigger(context);
        } catch (error) {
            await handleError(context, app, error);
        }
    };

    app.on(["pull_request.opened", "pull_request.synchronize"], handlePrEvent);
};
