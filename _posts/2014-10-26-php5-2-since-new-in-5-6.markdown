---
layout: post
title: "PHP5.2自5.6新特性"
date: 2014-10-26 18:00:28 +0800
comments: true
categories: 
---

截至目前( 2014.10 )，PHP的最新稳定版本是PHP5.6，但有差不多一半的用户仍然在使用已经不在维护的PHP5.2，其余的一半用户在使用PHP5.3 ( PHP5.3也于2014年9月停止支持 )。因为PHP那 “ 集百家之长 ”的蛋疼语法，加上社区氛围不太好，许多人对新版本，新特性并无兴趣。

----

**本文会介绍自PHP5.2起，直到PHP5.6中增加的新特性。**

- PHP5.2以前：autoload, PDO和MySQLi, 类型约束
- PHP5.2：JSON的支持
- PHP5.3：弃用的功能，匿名函数，新增魔术方法，命名空间，延迟静态绑定，Heredoc和Nowdoc，const，三元运算符，Phar
- PHP5.4：Short Open Tag，数组简写形式，Traits，内置web服务器，细节修改
- PHP5.5：yield，list()可用于foreach循环，细节修改
- PHP5.6：常量增强，可变函数参数，命名空间增强

----

>PHP5.2以前

>2006年前（顺便介绍一下PHP5.2已经出现但是值得介绍的特性）

**autoload**

大家应该都知道__autoload()函数，如果定义了该函数，那么当在代码中使用了一个未定义的类的时候，该函数就会被调用，你可以在该函数中加载相应的类实现文件，如：

```php

<?php
    
    function __autoload($className){
        require_once $className.".class.php";
    }
    
    $foo = new Foo();

?>
```

这样，在执行new操作的时候，会在当前目录下寻找Foo.class.php这个文件，并加载进来。

但该函数已经不建议使用，原因是一个项目中仅能有一个这样的__autoload()函数，因为PHP不允许函数重名。但当你用到一些类库的时候，难免会出现多个autoload函数的需要，于是spl_autoload_register()取而代之：

```php

<?php    

    function autoloadModel($className){
        $filename = "models/".$className.".php";
        if ( file_exists($filename) ){
            require_once $filename;
        }
    }

    function autoloadController($className){
        $filename = "controller/".$className.".php";
        if ( file_exists($filename) ){
            require_once $filename;
        }
    }
    
    spl_autoload_register("autoloadModel");
    spl_autoload_register("autoloadController");

?>

```

spl_autoload_register()会将一个函数注册到autoload函数列表中，当出现未定义的类的时候，SPL会按照注册的顺序逐个调用被注册的autoload函数，这意味着你可以使用spl_autoload_register注册多个autoload函数。

**PDO和MySQLi**

PDO即PHP Data Object , PHP数据对象，这是PHP的新式数据库访问接口。

按照传统的风格，访问MySQL数据库应该是这个样子：

```php
<?php
    
    $conn = mysql_connect("localhost","user","passwd") or die("Connection failed");

    mysql_select_db("test");

    $type = $_POST["type"];

    $sql = "select * from `table` where `type` = {$type}";

    $result = mysql_query($sql, $conn);

    while($row = mysql_fetch_assoc($result)){
        var_dump($row);
    }

    mysql_free_result($result);

    mysql_close($conn);

?>
```

为了能让代码实现与数据库无关，即同一段代码适用于多种数据库（例如以上代码仅适用于MySQL），PHP官方设计了PDO.

除此之外，PDO还提供了更多的功能，比如：

- 面对对象风格接口
- SQL预编译，占位符语法
- 更高的执行效率，作为官方推荐，有特别的性能优化
- 支持大部分SQL数据库，更换数据库无需改动代码

上面的代码用PDO实现将会是这个样子：

```php

<?php
    
    try {

        $dsn = "mysql:host=localhost;dbname=test";

        $conn = new PDO($dsn, "user", "passwd");

        $sql = "select * from user where type = :type ";

        $stmt = $conn->prepare($sql);

        $stmt->bindParams("type",$_POST["type"]);

        $stmt->execute();

        $stmt->fetchAll(PDO::FETCH_ASSOC);

    }catch(PDOException $e){

        echo $e->getMessage();
    }

?>

```

