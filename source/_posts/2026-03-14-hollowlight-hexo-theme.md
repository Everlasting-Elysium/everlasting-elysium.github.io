---
title: "HollowLight：一个致敬《绝区零》绳网论坛的 Hexo 主题"
date: 2026-03-14
headimg: https://images.unsplash.com/photo-1545670723-196ed0954986?w=1200&q=80
categories:
  - 建站折腾
tags:
  - Hexo
  - HollowLight
  - 主题
---

玩《绝区零》的时候，我一直很喜欢游戏内那个「绳网」论坛的 UI 设计。纯黑背景，荧光黄高亮，字体干净利落，整体氛围很赛博，但又不会眼花缭乱。某天刷着帖子突然想，能不能把这个风格做成 Hexo 主题？

于是就有了 HollowLight。

仓库地址：[https://github.com/Everlasting-Elysium/HollowLight](https://github.com/Everlasting-Elysium/HollowLight)

---

### 先说几句

这个主题是我边玩游戏边写出来的，算是个人向的产物。设计上深度参考了绳网论坛的视觉语言，核心 accent 色用的是 `#fbfe00` 那个荧光黄，字体用的是猫啃什锦黑，整体就是追求那种暗黑+霓虹的感觉。

功能上我尽量做了该有的都有，首页幕布、瀑布流卡片、相册、友链、标签球、本地搜索……不算多花哨，但够用。

---

### 安装

主题通过 git submodule 安装，这样方便后续拉取更新：

```bash
git submodule add git@github.com:Everlasting-Elysium/HollowLight.git themes/HollowLight
```

然后在 Hexo 根目录的 `_config.yml` 里改一下主题：

```yaml
theme: HollowLight
```

把主题目录里的 `_config.HollowLight.yml` 复制一份到 Hexo 根目录，后续所有配置都在这里改。

如果你需要搜索功能，还要额外装一个插件：

```bash
npm install hexo-generator-searchdb
```

---

### 配置概览

`_config.HollowLight.yml` 里主要的字段长这样：

```yaml
author:
  name: "你的名字"
  avatar: /img/avatar.svg
  bio: "个人简介"

menu:
  推送: /
  归档: /archives/
  标签: /tags/
  相册: /album/
  伙伴: /friends/
  关于: /about/

background: /img/bg.png

curtain:
  enable: true
  background:
    type: image   # image 或 video
    url: /img/curtain-bg.jpg
  typewriter:
    - "你好，世界"
    - "欢迎来到我的博客"

search:
  enable: true
```

菜单项是可以自定义名字的，我直接用了「推送」对应首页，贴近绳网论坛那个味道。

---

### 首页幕布

这是我比较喜欢的一个功能。开启 `curtain.enable: true` 之后，进入首页会先看到一个全屏的 Hero 区域，背景可以是图片也可以是视频，上面有打字机效果滚动显示你配置的文字，点击或者向下滚动才会进入文章列表。

背景图需要你自己放到 `source/img/` 里，主题不含示例图，别忘了这一步，不然幕布背景是黑色的。

视频背景的话，`type: video` 配上视频 URL 就行，适合想搞得炫一点的。

---

### 首页文章列表

进了幕布之后是瀑布流卡片布局。文章支持封面图，在 frontmatter 里加 `headimg` 字段：

```yaml
---
title: "文章标题"
headimg: https://example.com/cover.jpg
---
```

想置顶某篇文章，加 `pin: true`：

```yaml
---
title: "置顶文章"
pin: true
---
```

---

### 文章详情页

文章页也会把 `headimg` 作为页面顶部的大图展示，加了渐变遮罩，文章内容卡片浮在封面图上方。视觉上比较好看，代价是如果你的封面图颜色很浅，遮罩效果可能会弱一点。

代码块用的 one-dark 主题，右上角有复制按钮。

---

### 相册页

相册是我花时间比较多的一个功能。数据文件放在 `source/_data/album.yml`：

```yaml
albums:
  - id: my-album
    name: "相册名"
    cover: /img/gallery/cover.jpg
    description: "描述"
    photos:
      - url: /img/gallery/1.jpg
        thumb: /img/gallery/1.thumb.webp
        title: "标题"
        desc: "描述"
        link: "https://..."  # 可选，点击跳转
```

几个值得注意的地方：

**`id` 字段**。每个相册有自己的 id，支持 hash 直达，比如 `/album/#my-album` 会直接定位到那个相册，分享某个具体相册链接的时候比较方便。

**`thumb` 缩略图**。这个字段是可选的，但我强烈建议提供。列表页加载的是缩略图，如果没有 `thumb` 就会直接加载原图，图片一多页面会卡。主题仓库里有一个 `.github/scripts/compress-images.js`，可以配合 GitHub Actions 批量生成 webp 缩略图，懒得手动压图的话可以参考一下。

相册页本身是多分组 tab，CSS masonry 瀑布流布局，点击图片会有 lightbox 弹出，3D 玻璃卡片效果，在纯黑背景下看起来还不错。

---

### 友链页

友链数据放在 `source/_data/friends.yml`。支持新旧两种格式：

旧版（单组，向下兼容）：
```yaml
friends:
  - name: "博主名"
    url: "https://..."
    avatar: "https://..."
    desc: "一句话介绍"
```

新版（多分组）：
```yaml
sections:
  - title: "分组一"
    subtitle: PORTFOLIO
    items:
      - name: "博主名"
        url: "https://..."
        icon: "https://..."
        desc: "一句话介绍"
```

内部链接（`/` 开头的同站路径）不会打开新标签，外链才会。

---

### 3D 标签球

标签页（`/tags/`）会显示一个 3D 标签球，用 Fibonacci 球体算法分布标签位置，支持鼠标拖动交互。标签越多越好看，博客刚建的时候只有几个标签，球就有点空旷……

---

### 本地搜索

需要装了 `hexo-generator-searchdb` 插件，并在配置里开启：

```yaml
search:
  enable: true
```

快捷键是 `Ctrl+K`（Mac 上是 `Cmd+K`），触发搜索弹窗。搜索的是本地生成的索引文件，不依赖第三方服务。

---

### 几个坑

用下来有几点需要注意：

1. **幕布背景图要自己放**。主题 `source/img/` 下没有示例图片，`curtain.background.url` 填的路径对应 `source/` 下的文件，空了就是黑背景。

2. **搜索插件要单独装**。`hexo-generator-searchdb` 不是 Hexo 内置的，忘了装搜索就不工作。

3. **相册没有 thumb 会很慢**。原图直接拿来当缩略图，100 张图的相册列表页加载时间感人。

4. **submodule 更新**。主题用 submodule 管理，更新主题需要：
   ```bash
   git submodule update --remote themes/HollowLight
   ```

5. **字体加载**。猫啃什锦黑是从字体 CDN 加载的，国内访问速度视情况而定。

---

总体来说 HollowLight 是一个比较小众的主题，受众基本就是喜欢 ZZZ 或者喜欢这种暗黑赛博风格的人。如果你想要一个轻量、干净、有点游戏感的 Hexo 主题，可以试试看。有问题的话去仓库开 issue，我看到了会回。
