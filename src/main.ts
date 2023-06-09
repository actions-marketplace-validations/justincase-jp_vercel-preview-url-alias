import * as core from '@actions/core';
import * as github from '@actions/github';

import {
  aliasPreviewUrl,
  generateAliasPreviewUrl,
  getDeployment,
  waitUntilDeployComplete,
} from './utils';

const run = async (): Promise<void> => {
  const { context } = github;
  let deployComplete = false;

  const vercel_access_token = core.getInput('vercel_access_token', {
    required: true,
  });
  const vercel_project_id = core.getInput('vercel_project_id', {
    required: true,
  });
  const vercel_team_id = core.getInput('vercel_team_id');
  const aliasTemplate = core.getInput('alias_template');
  const retryTimes = parseInt(core.getInput('retry_times'), 10) || 18;
  const interval = parseInt(core.getInput('interval'), 10) || 10000;
  const failWhenCancelled = core.getBooleanInput('fail_when_cancelled');

  // issue_comment: commit_sha from outside; pull_request: head.sha; push/merge: context.sha
  const commitSha =
    core.getInput('commit_sha') ||
    context.payload.pull_request?.head.sha ||
    context.sha;

  /* Search Target Deployment */
  const deployment = await getDeployment(commitSha, {
    vercel_team_id,
    vercel_project_id,
    vercel_access_token,
  });
  if (!deployment) {
    core.setOutput('status', 'DEPLOYMENT_NOT_FOUND');
    core.setFailed(`Unable to find Vercel deployment. sha: ${commitSha}`);
    return;
  }
  core.debug(
    `deployment url: ${deployment.url} - ${deployment.uid} - ${deployment.state}`,
  );
  if (deployment.state === 'READY') {
    core.setOutput('status', 'READY');
    deployComplete = true;
  }
  /* end of Search Target Deployment */

  /* wait until deployment finished by interval */
  if (!deployComplete) {
    const success = await waitUntilDeployComplete(
      deployment.url,
      failWhenCancelled,
      retryTimes,
      interval,
      {
        vercel_team_id,
        vercel_access_token,
      },
    );
    if (!success) {
      return;
    }
  }

  /* alias preview url */
  if (aliasTemplate) {
    const aliasPreviewUrlGen = generateAliasPreviewUrl(aliasTemplate);
    const aliasedPreviewUrl = await aliasPreviewUrl(
      deployment.uid,
      aliasPreviewUrlGen,
      {
        vercel_team_id,
        vercel_access_token,
      },
    );
    core.setOutput('preview_url_alias', aliasedPreviewUrl);
  }

  core.setOutput('preview_url_origin', deployment.url);
};

run().catch((error) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
});