PDO是官方推荐的，更为通用的数据库访问方式，如果你没有特殊的需求，那么最好学习和使用POD，但如果你需要使用MySQL所特有的高级功能，那么你可能需要尝试一下MySQLi，因为PDO为了能够同时在多种数据库上使用，不会包含那些MySQL独有的功能。

**类型约束**

通过类型约束可以限制参数的类型，不过这一机制并不完善，仅适用于对象，接口，callable，以及array，不适用于string和int，如果参数类型不匹配，则会产生一个fatal error.

```php

<?php
    
    function test(callable $callable, array $arr, MyClass $myclass){
        //...
    }

?>

```


----

>PHP5.2

>2006年 ~ 2011年

**JSON支持**

包括json_encode(), json_decode()等函数，JSON算是在web领域非常实用的数据交换格式，可以被JS直接支持，JSON实际上JS语法的一部分。

JSON系列函数，可以将PHP中的数组结构与JSON字符串进行转换。

```php

<?php
    
    $arr = array(
        "key"   =>  "value",
        "array" =>  array(1,2,3,4)
    );

    $json = json_encode($arr);

    echo $json;

    $object = json_decode($json);   

    print_r($object);
?>

```

输出：

```php
    
    {"key":"value","array":[1,2,3,4]}

    stdClass Object
    (
        [key] => value
        [array] => Array
            (
                [0] => 1
                [1] => 2
                [2] => 3
                [3] => 4
            )
    )

```

值得注意的是，json_decode()默认会返回一个对象而非数组，如果需要返回数组需要将第二个参数设为true。同时json_encode()在php5.4的时候增加了一个**JSON\_UNESCAPED\_UNICODE**的常量，这样，如果键值对中包含中文就不会被编码成unicode字符了。

----

>PHP5.3

>2009年 ~ 2012年 PHP5.3算是一个非常大的更新 ，新增了大量的新特性，同时也做了一些不向下兼容的修改。

**弃用的功能**

以下几个功能被弃用，若在配置文件中启用，则PHP在运行时会发出警告。

- Register Globals

