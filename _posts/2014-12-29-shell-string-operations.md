---
layout: post
title: "shell字符串操作小结"
date: 2014-12-29 00:32:41 +0800
comments: true
categories: PHP
---

>对字符串的操作是一门变成语言中必备的功能，也是最常用的功能。
>经常看到一些脚本中，处理一些简单的字符串如字符串的长度等功能，也要运用管道/CUT/AWK/SED等相对重量级的工具去处理。
>其实大可不必这样，因为BASH中本身就支持相当多的字符串常用的操作，但是不幸的是，这些工具缺乏统一的标准，
>一些是参数替换的子集，另一些则受到UNIX EXPR命令的影响，
>这就导致了命令语法不一致，还会引起一些冗余功能，但这并没有引起混乱。

----

### 字符串长度

#### 基本语法：

- ```${#string}```      使用bash获取字符串长度
- ```echo -n $string | wc -m```     使用wc命令
- ```expr length $string```     使用强大的expr命令

```bash

#!/bin/bash

string='jaylee'

#1.使用bash自带的方法

echo ${#string} 		            #输出:5

#2.使用wc命令 关于参数-m不知道的可以自已man一下

echo -n $string | wc -m 	        #输出：5 这里使用-n是为了去除字符串后的换行符

#3.使用expr命令

echo $(expr length $string) 	    #输出：5

```


### 截取子字符串

#### 基本语法：

- ```${string:position}```  在$string中从位置$position开始提取子字符串，如果$string是```"*"```或者```"@"```，那么将会从$position位置开始提取参数。

- ```${string:position:length}```    在$string中从位置$position开始提取$length长度的子串。

- ```expr substr $string $position $length```   使用```expr```命令在$string中从$position开始提取$length长度的子串。此命令中的$length参数不可以省略，$position从1开始。

- ```expr match  "$string" '\($substring\)' ```     使用正则表达式从$string的```开始```位置开始提取$substring，$substring是正则表达式。

- ```expr match "$string" '.*\($substring\)'```     使用正则表达式从$string的```结尾```位置开始提取子串。

```sh
#!/bin/bash

#截取子字符串

string="abcdefghijk";

echo ${string:1}		 # bcdefghijk

echo ${string:2:5}		 # cdefg

#位置参数
set -- aa bb cc dd
echo ${@:1:2}			# aa bb
echo ${*:1:2}			# aa bb

#expr命令
echo $(expr substr $string 2 4)   #bcde

```

```sh
#!/bin/bash

#使用正则表达式截取子字符串

string=abcABC123ABCabc

#从开头匹配
echo `expr match "$string" '\(.[b-c]*[A-Z]..[0-9]\)' `	#abcABC1
echo `expr "$string" : '\(.[b-c]*[A-Z]..[0-9]\)' `	    #abcABC1
echo `expr "$string" : '\(.......\)' `			        #abcABC1

#从结尾匹配
echo `expr match "$string" '.*\([A-C][A-C][A-C][a-c]*\)' `		#ABCabc
echo `expr "$string" :  '.*\([A-C][A-C][A-C][a-c]*\)' `			#ABCabc
echo `expr "$string" :  '.*\(......\)' `				        #ABCabc


#查看文件后缀名是否符合标准

filename=test.php

echo $(expr "$string":'.*\(.php\)$');

```

