---
layout: post
title: "全面了解Linux服务器"
date: 2016-04-06 22:53:28 +0800
comments: true
categories: Linux
---


### ```查看Linux服务器的CPU的详细情况```

>具有相同core id的cpu是同一个core的超线程

>具有相同physical id的cpu是同一个cpu封装的线程或核心

1.**查看物理CPU的个数**

```sh
cat /proc/cpuinfo | grep 'physical id' | sort | uniq | wc -l
```

2.**每个CPU中core的个数(即核心数)**

```sh
cat /proc/cpuinfo | grep 'cpu cores' | uniq
```

3.**逻辑CPU的个数**

```sh
cat /proc/cpuinfo | grep 'processor' | wc -l
```

-----


### ```查看服务器的内存使用情况```

```sh
~ # free -m
             total       used       free     shared    buffers     cached
Mem:           994        884        110          0        151        401
-/+ buffers/cache:        330        664
Swap:          499         98        401
```

##### 参数说明

- total: 内存总数
- used: 已经使用的内存数
- free: 空闲的内存数
- shared: 多个进程共享的内存总额, 已废弃不用,总是0
- -buffers/cache: 已用(缓冲)内存总数, 即used-buffers-cached
- +buffers/cache: 可用(缓冲)内存总数, 即free+buffers+cached
- swap: 交换分区

-----


### ```查看Linux服务器的硬盘使用情况```

1.**查看硬盘分区信息**

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


2.**检查文件系统的磁盘占用情况**

```sh
~ # df -h
文件系统	      容量  已用  可用 已用%% 挂载点
/dev/xvda1             20G   11G  8.4G  56% /
tmpfs                 498M     0  498M   0% /dev/shm
```


3.**查看硬盘的I/O情况**

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


4.**查看Linux系统中某目录的大小**

```sh
~ # du -sh vimrc
292K	vimrc
```


5.**查看占用空间最多的十个文件或目录**

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


### ```查看Linux服务器的平均负载```

>有时间我们会觉得系统很慢, 但是又找不到原因，这时就要查看系统的平均负载了，看它是否有大量的进程在排队等待。特定时间间隔内运行队列中的平均进程数可以反映系统的繁忙程度，所以我们通常会在自己的网站变慢时第一时间查看系统负载，即CPU的平均负载。

1.**如何查看**

```sh
~ # uptime                                                                
 20:52:10 up 153 days, 23:43,  5 users,  load average: 0.00, 0.00, 0.00
```

它表示的是过去的1分钟，5分钟和15分钟内进程队列中的平均进程数量。

>需要注意的是load average的输出值，这三个值的大小一般不能大于系统逻辑CPU的个数。例如，系统中有4个逻辑CPU时，如果这三个值长期大于4，说明CPU很繁忙，负载很高，可能会影响系统的性能。但是偶尔大于4时，倒不用担心，一般不会影响系统性能。


2.**用vmstat监控Linux系统的整体性能**

```sh
~ # vmstat 1 4                                                                                                                                 root@Jaylee
procs -----------memory---------- ---swap-- -----io---- --system-- -----cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 0  0  83424  69568 141976 202468    0    0    44     9    3    1  0  0 97  2  0
 0  0  83424  69576 141976 202488    0    0     0    80  189  275  1  0 99  0  0
 0  0  83424  69608 141976 202488    0    0     0     0  145  255  0  0 100  0  0
 0  0  83424  69616 141976 202488    0    0     0     0  150  261  1  1 98  0  0
------------------------------------------------------------
```


##### 参数说明

- procs
    + r: 等待运行的进程数
    + b: 处在非中断睡眠状态的进程数
- memory
    + swpd: 虚拟内存的使用情况
    + free: 空闲的内存（单位：KB）
    + buff: 用作缓存的内存数（单位：KB）
- swap
    + si: 从磁盘交换到内存的交换页数量（单位：KB/秒）
    + so: 从内存交换到磁盘的交换页数量（单位：KB/秒）
- io
    + bi: 发送到块设备的块数（单位：块/秒）
    + bo: 从块设备接收到的块数（单位：块/秒）
- system
    + in: 每秒的中断数，包括时钟中斷
    + cs: 每秒的环境（上下文）切换次数
- cpu
    + us: CPU使用时间
    + sy: CPU系统使用时间
    + id：闲置时间

>标准情况下r和b的值应该为：r<5, b=0

>如果us+sy<70，表示系统性能较好，如果us+sy>=85，表示系统性能比较糟糕。


----


### ```查看Linux服务器的其它参数```

1.**系统内核**

```sh
~ # uname -a
Linux Jaylee 2.6.32-358.6.2.el6.x86_64 #1 SMP Thu May 16 20:59:36 UTC 2013 x86_64 x86_64 x86_64 GNU/Linux
```

2.**系统是32位还是64位**

```sh
~ # file /sbin/init
/sbin/init: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked (uses shared libs), for GNU/Linux 2.6.18, stripped
```

> 还可以查看是否有/lib64目录，有则系统为64位，无则表示系统为32位。

3.**查看服务器发行版的相关信息**

```sh
~ # lsb_release -a
LSB Version:    :base-4.0-amd64:base-4.0-noarch:core-4.0-amd64:core-4.0-noarch:graphics-4.0-amd64:graphics-4.0-noarch:printing-4.0-amd64:printing-4.0-noarch
Distributor ID: CentOS
Description:    CentOS release 6.3 (Final)
Release:    6.3
Codename:   Final
```

> 如无此命令，需要通过```yum install redhat-lsb```来安装

4.**查看系统已经载入的相关模块**

```sh
~ # lsmod
Module                  Size  Used by
tcp_diag                1041  0
inet_diag               8735  1 tcp_diag
ipt_REJECT              2351  0
iptable_filter          2793  1
ip_tables              17831  1 iptable_filter
ipv6                  321454  42
xenfs                   5705  1
dm_mod                 82839  0
xen_netfront           18905  0
i2c_piix4              12608  0
i2c_core               31084  1 i2c_piix4
ext4                  363408  1
mbcache                 8193  1 ext4
jbd2                   90230  1 ext4
xen_blkfront           15495  2
pata_acpi               3701  0
ata_generic             3837  0
ata_piix               24121  0
```

> Linux的核心具有模块化的特性，因此在编译核心时，无须把全部的功能都放入核心，可以将这些功能编译成一个个单独的模块，需要时分别载入。比如说安装LVS+Keepalived时，经常会用lsmod来查看lvs模块是否已经载入，```lsmod | grep ip_vs```

5.**查找PCI设置**

```sh
~ # lspci
00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)
00:01.0 ISA bridge: Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]
00:01.1 IDE interface: Intel Corporation 82371SB PIIX3 IDE [Natoma/Triton II]
00:01.2 USB controller: Intel Corporation 82371SB PIIX3 USB [Natoma/Triton II] (rev 01)
00:01.3 Bridge: Intel Corporation 82371AB/EB/MB PIIX4 ACPI (rev 01)
00:02.0 VGA compatible controller: Cirrus Logic GD 5446
00:03.0 Unassigned class [ff80]: XenSource, Inc. Xen Platform Device (rev 01)
```

> 此命令可以列出机器中的PCI设备信息，比如声卡，显卡，网卡等信息，lspci读取的是hwdata数据库。
> 可能需要使用```yum install pciutils```来安装此命令。
