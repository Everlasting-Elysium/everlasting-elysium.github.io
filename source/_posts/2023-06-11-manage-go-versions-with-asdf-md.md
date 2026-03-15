---
title: "使用 asdf 管理 Go 多版本：一站式解决开发环境难题"
date: 2023-06-11
headimg: https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=75
categories:
  - Development tools
tags:
  - 开发工具
  - 环境配置
  - Golang
  - 版本管理
  - asdf
---

最近接手的公司的另外一个项目，发现其使用的Go在多项目开发中，不同 Go 项目可能依赖不同的 Go 版本，手动实在繁琐，就找到了 asdf。

## 为什么选择 asdf？​

asdf的核心优势在于 **“一站式管理”** ：它支持 Go、Node.js、Python、Java 等数十种编程语言，一个工具就能统一管控所有开发依赖的版本。对于多语言混合开发的项目（比如同时用到 Go 和 Node.js），asdf 通过单个.tool-versions文件即可定义所有语言版本。  
​

## asdf 安装与配置步骤​

  1. 安装 asdf
         
         1  
         2  
         

| 
         
         brew install asdf​  
           
  
---|---  
  2. 初始化 shell（以 zsh 为例）​
         
         1  
         2  
         3  
         4  
         

| 
         
         echo -e "\n. $(brew --prefix asdf)/libexec/asdf.sh" >> ~/.zshrc​  
           
         source ~/.zshrc​  
           
  
---|---  
  3. 添加 Go 插件​
         
         1  
         2  
         

| 
         
         asdf plugin add golang   
           
  
---|---  
  4. 安装指定 Go 版本​
         
         1  
         2  
         3  
         4  
         

| 
         
         asdf list all golang​  
           
         asdf install golang 1.16.15​  
           
  
---|---  
  5. 项目级与全局版本管理​
         
         1  
         2  
         3  
         4  
         5  
         6  
         7  
         

| 
         
           
         asdf local golang 1.16.15​  
         ​  
           
           
         asdf global golang 1.21.0​  
           
  
---|---  



## asdf 的优缺点​

### 优点​

  1. 多语言支持：一个工具管理 Go、Node.js、Python 等所有开发语言，减少工具学习成本。​
  2. 统一配置文件：.tool-versions文件可纳入 Git，团队成员克隆项目后自动同步版本环境。​
  3. 扩展性强：社区插件丰富，几乎覆盖所有主流编程语言。​



### 缺点​

  1. 初次配置稍复杂：需手动安装插件和初始化 shell（但配置一次即可长期使用）。​
  2. 部分插件偶有小 bug：个别语言的插件可能存在版本检测延迟等问题（Go 插件稳定性较好）。​



## 总结​

如果你需要同时管理多种编程语言的版本，asdf 是 “一劳永逸” 的选择。它通过简洁的命令和统一的配置文件，让 Go 版本切换变得无感，尤其适合多语言混合开发的团队，彻底告别 “这个版本在我这能跑” 的协作困境。​

## Update

自v0.14.0起，asdf废弃了local 和 global 命令，新命令如下：
    
    
    1  
    2  
    3  
    4  
    5  
    

| 
    
    
      
    asdf set golang 1.16  
      
      
    asdf set --global golang 1.16  
      
  
---|---
