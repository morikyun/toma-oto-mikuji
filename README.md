# とおまの音みくじ

5つの質問から、總水とおま・カミムスヒの8作品51曲に出会う非公式ファンサイトです。

公開サイト：[とおまの音みくじ](https://toma-oto-mikuji.pages.dev/)

このリポジトリでは公開中のサイトのソースを管理します。Issueで修正依頼を受け、PRを確認してから既存のCloudflare Pagesへ公開する仕組みを、初期設定PRで追加します。

## 手元で確認する

Node.js 24とPython 3を利用します。外部パッケージのインストールは不要です。

```sh
npm run check
npm test
npm run dev
```

`http://127.0.0.1:4173/` を開きます。

`dist/` が編集元、`cloudflare-pages/` は `npm run prepare:cloudflare` で作る公開用フォルダーです。

音源・歌詞全文・非公開の資料・認証情報は含みません。曲の紹介は制作側の解釈であり、ご本人の公式な推薦ではありません。
