---
layout: post
title: "Linux故障诊断与排除"
date: 2016-04-09 22:49:05 +0800
comments: true
categories: Linux
---


### ```以普通身份编辑无权限的文件```

>如果用vim编辑一些配置文件的时候，保存的时候会提示“没有Root Permission”

```sh
:w ! sudo tee %
```

>这条命令的含义就是把当前编辑的文件内容当作标准输入，并输入到命令```sudo tee %```里去，也就是将保存到当前文件名。

-----

### ```配置文件最大打开数的方法```

```sh
~ # ulimit -a
-t: cpu time (seconds)         unlimited
-f: file size (blocks)         unlimited
-d: data seg size (kbytes)     unlimited
-s: stack size (kbytes)        10240
-c: core file size (blocks)    0
-m: resident set size (kbytes) unlimited
-u: processes                  1024
-n: file descriptors           65535
-l: locked-in-memory size (kb) 64
-v: address space (kb)         unlimited
-x: file locks                 unlimited
-i: pending signals            7827
-q: bytes in POSIX msg queues  819200
-e: max nice                   0
-r: max rt priority            0
```

>其中(-n) file descriptors 65535是Linux对一个进程打开的文件句柄数量的限制（也包括打开的）socket数量，可影响mysql的并发连接数目。这个值可以用ulimit命令来修改，但ulimit命令修改的数值只对当前登入的用户目前使用的环境有效，系统重启或用户退出就会失效。

>系统的总限制在这里：```/proc/sys/fs/file-max```，可以通过查看cat查看其目前的值，通过```/etc/sysctl.conf```修改此值，不过此方式不会改变用户的```ulimits -a```，比较好的方法是在```/etc/rc.local```文件添加```ulimit -SHn 65535```

>可以通过```/proc/sys/fs/file-nr```查看整个系统目前使用的文件句柄数量。

>可以通过```/proc/PID/limits | grep "Max open files"```来查看进程打开文件的最大数。

>查找文件句柄问题的时候，还可以通过```lsof```看到某个进程打开了哪些句柄，也可以查看某个文件/目录被什么进程所占用。

##### 查找谁在使用这些文件

```sh
~ # lsof /root
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME
mycli     436 root  cwd    DIR  202,1     4096 286721 /root
zsh      1078 root  cwd    DIR  202,1     4096 286721 /root
zsh      8249 root  cwd    DIR  202,1     4096 286721 /root
vim     18338 root  cwd    DIR  202,1     4096 286721 /root
lsof    18444 root  cwd    DIR  202,1     4096 286721 /root
lsof    18445 root  cwd    DIR  202,1     4096 286721 /root
zsh     28092 root  cwd    DIR  202,1     4096 286721 /root
tmux    31031 root  cwd    DIR  202,1     4096 286721 /root
zsh     32766 root  cwd    DIR  202,1     4096 286721 /root
```


##### 查找root用户进程所打开的文件类型为txt的文件

```sh
~ # lsof -a -u root -d txt
COMMAND     PID USER  FD      TYPE DEVICE SIZE/OFF    NODE NAME
init          1 root txt       REG  202,1   150352 1302556 /sbin/init
zsh        1078 root txt       REG  202,1   676304  723396 /bin/zsh
rsyslogd   1239 root txt       REG  202,1   391968 1302646 /sbin/rsyslogd
mysqld_sa  1412 root txt       REG  202,1   903528  721409 /bin/bash
mingetty   1672 root txt       REG  202,1    15256 1302598 /sbin/mingetty
sshd       6390 root txt       REG  202,1   571224  673436 /usr/sbin/sshd
zsh        6392 root txt       REG  202,1   676304  723396 /bin/zsh
sshd       8247 root txt       REG  202,1   571224  673436 /usr/sbin/sshd
zsh        8249 root txt       REG  202,1   676304  723396 /bin/zsh
flush-202  9428 root txt   unknown                         /proc/9428/exe
nginx     10562 root txt       REG  202,1 12424740  764132 /usr/local/nginx/sbin/nginx
```


###### 查看80端口的运行情况

```sh
~ # lsof -i :80
COMMAND     PID   USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
nginx      8324 nobody   14u  IPv4 1815293      0t0  TCP *:http (LISTEN)
nginx     10562   root   14u  IPv4 1815293      0t0  TCP *:http (LISTEN)
AliYunDun 23599   root   27u  IPv4 4477796      0t0  TCP 115.28.147.133:10997->110.75.102.62:http (ESTABLISHED)
```

#### 常用参数说明

- lsof filename 显示打开指定文件的所有进程
- lsof -a 表示两个参数都必须满足时才显示结果
- lsof -c string 显示COMMAND列中包含指定字符串的进程所打开的文件
- lsof -u username 显示所属user进程打开的文件
- lsof -g gid 显示所属gid的进程情况
- lsof +d /DIR/ 显示DIR目录下被进程打开的文件
- lsof +D /DIR/ 同上，但包含子目录
- lsof -d FD 显示指定文件描述符的进程
- lsof -n 将IP显示为hostname
- lsof -i 用以显示符合条件的进程情况
- lsof -i[46] [protocol] [@hostname] [hostaddr] [:service|port]
    + 46 => IPv4 or IPv6
    + protocol => TCP or UDP
    + hostname => internet host name
    + hostaddr => IPv4地址
    + service => /etc/services 中的service name
    + port => 端口号


----

### ```在crontab下正确防止脚本运行冲突```

如果某脚本要运行30分钟，可以在crontab里把叫脚本间隔设置至少一个小时来避免冲突，而比较糟糕的情况就是可能该脚本在执行周期内没有完成，接着第二个脚本又开始运行了。如果确保只有一个脚本实例运行呢？ 一个好的方法就是利用lockf（FreeBSD下为lockf， CentOS 5.5 下为flock）, 在脚本执行前先检测能否获取某个文件锁，以防止脚本冲突。

flock的参数如下：

- -s: 获得一个共享锁
- -x: 获得一个独占锁
- -u: 移除一个锁，通常不需要，脚本执行完全会自动丢弃锁
- -n: 如果没有立即获得锁，直接失败而不是等待
- -w: 如果没有立即获得锁，等待指定时间
- -o: 在运行命令前关闭文件的描述符号。用于如果命令产生子进程时会不受锁的管控
- -c: 在shell中运行一个单独的命令

```sh
*/10 * * * * flock -xn /tmp/test.lock -c "/usr/local/php/bin/php test.php 2>&1 >> php.log"
```

>若一个实例在10分钟没有运行完，第2个实例则不会运行。
