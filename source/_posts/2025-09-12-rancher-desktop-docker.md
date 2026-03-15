---
title: "Rancher Desktop配置Docker源"
date: 2025-09-12
headimg: https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80
categories:
  - Development tools
tags:
  - 开发工具
  - Docker
  - 环境配置
  - Rancher Desktop
---

最近公司禁用了Docker Desktop,找了半天最后选中Rancher Desktop，一方面是同时支持docker和k8s，另一方面是开源，再者全平台都有就它了！  
但是，相当简陋比如如何配置Docker的镜像源，我研究了半天。  
  
### 具体步骤如下：

  1. 首先用SSH登录到到虚拟机
         
         1  
         

| 
         
         LIMA_HOME="$HOME/Library/Application Support/rancher-desktop/lima" "/Applications/Rancher Desktop.app/Contents/Resources/resources/darwin/lima/bin/limactl" shell 0  
           
  
---|---  
  2. 提升权限
         
         1  
         

| 
         
         sudo su  
           
  
---|---  
  3. 编辑docker配置，添加镜像源
         
         vi /etc/docker/daemon.json
         
         {
             "registry-mirrors": [
                 "https://docker.xuanyuan.me",
                 "https://docker.m.daocloud.io",
                 "https://docker.xuanyuan.me",
                 "https://docker.1ms.run",
                 "https://docker.1panel.live",
                 "https://hub.rat.dev",
                 "https://docker-mirror.aigc2d.com"
             ]
         }
         

  4. 重启Docker




### Ref

<https://github.com/rancher-sandbox/rancher-desktop/discussions/1477>
