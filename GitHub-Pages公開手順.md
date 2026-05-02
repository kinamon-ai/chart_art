# Next.js を GitHub Pages に公開する完全マニュアル（コマンド中心）

この文書は **ゼロから Next.js プロジェクトを用意し、GitHub に載せ、GitHub Actions で静的サイトとして公開する**までの流れを、**一本の推奨ルート**で並べたものです。GitHub との連携は **GitHub CLI（`gh`）** に統一し、**汎用性・自動化しやすさ・成功しやすさ**のバランスがよい手順だけを載せています（REST API や Web だけでの作成など別ルートは本書では扱いません）。

---

## このマニュアルのゴールと前提

| ゴール | 内容 |
|--------|------|
| 公開形態 | **プロジェクトサイト** — `https://<GitHubユーザー名>.github.io/<リポジトリ名>/` |
| 技術 | Next.js（**静的エクスポート** `output: 'export'`）。サーバー上では Node は動かない。 |
| デプロイ | **GitHub Actions** が `npm run build` の結果（`out/`）を GitHub Pages に載せる。 |

**押さえておくこと**

- GitHub Pages は **静的ファイルの配信のみ**。Express などの Node サーバーは使えない。
- Next.js は **ビルド時に Node を使い**、出力された HTML/CSS/JS を置く。
- プロジェクトサイトでは URL が **`/<リポジトリ名>/`** から始まるため、ビルド時に **`BASE_PATH`** を **`/<リポジトリ名>`** に合わせる（後述のワークフローで自動）。

---

## 作業の順序（全体像）

次の順で進めると迷いにくいです。

