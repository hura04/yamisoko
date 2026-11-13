# ヤミソコ / Yamisoko

暗闇をライトで照らしながら、地下へ降りていくブラウザアクションゲーム。

公開URL: https://hura04.github.io/yamisoko/

## 遊び方

- 矢印キー / WASD で移動（スマホは画面をなぞる）。ライトは進む方向を照らします。
- 光を当てた敵は動けません。電池が切れる前に出口（下り階段）を探そう。
- トゲの罠を踏むと電池が減ります。コインを集めて強化しよう。

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm test         # 自動テスト
npm run build    # 公開用ファイルを dist/ に作成
```

ブラウザでの確認（`npm run build` のあと `npx vite preview --port 4173` を起動しておく）:

```bash
node scripts/check-game.cjs http://localhost:4173/yamisoko/
node scripts/check-site.cjs http://localhost:4173/yamisoko/
```

## アップデート情報の書き方

`content/updates.json` に1件ずつ書き足すと、サイトの左右の欄に自動で表示されます。

```json
{ "date": "2026-11-20", "version": "1.1.0", "type": "change", "ja": "新しい敵を追加しました", "en": "Added a new enemy" }
```

- `type`: `news`（お知らせ）/ `change`（変更ログ）/ `plan`（今後の予定）
- `date` は `YYYY-MM-DD`。書き方が間違っているとテストが失敗し、公開されません。

## ご意見フォーム

`content/site.json` の `feedbackUrl` に Google フォームなどの URL を入れると「ご意見」欄が表示されます（空なら非表示）。

## 数値の調整

電池の減る速さ・敵の速さや数・強化の値段などは `src/game/balance.ts` と `src/game/upgrades.ts` にまとまっています。

## 公開の仕組み

`main` ブランチに push すると GitHub Actions がテスト → ビルド → GitHub Pages への公開を行います。テストが失敗したら公開されません。

初回だけ: GitHub のリポジトリ → **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にしてください。

## 検索に出るようにする（Google Search Console）

1. https://search.google.com/search-console を開き「プロパティを追加」→「URL プレフィックス」に `https://hura04.github.io/yamisoko/` を入力
2. 確認方法は「HTML タグ」を選び、表示された `<meta name="google-site-verification" ...>` を `index.html` の `<head>` に追加して push
3. 公開後に「確認」を押し、「URL 検査」でトップページの「インデックス登録をリクエスト」
