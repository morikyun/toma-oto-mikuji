import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const projectName = 'toma-oto-mikuji';

export async function deploymentSettings({accountId, token, target, previewBranch, fetcher = fetch}) {
  if (!/^[a-f0-9]{32}$/.test(accountId || '') || !token) {
    throw new Error('GitHub ActionsのEnvironment secretsにCLOUDFLARE_ACCOUNT_IDとCLOUDFLARE_API_TOKENを設定してください。');
  }
  if (!['production', 'preview'].includes(target)) throw new Error('Unknown deployment target.');

  const response = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`, {
    headers: {Authorization: `Bearer ${token}`},
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) {
    throw new Error(`Cloudflareプロジェクトを確認できません（HTTP ${response.status}）。トークンのPages編集権限とアカウントを確認してください。`);
  }
  const data = await response.json();
  const project = data.result;
  if (!data.success || project?.name !== projectName || project.subdomain !== `${projectName}.pages.dev`) {
    throw new Error('既存のtoma-oto-mikujiプロジェクトを確認できないため公開を停止しました。');
  }
  const productionBranch = project.production_branch;
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$/.test(productionBranch || '')) {
    throw new Error('Cloudflareの本番ブランチを確認できません。');
  }
  if (target === 'production') return {branch: productionBranch};
  if (!/^pr-[1-9]\d*$/.test(previewBranch || '') || previewBranch === productionBranch) {
    throw new Error('Preview branch must be separate from production.');
  }
  return {branch: previewBranch};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const {branch} = await deploymentSettings({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      token: process.env.CLOUDFLARE_API_TOKEN,
      target: process.env.DEPLOY_TARGET,
      previewBranch: process.env.PREVIEW_BRANCH
    });
    if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, `branch=${branch}\n`);
    console.log(`Existing Pages project verified: ${projectName} (${process.env.DEPLOY_TARGET}).`);
  } catch (error) {
    // Never print a raw API response: it may include account configuration.
    console.error(error instanceof Error ? error.message : 'Cloudflare project check failed.');
    process.exitCode = 1;
  }
}