1. [開発環境の確認](#1-開発環境の確認)
2. [Next.js 新規プロジェクトの作成](#2-nextjs-新規プロジェクトの作成)
3. [GitHub Pages 向けの Next.js 設定](#3-github-pages-向けの-nextjs-設定)
4. [GitHub Actions ワークフローの追加](#4-github-actions-ワークフローの追加)
5. [ローカルでビルド確認と package-lock](#5-ローカルでビルド確認と-package-lock)
6. [Git の初期化と初回コミット](#6-git-の初期化と初回コミット)
7. [GitHub 上にリモートリポジトリを作る（GitHub CLI）](#7-github-上にリモートリポジトリを作るgithub-cli)
8. [リモートへ push（必要な場合のみ）](#8-リモートへ-push必要な場合のみ)
9. [GitHub で Pages を「GitHub Actions」に設定](#9-github-で-pages-をgithub-actionsに設定)
10. [公開の確認とよくある詰まりどころ](#10-公開の確認とよくある詰まりどころ)
11. [特殊ケース](#11-特殊ケースユーザー名githubio-ルートサイトなど)

---

## 1. 開発環境の確認

```bash
node -v    # 例: v20 以上推奨（プロジェクトや CI の指定に合わせる）
npm -v
git --version
```

Git の **ユーザー名・メール**（コミット作者）は任意で設定する。

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

本手順では GitHub との認証を **`gh auth login`** にまとめる（`git` 単体の PAT／SSH は §8 の補足のみ）。

---

## 2. Next.js 新規プロジェクトの作成

プロジェクト名は **`リポジトリ名`** と同じにすると、`BASE_PATH` のイメージが合いやすい（必須ではない）。

```bash
npx create-next-app@latest my-app
```

対話モードでは例として次のような選択が無難です（静的サイト中心なら）。

- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: 任意
- `src/` directory: 任意
- App Router: **Yes**
- Turbopack: 任意

作成後、ディレクトリに移動する。

```bash
cd my-app
```

**補足**: `output: 'export'` では **サーバー専用機能**（`dynamic = 'force-dynamic'` を多用、`headers()` だけの処理など）に制限がある。標準的な静的ページ＋クライアントコンポーネント中心なら問題になりにくい。

---

## 3. GitHub Pages 向けの Next.js 設定

`next.config.ts`（または `next.config.mjs`）を、次の考え方で整える。

| 設定 | 理由 |
|------|------|
| `output: 'export'` | 静的ファイルを `out/` に出力する |
| `basePath` / `assetPrefix` | 環境変数 `BASE_PATH` から読む（ローカルは空、CI は `/リポジトリ名`） |
| `images.unoptimized: true` | 静的エクスポートでは画像最適化 API が使えないためよく指定する |
| `trailingSlash: true` | GitHub Pages とパスの相性をよくする例として推奨することが多い |

**例**（このリポジトリと同じ方針）:

```ts
import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

`package.json` の `build` は通常 **`next build`** のままでよい（`next export` は App Router では `output: 'export'` に含まれる）。

---

## 4. GitHub Actions ワークフローの追加

リポジトリ直下に **`.github/workflows/deploy-pages.yml`** を置く。次の内容は **このプロジェクトに含まれているものと同一の考え方**です。

**ポイント**

- `npm ci` を使うため **`package-lock.json` をコミットする**必要がある。
- `BASE_PATH: /${{ github.event.repository.name }}` で **リポジトリ名とパスを自動一致**させる。
- `main` / `master` への push と手動 **`workflow_dispatch`** で動かす。

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
      - run: npm ci
      - name: Build static export
        env:
          BASE_PATH: /${{ github.event.repository.name }}
        run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 5. ローカルでビルド確認と package-lock

プロジェクト直下で:

```bash
npm install
npm run build
```

- 成功すると **`out/`** に静的ファイルが生成される。
- **`package-lock.json` が生成または更新される**。これを **必ず Git に含める**（CI の `npm ci` が失敗するため）。

GitHub Pages と同じパスで試す場合（任意）:

```bash
BASE_PATH=/リポジトリ名 npm run build
```

※ `/リポジトリ名` は実際の GitHub リポジトリ名に置き換える。

ローカルで `BASE_PATH` 付きの `out/` を **`http://localhost:3000/リポジトリ名/` のように**見たい場合は、サブパス対応の静的サーバーが必要で手間が増える。**まずは CI 上のデプロイ結果で確認する**運用でもよい。

---

## 6. Git の初期化と初回コミット

### 6.1 `.gitignore`

Next.js なら通常は `create-next-app` が `.gitignore` を用意する。少なくとも次は含まれることが望ましい。

- `node_modules`
- `.next`
- `out`
- `.env*.local`

### 6.2 ブランチ名を `main` にそろえる（推奨）

ワークフローが `main` / `master` を前提にしているため、デフォルトブランチを **`main`** にする。

```bash
git init
git branch -M main
git add .
git status   # package-lock.json と .github/workflows/ が含まれているか確認
git commit -m "Initial commit: Next.js static export for GitHub Pages"
```

---

## 7. GitHub 上にリモートリポジトリを作る（GitHub CLI）

**リモートは GitHub 側にリポジトリが必要です。** 本手順では **GitHub 公式の CLI（`gh`）** のみを使います。公式ドキュメントが揃っており、**リポジトリ作成・`origin` 設定・初回 `push` までを一連のコマンドで済ませられる**ため、REST API やブラウザだけの運用より失敗しにくいです。

**インストール確認**（§7.1 に進む前に実行する）:

```bash
gh --version
```

エラーや「command not found」なら、先に [GitHub CLI のインストール](https://cli.github.com/)を行い、再度 `gh --version` で問題ないことを確認してから次へ進む。

### 7.1 ログイン

本手順全体で **`gh auth login` が認証の前提**である。

```bash
gh auth login -h github.com
```

画面の案内に従う。**HTTPS を選ぶ**と、多くの環境で **ブラウザによる認証**が挟まる（後述の「付録」のとおり、ここが初回の主な Web 操作のひとつ）。

### 7.2 リポジトリ作成・リモート登録・初回 push（この手順書の標準）

プロジェクトのルート（`package.json` があるディレクトリ）で実行する。

```bash
gh repo create . --public --source=. --remote=origin --push
```

これだけで次がまとめて行われる。

- GitHub 上に **カレントディレクトリ名と同じ名前**のリポジトリが作成される  
- **`origin`** が設定される  
- 現在の **`main`** の内容が **push** される  

**リポジトリ名と `BASE_PATH` の関係**: ワークフローは **`github.event.repository.name`** を `BASE_PATH` に使う。上記コマンドでは **フォルダ名 = GitHub 上のリポジトリ名**になるので、**プロジェクトを置いたフォルダ名を、公開したいパス（例: `chart_art`）に合わせておく**と混乱が少ない。

オプションの例:

- 非公開にする: `--private`（`--public` と置き換え）
- 説明文を付ける: `--description "静的サイト"`

**リポジトリ名を明示したい場合**（ユーザーまたは Organization 配下で名前だけ変える）:

```bash
gh repo create <ユーザー名またはorg>/<リポジトリ名> --public --source=. --remote=origin --push
```

例: `gh repo create kinamon/chart_art --public --source=. --remote=origin --push`

---

## 8. リモートへ push（必要な場合のみ）

**§7 で `gh repo create ... --push` まで成功していれば、すでに `main` は GitHub に送られているので、この節は読み飛ばして [§9](#9-github-で-pages-をgithub-actionsに設定) へ進んでよい。**

次のようなときだけここを実施する。

- §7 で **`--push` を付け忘れた**、または **リモートだけ作成**した
- **別のマシン**で clone してから追記コミットしたあと送りたい

リモートの確認:

```bash
git remote -v
```

初回または upstream 未設定のとき（**`gh auth login` 済み**で、通常は Git から GitHub へ送れる状態になっている想定）:

```bash
git push -u origin main
```

push が通ると、**ワークフローが起動する**（`.github/workflows/deploy-pages.yml` がリポジトリに含まれている前提）。`git push` が失敗する場合は **`gh auth login` をやり直す**、あるいは `gh auth status` で状態を確認する。`git` 単体の HTTPS／PAT 設定や **SSH の `origin`** については、本手順は **`gh` 前提**のため扱わない。

---

## 9. GitHub で Pages を「GitHub Actions」に設定

**初回だけ**（またはまだなら）ブラウザで次を実施する。

1. GitHub で対象リポジトリを開く。
2. **Settings** → **Pages**。
3. **Build and deployment** の **Source** で **GitHub Actions** を選択する。  
   - 「Deploy from a branch」のみだと、このワークフロー方式とは別ルートになる。

初回デプロイ後、**Environments** に `github-pages` が現れ、Organization によっては **承認**が必要になることがある。

公開 URL の目安:

```text
https://<ユーザー名>.github.io/<リポジトリ名>/
```

---

## 10. 公開の確認とよくある詰まりどころ

### 確認手順

1. **Actions** タブでワークフローが成功（緑）か確認する。
2. 数分待って **`https://<ユーザー名>.github.io/<リポジトリ名>/`** を開く。
3. **Settings → Pages** にサイト URL が表示されることがある。

### よくある原因

| 現象 | 確認すること |
|------|----------------|
| Actions で `npm ci` が失敗 | **`package-lock.json` がコミットされているか** |
| 真っ白・404 | **`BASE_PATH` とリポジトリ名**が一致しているか（ワークフローの式なら通常一致）、Pages のソースが **GitHub Actions** か |
| ワークフローが動かない | **デフォルトブランチ**が `main`/`master` 以外なら、ワークフローの `branches` に追加 |
| `push` できない | **`gh auth status` / `gh auth login` を再実行**（本手順は `gh` 前提） |

---

## 11. 特殊ケース（`ユーザー名.github.io` ルートサイトなど）

### `https://<ユーザー>.github.io/` の直下に置きたい

リポジトリ名が **`<ユーザー名>.github.io`** のとき、サイトはルート **`/`** になることが多い。この場合 **`BASE_PATH` は空**（未設定）にし、`next.config` 側でも `basePath` が付かないようにする。

実装の選び方の例:

- **そのリポジトリ専用**にワークフローを分け、`Build static export` の `env` で **`BASE_PATH` を書かない**、または空でビルドするステップだけ別ファイルにする。
- **`github.event.repository.name`** が `octocat.github.io` のときだけ `BASE_PATH` を変える、といった **条件分岐**を Actions の式で書く方法もあるが、式が長くなりやすいので、**ルート用リポジトリではワークフローをシンプルに固定する**のがおすすめ。

このリポジトリのデフォルトワークフローは **プロジェクトサイト**（`/リポジトリ名/`）向けなので、**`ユーザー名.github.io` リポジトリでは `deploy-pages.yml` の `env` を編集**してから使う。

---

## 12. 最短チェックリスト（コピペ用）

- [ ] `next.config` に `output: 'export'` と `BASE_PATH` 対応
- [ ] `.github/workflows/deploy-pages.yml` を追加
- [ ] `npm install` → `npm run build` がローカルで成功
- [ ] **`package-lock.json` をコミット**
- [ ] `git init` → `main` → 初回コミット
- [ ] **`gh --version`** で CLI 確認 → **`gh auth login`** → **`gh repo create . --public --source=. --remote=origin --push`**（§7）
- [ ] （§7 で push 済みならスキップ）**`git push -u origin main`**（§8）
- [ ] **Settings → Pages → Source: GitHub Actions**（§9）
- [ ] Actions 成功 → サイト URL を確認

---

以上が、Next.js 新規作成から GitHub Pages 公開までの **一通りの手順**です。既存リポジトリ（本プロジェクト）では **すでに Next 設定とワークフローがある**ため、主に **§6〜§9（Git・`gh repo create`・必要なら push・Pages 設定）** を順に実施すればよいです。

---

## 付録: 自動化できる範囲と、手動（Web など）が必要な範囲（仕分け）

本手順は **§7 を GitHub CLI（`gh`）に一本化**した前提で整理する。

### コマンド・ファイル・CI だけで進む部分（自動化の寄せどころ）

| 区分 | 内容 |
|------|------|
| ローカル | Node の確認、`create-next-app`、`next.config` の編集、`.github/workflows/deploy-pages.yml` の追加 |
| ビルド | `npm install` / `npm run build`、`package-lock.json` の生成とコミット |
| Git | `git init`、`main`、コミット |
| GitHub 側の「箱」と初回反映 | **`gh auth login` 済み**のうえで **`gh repo create ... --source=. --remote=origin --push`** により、**リポジトリ作成・`origin`・初回 push を一括で実行**できる |
| デプロイ処理 | **`push` 後**、GitHub Actions が **ビルド → `out/` を Pages 用にアップロード → 公開**まで実行（ワークフロー成功が前提） |
| 日常の更新 | **`main` に push するだけ**で、再ビルド・再公開が走る（§9 は初回のみ） |

### ブラウザや Web・対話が挟まりやすい部分（手動寄り）

| 区分 | 内容 |
|------|------|
| **`gh auth login`** | 多くの場合、**ブラウザでログインまたはデバイス認証**が必要。トークン貼り付け方式を選べばブラウザは省略できることもあるが、初回セットアップの「人が一度介入する」ステップになりやすい。 |
| **§9: Pages の Source を「GitHub Actions」に設定** | **GitHub の Web**（Settings → Pages）での選択が、本手順書の**既定ルート**。**このリポジトリでは API に頼らず UI で確実に済ませる。** |
| **Organization** | Actions / Pages の禁止、**Environment `github-pages` の承認フロー**などで、**Web 上の承認**が入ることがある。 |
| **`create-next-app` の対話** | 手順 §2 は対話例。完全にコマンドだけにしたい場合は、`create-next-app` の **非対話フラグ**（公式ドキュメント参照）で初期選択を固定できる。 |

※ Git の **HTTPS + PAT だけ**や **`origin` を SSH に固定する**運用は、本書では **`gh auth login` 前提**のため説明を割愛する。

### 一言でいうと

- **「毎回の公開作業」そのもの**は、**`git push` → Actions** でかなり自動に近い。
- **初回だけ**、**`gh` のログイン**と **Pages の Source 切り替え（§9）** が、多くの環境で **Web／ブラウザが必要**になりやすい。
- §9 を一度済ませれば、**通常はもう Web を開かず**に push だけで更新できる。
