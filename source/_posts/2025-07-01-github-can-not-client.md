---
title: "github 无法链接问题排查"
date: 2025-07-01
headimg: /img/post/github.png
categories:
  - Troubleshooting & Solutions
tags:
  - GitHub
  - 网络
---

最近发现在家只要是和github相关的操作都无法正常进行，但网页端访问却没问题。  
  
于是开始着手解决。

### 解决方案：

  1. 先获取github动态地址，从`https://www.ipaddress.com/site/www.github.com`获取。
  2. 找到设备的host文件，加入`githubIP github.com`这行。
  3. 问题解决。
