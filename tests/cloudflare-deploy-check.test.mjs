import test from 'node:test';
import assert from 'node:assert/strict';
import {deploymentSettings} from '../scripts/cloudflare-deploy-check.mjs';

const project = {name: 'toma-oto-mikuji', subdomain: 'toma-oto-mikuji.pages.dev', production_branch: 'production'};
const options = {accountId: 'a'.repeat(32), token: 'test-only', target: 'production'};
const fetchProject = value => async () => Response.json({success: true, result: value});

test('deployment reads the existing production branch without requiring API keys or changing the project', async () => {
  const calls = [];
  const settings = await deploymentSettings({...options, fetcher: async (url, init) => {
    calls.push({url, init});
    return fetchProject(project)();
  }});
  assert.deepEqual(settings, {branch: 'production'});
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, undefined);
  assert.equal(calls[0].url, `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/pages/projects/toma-oto-mikuji`);
  assert.deepEqual(await deploymentSettings({...options, fetcher: fetchProject({...project, production_branch: 'main'})}), {branch: 'main'});
});

test('missing credentials and unknown targets stop before contacting Cloudflare', async () => {
  const noFetch = () => { throw new Error('must not call'); };
  await assert.rejects(deploymentSettings({...options, token: '', fetcher: noFetch}), /Environment secrets/);
  await assert.rejects(deploymentSettings({...options, accountId: '../other-account', fetcher: noFetch}), /Environment secrets/);
  await assert.rejects(deploymentSettings({...options, target: 'new-project', fetcher: noFetch}), /Unknown deployment target/);
});

test('a different project, mismatched hostname or missing project stops deployment', async () => {
  await assert.rejects(deploymentSettings({...options, fetcher: fetchProject({...project, name: 'another-project'})}), /既存/);
  await assert.rejects(deploymentSettings({...options, fetcher: fetchProject({...project, subdomain: 'another-project.pages.dev'})}), /既存/);
  await assert.rejects(deploymentSettings({...options, fetcher: async () => Response.json({success: false})}), /既存/);
  await assert.rejects(deploymentSettings({...options, fetcher: async () => new Response('', {status: 404})}), /404/);
});

test('API failures do not expose their response body', async () => {
  await assert.rejects(
    deploymentSettings({...options, fetcher: async () => new Response('private API error', {status: 403})}),
    error => error.message.includes('403') && !error.message.includes('private API error')
  );
});

test('invalid production branch cannot become a command argument or GitHub output injection', async () => {
  for (const branch of ['', undefined, '--branch=main', 'main --project-name=other', 'main\nbranch=other']) {
    await assert.rejects(deploymentSettings({...options, fetcher: fetchProject({...project, production_branch: branch})}), /本番ブランチ/);
  }
});

test('preview cannot target production or inject command arguments', async () => {
  const preview = {...options, target: 'preview', previewBranch: 'pr-2', fetcher: fetchProject(project)};
  assert.deepEqual(await deploymentSettings(preview), {branch: 'pr-2'});
  for (const branch of ['production', 'pr-0', 'pr-2 --branch=production', 'pr-2\nbranch=production']) {
    await assert.rejects(deploymentSettings({...preview, previewBranch: branch}), /separate/);
  }
  await assert.rejects(deploymentSettings({...preview, fetcher: fetchProject({...project, production_branch: 'pr-2'})}), /separate/);
});
