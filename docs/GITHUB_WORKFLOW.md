# Issueから確認・公開まで

公開サイト：[とおまの音みくじ](https://toma-oto-mikuji.pages.dev/)

リポジトリ：[morikyun/toma-oto-mikuji](https://github.com/morikyun/toma-oto-mikuji)

## 普段の運用

1. 利用者に **Issues → New issue** から修正・追加・相談を登録してもらいます。
2. 運営者が内容を確認し、Codexに「このIssueに対応してPRを作って」とURLを渡します。Issue登録だけでAIが自動着手する設定ではありません。
3. Codexが作業ブランチとPRを作成します。**Build and test** で構文・リンク・選曲・公開ファイルの生成を確認します。
4. morikyunが **Files changed** を確認します。文章修正の依頼なのに `.github/`・`scripts/`・`package*.json`・`AGENTS.md` が変更されている場合は、その理由を確認してください。
5. Actionsの **Review deployments** で `preview` を選び、**Approve and deploy** を押します。確認用サイトを作るための承認です。Codexは代行しません。
6. **Deploy preview** の成功後、PRの **View deployment** またはActionsのリンクから確認用サイトを開きます。
7. 問題がなければmorikyunが **Squash and merge → Confirm squash and merge** を押します。この操作を本番公開の承認とします。
8. 再チェックの成功後、既存のCloudflare Pagesへ自動公開されます。

PRの作成者と確認者が同じアカウントになる場合があるため、PRレビューのApproveを必須にしていません。プレビューの環境承認と、本番へのマージは別の操作です。mainはPR経由で、**Build and test / Deploy preview** の成功が必要です。公開処理でもmorikyunがマージしたPRと公開対象のコミットが一致することを確認します。

追加コミットや再実行で再び承認待ちになった場合も、差分を確認してから承認してください。フォークPRはチェックのみ実行し、公開用Secretを渡しません。

## 初回だけ必要な接続設定

GitHubの [Settings → Environments](https://github.com/morikyun/toma-oto-mikuji/settings/environments) で次を設定します。

- `preview` のRequired reviewersは `morikyun`。本人が承認できるようPrevent self-reviewはオフ。
- `production` のDeployment branches and tagsは **Branchのmainだけ**。
- `preview` と `production` の両方の **Environment secrets** に、次の2項目を登録します。

| 名前 | 登録する内容 |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | 現在の音みくじPagesプロジェクトが属するアカウントID |
| `CLOUDFLARE_API_TOKEN` | そのアカウントだけの **Account → Cloudflare Pages → Edit** 権限を持つトークン |

**Repository secretsには登録しません。** 環境を指定しないPR処理から参照できるようにしないためです。Secretの値はチャット・Issue・PRに書かず、GitHubのSecret欄へ直接登録します。他のリポジトリに登録済みのSecretは読み戻せないため、保管している値を使用するか適切な権限で再発行してください。他のサイトで使うトークンを無断で無効にしないでください。

### ID・トークンの取得と登録の手順

1. [Cloudflareダッシュボード](https://dash.cloudflare.com/)で、音みくじのあるアカウントを開きます。**Workers & Pages → Account Details → Account ID** のコピーボタンでIDを取得します。検索欄で `Copy account ID` を選ぶ方法もあります。[Account IDの公式手順](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/)
2. **Manage Account → API Tokens → Create Token → Custom Token / Get started** でトークンを作ります。名前は `toma-oto-mikuji-github-actions` など、用途の分かる名前にします。権限は **Account → Cloudflare Pages → Edit**、対象は音みくじのあるアカウントに限定します。**Continue to summary → Create Token** で表示される値をコピーし、安全な場所に保管してください。値は作成時に一度だけ表示されます。[Cloudflareのトークン作成手順](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
3. GitHubの [Settings → Environments](https://github.com/morikyun/toma-oto-mikuji/settings/environments) から **preview** を開きます。
4. **Environment secrets → Add secret** を押し、Nameに `CLOUDFLARE_ACCOUNT_ID`、Secretに手順1のIDを貼り付けて保存します。もう一度 **Add secret** を押し、Nameを `CLOUDFLARE_API_TOKEN`、Secretを手順2のトークンにして保存します。
5. Environmentsへ戻って **production** を開き、同じ2つの名前・値を登録します。合計4件（各環境に2件）です。登録先が **Environment secrets** であることを確認してください。[GitHubの環境Secretの公式手順](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#creating-secrets-for-an-environment)

プレビューで使うPages編集権限は本番にも影響し得ます。Environmentによる承認待ちで、レビュー前のPRにトークンを渡さない構成です。承認後はPRの処理がトークンを使うため、差分の確認は必要です。[GitHubの環境とSecretの説明](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)

登録後、PRのActionsが承認待ちならpreviewを承認します。Secret不足で失敗した場合は **Re-run failed jobs** を実行します。保護設定を外して通すことはしません。

## 公開先と仕組み

- GitHub ActionsからWranglerのDirect Uploadを使い、既存の `toma-oto-mikuji` に公開します。CloudflareのGit連携への切り替えやプロジェクトの作り直しは不要です。
- 本番URLは `https://toma-oto-mikuji.pages.dev/` のままです。
- Pages側の本番ブランチは公開前にAPIから読み取り、既存設定を変更しません。プレビューは `pr-<PR番号>` を使用し、本番と同名なら停止します。
- `cloudflare-pages/` を成果物として公開します。サイト用ファイルだけを含み、ソース管理の資料・テスト・認証情報は公開しません。
- GitHub ActionsはコミットSHA、Wranglerはバージョンを固定しています。通常のチェックに公開用Secretは渡しません。
- マージはSquashのみ。mainの保護は管理者にも適用し、強制push・削除を許可しません。

参考：[CloudflareのDirect UploadとGitHub Actions](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)

## 編集と確認

Node.js 24、Python 3を使用します。外部npmパッケージのインストールは不要です。

```sh
npm run check
npm test
npm run prepare:cloudflare
npm run dev
```

`dist/` が編集元です。楽曲データの基礎は `research/catalog.json`、解説は `dist/notes/`、サイトの画面は `dist/app.mjs` と `dist/styles.css` などにあります。`npm run notes` はローカルの発信アーカイブがある場合だけ実行し、公開してよい書き出し結果を確認してください。CIでは実行しません。

`scripts/check-trusted-links.mjs` は現在の承認済みの問い合わせ先・販売先・公式リンク等を照合します。同じサービス内の別フォームも検知します。正規の移転は運営者が別経路で確認し、明示的に指示した場合に限って固定値も更新します。この検査はレビューを補助するもので、検査ファイルごと変更できる人へのアクセス制御ではありません。

## 公開Issueの取り扱い

公開Issueには個人の連絡先、非公開資料、歌詞全文、トークンを書かないでください。リンクの変更は、投稿者名だけで信用せず、既知の連絡先や公式情報で確認します。

個人情報が書き込まれた場合は、本文を編集するだけでなく、運営者が **edited → Options → Delete revision from history** で該当する版を削除するか、必要に応じてIssueを削除します。画像やキャッシュが残る場合はGitHub Supportに相談します。

コミットには `314282168+morikyun@users.noreply.github.com` を使用します。GitHubのSettings → Emailsでも **Keep my email addresses private** と **Block command line pushes that expose my email** を有効にすると、GitHub上でマージする際の露出を防げます。過去の履歴を強制pushで書き換えません。

## 公開を戻す場合

通常はRevert PRを作り、確認してマージします。緊急時はCloudflareのDeploymentsから以前の成功した本番デプロイへ戻し、その後GitHub側も修正PRで揃えます。
