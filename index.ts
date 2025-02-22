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

// const {handleError } = require('./utils');
// const {getAllPrDetails} = require('./pr');
// const {handlePrAnalysis} = require('./llm');
// const {handleKeployWorkflowTrigger} = require('./keploy');

export default (app) => {
  app.log.info("Yay, the app was loaded!");

  const handlePrEvent = async (context) => {
    try {
      const prData = await getAllPrDetails(context);
      app.log.info(prData, "Full PR data collected");
      
      await handlePrAnalysis(context, prData);
      
      await handleKeployWorkflowTrigger(context);
    } catch (error) {
      await handleError(context, app, error);
    }
  };
  app.on(["pull_request.opened", "pull_request.synchronize"], handlePrEvent);
};





