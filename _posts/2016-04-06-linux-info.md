---
layout: post
title: "全面了解Linux服务器"
date: 2016-04-06 22:53:28 +0800
comments: true
categories: 
---




#### 查看Linux服务器的CPU的详细情况

- 具有相同core id的cpu是同一个core的超线程
- 具有相同physical id的cpu是同一个cpu封装的线程或核心

##### 查看物理CPU的个数
```sh
cat /proc/cpuinfo | grep 'physical id' | sort | uniq | wc -l
```

##### 每个CPU中core的个数(即核心数)
```sh
cat /proc/cpuinfo | grep 'cpu cores' | uniq
```

##### 逻辑CPU的个数
```sh
cat /proc/cpuinfo | grep 'processor' | wc -l
```

-----


#### 查看服务器的内存使用情况

```sh
~ # free -m
             total       used       free     shared    buffers     cached
Mem:           994        884        110          0        151        401
-/+ buffers/cache:        330        664
Swap:          499         98        401
```
- total: 内存总数
- used: 已经使用的内存数
- free: 空闲的内存数
- shared: 多个进程共享的内存总额, 已废弃不用,总是0
- -buffers/cache: 已用(缓冲)内存总数, 即used-buffers-cached
- +buffers/cache: 可用(缓冲)内存总数, 即free+buffers+cached
- swap: 交换分区


-----


#### 查看Linux服务器的硬盘使用情况

1. 查看硬盘分区信息

```sh
~ # fdisk -l

Disk /dev/xvda: 21.5 GB, 21474836480 bytes
255 heads, 63 sectors/track, 2610 cylinders
Units = cylinders of 16065 * 512 = 8225280 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk identifier: 0x00073f45

    Device Boot      Start         End      Blocks   Id  System
/dev/xvda1   *           1        2611    20970496   83  Linux
```

2. 检查文件系统的磁盘占用情况

```sh
~ # df -h
文件系统	      容量  已用  可用 已用%% 挂载点
/dev/xvda1             20G   11G  8.4G  56% /
tmpfs                 498M     0  498M   0% /dev/shm
```

3. 查看硬盘的I/O情况

```sh
~ # iostat -d -x -k 1 5
Linux 2.6.32-358.6.2.el6.x86_64 (Jaylee) 	2016年04月06日 	_x86_64_	(1 CPU)

Device:  rrqm/s  wrqm/s  r/s   w/s  rkB/s  wkB/s avgrq-sz avgqu-sz  await  svctm  %util
xvda      0.00    0.20   1.99  0.40 45.00  2.41   39.67     0.01    5.63   0.98   0.24

Device:  rrqm/s  wrqm/s  r/s   w/s  rkB/s  wkB/s avgrq-sz avgqu-sz  await  svctm  %util
xvda      0.00    0.00   0.00  0.00  0.00  0.00   0.00     0.00     0.00   0.00   0.00

Device:  rrqm/s  wrqm/s  r/s   w/s  rkB/s  wkB/s avgrq-sz avgqu-sz  await  svctm  %util
xvda      0.00    0.00   0.00  0.00  0.00  0.00   0.00     0.00     0.00   0.00   0.00

Device:  rrqm/s  wrqm/s  r/s   w/s  rkB/s  wkB/s avgrq-sz avgqu-sz  await  svctm  %util
xvda      0.00    0.00   0.00  0.00  0.00  0.00   0.00     0.00     0.00   0.00   0.00

Device:  rrqm/s  wrqm/s  r/s   w/s  rkB/s  wkB/s avgrq-sz avgqu-sz  await  svctm  %util
xvda      0.00    0.00   0.00  0.00  0.00  0.00   0.00     0.00     0.00   0.00   0.00
```

##### 参数说明

- rrqm/s: 每秒进行 merge 的读操作数目, 即 delta (rmerge) /s
- wrqm/s: 每秒进行 merge 的写操作数目, 即 delta (wmerge) /s
- r/s: 每秒完成的读I/O设备的次数, 即 delta (rio) /s
- w/s: 每秒完成的写I/O设备的次数, 即 delta (wio) /s
- rkB/s: 每秒读K字节数
- wkB/s: 每秒写K字节数
- avgrq-sz: 平均每次设备I/O操作的数据大小
- avgqu-sz: 平均每次I/O队列的长度
- await: 平均每次设备I/O操作的等待时间
- svctm: 平均每次设备I/O操作的服务时间
- %util: 一秒中有百分之多少的时间用于I/O操作

> 我们只需要关心以下几个方面:

> 1. 如果 %util 接近100%, 说明产生的I/O请求太多, I/O系统已经满负荷, 磁盘可能存在瓶颈

> 2. await 的大小取决去服务时间(svctm), 以及I/O队列的长度和I/O请求的发现模式. 这个响应时间应该低于5ms,
> 如果大于5ms就表示磁盘I/O压力很大, 这时就可以考虑更换SSD, 调整内核elevator的算法, 优化应用, 或者升级CPU

4. 查看Linux系统中某目录的大小

```sh
~ # du -sh vimrc
292K	vimrc
```

5. 查看占用空间最多的十个文件或目录

```sh
~ # du -cks * | sort -rn  | head -n 10
793396	总用量
512004	swap
169072	shell
52568	nodejs
39968	mygo
6304	rdio-copy
2824	sjclijie.github.io
2444	go
2300	rails
1716	fis
```

-----


#### 查看Linux服务器的平均负载











