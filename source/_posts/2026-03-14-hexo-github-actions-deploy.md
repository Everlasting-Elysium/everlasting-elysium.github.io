---
title: "用 GitHub Actions 自动部署 Hexo 博客到 GitHub Pages"
date: 2026-03-14
headimg: https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&q=80
categories:
  - 建站折腾
tags:
  - Hexo
  - GitHub Actions
  - CI/CD
  - GitHub Pages
---

每次写完文章都要手动 `hexo g && hexo d`，烦了之后就研究了一下 GitHub Actions 自动部署。折腾了一个下午，踩了几个坑，现在记下来。

### 前置条件

在开始之前，确认以下几点已经就绪：

- 本地 Hexo 项目能正常跑，`hexo g` 不报错
- GitHub 账号，且已建好 `username.github.io` 仓库
- 主题**建议用 git submodule 引入**，而不是直接把主题文件夹复制进来

关于主题的问题，说一下为什么推荐 submodule：直接复制进来会导致主题更新麻烦，而且会把一堆主题文件混进你的博客提交记录里，非常乱。用 submodule 的话，主题是一个独立的 git 引用，升级也只需要一条命令。

添加 submodule 的方式：

```bash
git submodule add https://github.com/theme-author/hexo-theme-xxx themes/xxx
```

---

### 两种常见的仓库结构

**方案 A（推荐，最简单）**

一个仓库，两个分支：
- `main` 分支：放 Hexo 源码（`_config.yml`、`source/`、`themes/` 等）
- `gh-pages` 分支：放构建产物（`public/` 里的内容）

Actions 负责把 `main` 上的源码构建后，推送到 `gh-pages` 分支。Pages 从 `gh-pages` 分支提供服务。

**方案 B（两个仓库）**

源码放私有仓库，构建产物推送到公开的 `username.github.io` 仓库。适合不想暴露源码的场景，但有个致命问题：**GitHub Free 账户不支持私有仓库开启 GitHub Pages**，所以方案 B 实际上要么源码仓库是公开的，要么你有 GitHub Pro。

大多数人直接用方案 A 就行了，下面只讲方案 A。

---

### 核心 Workflow 配置

在博客仓库根目录创建 `.github/workflows/deploy.yml`，内容如下：

```yaml
name: Deploy Hexo to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout（含 submodule）
        uses: actions/checkout@v4
        with:
          submodules: recursive   # 拉取主题 submodule

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npx hexo generate

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: gh-pages
```

几个细节说一下：

- `npm ci` 比 `npm install` 更适合 CI 环境，它严格按 `package-lock.json` 安装，不会悄悄升级依赖
- `peaceiris/actions-gh-pages` 是这类场景的标准做法，`GITHUB_TOKEN` 是 Actions 自带的，不需要额外配置
- Node 版本选 `20`，Hexo 对太旧的 Node 有兼容问题

---

### GitHub Pages 设置

Workflow 跑完之后，去仓库的 **Settings → Pages**，把 Source 改成：

```
Deploy from a branch → gh-pages → / (root)
```

保存之后，GitHub 会从 `gh-pages` 分支提供网站服务。第一次配置完大概等一两分钟就能访问了。

---

### submodule 的坑

这是我踩得最深的一个坑，记录一下。

**坑一：忘加 `submodules: recursive`**

普通的 `actions/checkout` 默认**不拉 submodule**，如果主题是 submodule，构建时会发现 `themes/xxx` 是个空文件夹，然后 `hexo g` 报错说找不到主题。解决方法就是加上 `submodules: recursive`，如上面的 workflow 所示。

**坑二：主题仓库是私有的**

如果你的主题 fork 了一个私有副本，`submodules: recursive` 会因为没有权限拉取而失败。这种情况需要配置 SSH deploy key：

1. 本地生成密钥对：`ssh-keygen -t ed25519 -C "hexo-deploy" -f hexo_deploy_key`
2. 公钥（`hexo_deploy_key.pub`）加到**主题仓库**的 Settings → Deploy Keys
3. 私钥（`hexo_deploy_key`）加到**博客仓库**的 Settings → Secrets，命名比如 `THEME_DEPLOY_KEY`
4. Workflow 里的 checkout 步骤改为使用这个 key：

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
    ssh-key: ${{ secrets.THEME_DEPLOY_KEY }}
```

如果主题用的是公开仓库（大多数情况），直接用 `submodules: recursive` 就行，不需要额外配置密钥。

---

### 如何触发构建

配置好之后，每次把改动 push 到 `main` 分支，Actions 就会自动跑起来，几分钟后网站就更新了。

有一个情况容易忘：**更新主题 submodule 后**，需要在博客仓库执行：

```bash
git submodule update --remote themes/xxx
git add themes/xxx
git commit -m "chore: update theme submodule"
git push
```

单纯进主题文件夹改了东西再 push，博客仓库不会感知到，因为 submodule 记录的是一个 commit hash，需要显式更新。

---

### 常见问题排查

**Build 步骤失败**

先在本地跑一遍 `hexo g`，90% 的情况本地就能复现，修好之后再推。Actions 的报错信息有时候不够直白，本地调试更快。

**Pages 没更新**

检查两件事：一是 `gh-pages` 分支是否有新的 commit（去仓库的 branches 页面看），二是 Settings 里 Pages 的 Source 是否对上了。有时候第一次创建 `gh-pages` 分支之后，Pages 设置还停在默认的 `main` 分支，需要手动改过来。

**submodule 拉取失败（权限问题）**

错误信息一般是 `fatal: clone of 'https://github.com/...' into submodule path '...' failed`。先确认 `submodules: recursive` 有没有写，再确认主题仓库是不是私有的。私有仓库走上面说的 SSH deploy key 流程。

---

整个流程跑通之后，写文章的体验好了很多，push 上去就不用管了，泡杯茶回来网站已经更新了。