这是php.ini中的一个选项(register_globals)，开启后会将所有表单变量($\_GET 和 $\_POST）注册为全局变量。

看下面的例子：

```php

<?php
    
    if ( isAuth() ){
        $autherize = true;
    }

    if ($autherize){
        include("page.php");
    }

?>

```

这段代码在通过验证时，将$autherize设为true，然后根据$autherize的值来决定是否显示页面。

但由于没有事先把$authorize初始化为false，当register_globals打开时，可能访问/auth.php?authorize=1来定义该变量值，绕过身份验证。

该特征属于历史遗留原因，在PHP4.2中默认被关闭，在PHP5.4中被移除。


- Magic Quotes

对应php.ini中的选项 magic_quotes_gpc，这个特征同样属于历史遗留原因，已经在PHP5.4移除。

该特征会对所有用户输入的 ‘ (单引号)，“ (双引号)，\\(反斜线) 进行转义，和addslashes()作用完全一样，这看上去不错，但是PHP并不知道哪些输入会进SQL，哪些输入会进Shell，哪些输入会被显示为HTML，所以很多时候这种转义会引起混乱。

PHP一共有三个魔术引号指令：

magic\_quotes\_gpc：影响HTTP请求数据(GET, POST和COOKIE)，不能在运行时改变，在PHP中默认值为On。( 相关函数：get\_magic\_quotes\_gpc() )

magic\_quotes\_runtime：如果打开的话，大部分从外部来源取得数据并返回的函数，包括从数据库和文件，所返回的数据都会被转义。该选项可在运行时改变，在PHP中默认值为Off。( 相关函数：get\_magic\_quotes\_runtime()，set\_magic\_quotes\_runtime() )

magic\_quotes\_sybase：如果打开的话，将会使用单引号对单引号进行转义而不是反斜线。此选项会完全覆盖magic\_quote\_gpc。( 获取该选项的值通过ini\_get()函数 )


- Safe Model

很多虚拟主机提供商使用Safe Mode 来隔离多个用户，但Safe Model存在诸多问题，例如有些扩展并不按照Safe Mode来进行控制。

PHP官方推荐使用操作系统的机制来进行权限隔离，让Web服务器以不同的用户权限来运行PHP解释器。

**匿名函数**

匿名函数也叫闭包(Closures)，经常被用来临时性的创建一个无名函数，用于回调函数等用途。

```php

<?php
    
    $func = function(){
        var_dump(func_get_args());
    }

    $func("Hello","world");
?>

```

以上代码定义了一个匿名函数，并赋值给了func。

可以看到定义匿名函数依然使用function关键字，只不过省略了函数名，直接是参数列表。

然后我们又调用了$func所储存的匿名函数。

匿名函数还可以通过use关键字来捕捉外部变量。

```php

<?php
    
    function ArrayPlus($array, $num){

        array_walk($array, function(&$v) use($num){
            $v *= $num;
        });

        return $array;
    }

    var_dump(ArrayPlus([1,2,3,4,5], 6));
?>

```

上面的代码定义了一个ArrayPlus()函数（这不是匿名函数），它会将一个数组（$array）中的每一项，加上一个指定的数字（$num）。

在ArrayPlus()的实现中，我们使用了array_walk()函数，它会为一个数组的每一项执行一个回调函数，即我们定义的匿名函数。

在匿名函数的参数列表后，我们用use关键字将匿名函数外的$num捕捉到了函数内部，以便我们知道该加多少。

**魔术方法: \_\_invoke(), \_\_callStatic()**

PHP的面向对象体系中，提供了若干“魔术方法”，用于实现类似其它语言中的“重载”，如访问不存在的方法、属性时触发某个魔术方法。

随着匿名函数的加入，PHP引入了一个新的魔术方法\_\_invoke()。

```php

<?php

    class A {
 
        public function __invoke($str){
            echo "A::__invoke:{$str}";
        }
    }
 
    $a = new A();

    $a("jaylee.cc");    //A::__invoke:jaylee.cc
?>

```


\_\_callStatic()则会在调用一个不存在的静态方法时被调用。

```php
    
    <?php
        
    class A {

        public function __callStatic($methodName, $args){
            var_dump($methodName, $args);
        }
    }

    A::test("aa","bb");

?>
```


**命名空间**

```php

<?php
    
    // 命名空间的分隔符是反斜杠，该声明语句必须在文件第一行。
    // 命名空间中可以包含任意代码，但只有类，函数，常量受命名空间的影响
    
    namespace Jaylee\Test;

    // 该类的完整限定名是\Jaylee\Test\A，其中第一个反斜杠表示全局命名空间
    class A {
        public function test(){
            echo "namespace:".__NAMESPACE__.", ".__CLASS__."<br />";
        }
    }

    // 你还可以在命名空间中定义第二个命名空间，接下来的代码都位于\Other\Test2
    namespace Other\Test2;

    // 实例化来自其它命名空间中的对象
    $a = new \Jaylee\Test\A;

    class B {
        public function test(){
            echo "namespace:".__NAMESPACE__.", ".__CLASS__."<br />";        
        }
    }

    namespace Other;

    // 实例化来自子命名空间的对象        
    $b = new Test2\B;
 
    $b->test();

    // 导入来自其它命名空间的名称，并重命名
    // 注意只能导入类，不能用于函数和常量
    use \Jaylee\Test\A as ClassA;

    $a = new ClassA();

    $a->test();    
?>

```


更多有关命名空间的语法介绍请参见[官网](http://php.net/manual/zh/language.namespaces.rationale.php)。

命名空间经常和autoload一起使用，用于自动加载类文件：

```php

<?php
    
    spl_autoload_register(
        function($className){
            spl_autoload(str_replace("\\", "/", $className));
        }
    );
?>

```

当你实例化一个类\Jaylee\Test\TestA的时候，这个类的完整限定名称会被传递给autoload函数，autoload函数将类名中的命名空间分隔符替换为反斜杠，并包含对应文件。

这样可以实现类定义文件分组存储，按需自动加载。












