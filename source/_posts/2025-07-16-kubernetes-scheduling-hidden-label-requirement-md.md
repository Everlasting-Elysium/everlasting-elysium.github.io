---
title: "Kubernetes调度排查：隐藏的标签需求导致Pod调度失败"
date: 2025-07-16
headimg: https://images.unsplash.com/photo-1536148935331-408321065b18?w=400&q=75
categories:
  - Troubleshooting & Solutions
tags:
  - Kubernetes
---

> 记录一次线上Kubernetes集群GPU节点调度失败的排查过程，揭示自定义调度器的”隐藏需求”如何成为故障的罪魁祸首。

### 问题背景

在部署AI推理服务时，发现Pod持续处于`Pending`状态，事件日志显示：
    
    
    1  
    

| 
    
    
    0/469 nodes are available: 459 node(s) didn't match Pod's node affinity/selector.  
      
  
---|---  
  
### 初步排查

  1. Pod明确要求调度到带有特定标签的GPU节点，以及目标节点的标签完全匹配需求:


    
    
    1  
    2  
    3  
    4  
    5  
    6  
    7  
    8  
    

| 
    
    
    affinity:  
      nodeAffinity:  
        requiredDuringSchedulingIgnoredDuringExecution:  
          nodeSelectorTerms:  
            - matchExpressions:  
                - key: a10  
                  operator: In  
                  values: ["enable"]  
      
  
---|---  
      
    
    1  
    

| 
    
    
    Labels: a10=enable  
      
  
---|---  
  
  2. 污点容忍检查


    
    
    1  
    

| 
    
    
    Taints: calculate=enable:NoSchedule  
      
  
---|---  
      
    
    1  
    2  
    3  
    4  
    5  
    6  
    

| 
    
    
      
    tolerations:  
      - key: calculate  
        operator: Equal  
        value: enable  
        effect: NoSchedule  
      
  
---|---  
  
  3. 资源验证


    
    
    1  
    2  
    3  
    4  
    

| 
    
    
    Capacity:  
      nvidia.com/gpu:     4  
    Allocatable:  
      nvidia.com/gpu:     4  
      
  
---|---  
      
    
    1  
    2  
    3  
    4  
    

| 
    
    
      
    resources:  
      limits:  
        nvidia.com/gpu: '1'  
      
  
---|---  
  
  4. 节点状态确认


    
    
    1  
    2  
    

| 
    
    
    Conditions:  
      Ready: True  
      
  
---|---  
  
### 深入排查

当常规检查无果时，进行深入分析调度器行为：  
关键发现：调度器特殊需求
    
    
    1  
    

| 
    
    
    schedulerName: hami-scheduler  
      
  
---|---  
  
Hami是自定义调度器，其文档中有一条容易被忽略的说明：GPU节点需额外添加标签：`gpu=on`,然后验证节点标签
    
    
    1  
    

| 
    
    
    kubectl get node p-hbhl-a10-01 --show-labels  
      
  
---|---  
  
输出证实缺失关键标签：
    
    
    1  
    2  
    

| 
    
    
    LABELS: a10=enable,beta.kubernetes.io/arch=amd64,...   
      
      
  
---|---  
  
### 解决方案

  1. 添加缺失标签
         
         1  
         

| 
         
         kubectl label nodes p-hbhl-a10-01 gpu=on  
           
  
---|---  
  2. 验证标签添加
         
         1  
         

| 
         
         kubectl get node p-hbhl-a10-01 -L gpu  
           
  
---|---  



### 经验总结

  1. 自定义调度器可能有未文档化的隐式需求，需结合源码和实际部署验证。
  2. 标签检查要点
         
         1  
         2  
         3  
         4  
         5  
         

| 
         
         kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.labels}{"\n"}{end}'  
           
           
         kubectl get nodes -l gpu=on --show-labels  
           
  
---|---  



### 预防措施：

  1. 建立调度器需求清单
  2. 使用准入控制器验证节点标签
  3. 在CI/CD中添加调度预检查
  4. 教训：看似简单的调度失败，往往隐藏着调度器的”潜规则”。在分布式系统中，显式约定优于隐式约定，文档完整性决定运维效率！



### 附录：常用诊断命令
    
    
    1  
    2  
    3  
    4  
    5  
    6  
    7  
    8  
    

| 
    
    
      
    kubectl describe pod <pod-name> | grep -A 10 Events  
      
      
    kubectl describe node <node-name> | grep -A 10 Allocated  
      
      
    kubectl logs -n kube-system <scheduler-pod> | grep Filter  
      
  
---|---
