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

**```autoload```**

大家应该都知道\_\_autoload()函数，如果定义了该函数，那么当在代码中使用了一个未定义的类的时候，该函数就会被调用，你可以在该函数中加载相应的类实现文件，如：

```php

<?php
    
    function __autoload($className){
        require_once $className.".class.php";
    }
    
    $foo = new Foo();

?>
```

这样，在执行new操作的时候，会在当前目录下寻找Foo.class.php这个文件，并加载进来。

但该函数已经不建议使用，原因是一个项目中仅能有一个这样的\_\_autoload()函数，因为PHP不允许函数重名。但当你用到一些类库的时候，难免会出现多个autoload函数的需要，于是spl\_autoload\_register()取而代之：

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

spl\_autoload\_register()会将一个函数注册到autoload函数列表中，当出现未定义的类的时候，SPL会按照注册的顺序逐个调用被注册的autoload函数，这意味着你可以使用spl\_autoload\_register注册多个autoload函数。

**``` PDO和MySQLi ```**

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

**```类型约束```**

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

**```JSON支持```**

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

```text
    
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

值得注意的是，json\_decode()默认会返回一个对象而非数组，如果需要返回数组需要将第二个参数设为true。同时json\_encode()在php5.4的时候增加了一个**JSON\_UNESCAPED\_UNICODE**的常量，这样，如果键值对中包含中文就不会被编码成unicode字符了。

----

>PHP5.3

>2009年 ~ 2012年 PHP5.3算是一个非常大的更新 ，新增了大量的新特性，同时也做了一些不向下兼容的修改。

**```弃用的功能```**

以下几个功能被弃用，若在配置文件中启用，则PHP在运行时会发出警告。

- ```Register Globals```

这是php.ini中的一个选项(register\_globals)，开启后会将所有表单变量($\_GET 和 $\_POST）注册为全局变量。

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


- ```Magic Quotes```

对应php.ini中的选项 magic_quotes_gpc，这个特征同样属于历史遗留原因，已经在PHP5.4移除。

该特征会对所有用户输入的 ‘ (单引号)，“ (双引号)，\\(反斜线) 进行转义，和addslashes()作用完全一样，这看上去不错，但是PHP并不知道哪些输入会进SQL，哪些输入会进Shell，哪些输入会被显示为HTML，所以很多时候这种转义会引起混乱。

PHP一共有三个魔术引号指令：

magic\_quotes\_gpc：影响HTTP请求数据(GET, POST和COOKIE)，不能在运行时改变，在PHP中默认值为On。( 相关函数：get\_magic\_quotes\_gpc() )

magic\_quotes\_runtime：如果打开的话，大部分从外部来源取得数据并返回的函数，包括从数据库和文件，所返回的数据都会被转义。该选项可在运行时改变，在PHP中默认值为Off。( 相关函数：get\_magic\_quotes\_runtime()，set\_magic\_quotes\_runtime() )

magic\_quotes\_sybase：如果打开的话，将会使用单引号对单引号进行转义而不是反斜线。此选项会完全覆盖magic\_quote\_gpc。( 获取该选项的值通过ini\_get()函数 )


- ```Safe Model```

很多虚拟主机提供商使用Safe Mode 来隔离多个用户，但Safe Model存在诸多问题，例如有些扩展并不按照Safe Mode来进行控制。

PHP官方推荐使用操作系统的机制来进行权限隔离，让Web服务器以不同的用户权限来运行PHP解释器。

**```匿名函数```**

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

**```魔术方法: __invoke(), __callStatic()```**

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


**```命名空间```**

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

**```延迟静态绑定```**

PHP的的 OPP 机制，具有继承和类似虚函数的功能，例如如下的代码：

```php

<?php
    
    class A {

        public function callFoo(){
            echo $this->foo();
        }

        public function foo(){
            return "A::foo()";
        }
    }

    class B extends A {

        public function foo(){
            return "B::foo()";
        }
    }

    $b = new B();

    $b->callFoo();      //B::foo();
?>

```

可以看到，当在A中使用了```$this->foo()```时，体现了“虚函数”的机制，实际调用的是B::foo()，然后如果将所有的函数都改为静态函数时：

```php

<?php

    class A {

        static public function callFoo(){
            echo self::foo();
        }

        static public function foo(){
            return "A::foo()";
        }
    }

    class B extends A {

        static public function foo(){
            return "B::foo()";
        }
    }

    B::callFoo();   //A::foo()
?>

```

这时，输出的会是```A::foo()```，这是因为self的语义本来就是“当前类”，所有在PHP5.3给static关键赋予了一个新的功能：延迟静态绑定：

```php

<?php

    class A {

        static public function callFoo(){
            echo static::foo();
        }

        //...
    }

?>

```

将self改为static之后，就会像预期一样输出```B::foo```了。


**```Heredoc 和 Nowdoc```**

PHP5.3对Heredoc以及Nowdoc进行了一些改进，它们都用于在PHP中嵌入大段的代码。

Heredoc的行为类似于一个双引号字符串：

```php

<?php

$name = "Jaylee";

echo <<<TEXT

my name is "{$name}"

TEXT;

?>

```

Heredoc以三个尖括号开始，后面跟一个标识符（TEXT）,直到一个同样的定格标识符（不能缩进）结束。
就像双引号字符串一样，其中可以嵌入变量。

Heredoc还可以用于函数参数，以及类成员初始化：

```php

<?php

var_dump(<<<EOD
    hello world
EOD
);


class A {

    const name = <<<EOD
hello world
EOD;

    public $foo = <<<EOD
hello world2
EOD;

}

?>

```


Nowdoc的行为像一个单引号字符串，不能在其中嵌入变量，和Heredoc唯一的区别就是，三个尖括号的标识符要用单引号引起来：

```php

<?php

    $name = "Jaylee";

    echo <<<'EOD'

my name is "{$name}"

EOD;

    //输出：my name is "{$name}"

?>

```


**```用const定义常量```**


php5.3起同时支持在全局命名空间和类中使用 const 定义常量。

旧式风格：

```php

<?php

    define("NAME","jaylee");

?>

```

新式风格：

```php

<?php

    const NAME = "Jaylee";

?>

```

const形式仅适用于常量，不适用于运行时才能求值的表达式。

```php

<?php

    const VALUE = 1234; //正确

    const VALUE = 1000*2; //错误
?>

```

**```三元运算符的简写形式```**

旧式风格：

```php

<?php

    echo $a ? $a : "No VALUE";

?>

```

可以简写成：

```php

<?php

    echo $a ? : "No Value";

?>

```

即如果省略三元运算符的第二个部分，会默认用第一个部分代替。


**```Phar```**

Phar即PHP Archive, 起初只是Pear中的一个库而已，后来在PHP5.3被重新编写成C扩展并内置到 PHP 中。
Phar用来将多个 .php 脚本打包(也可以打包其他文件)成一个 .phar 的压缩文件(通常是ZIP格式)。
目的在于模仿 Java 的 .jar, 不对，目的是为了让发布PHP应用程序更加方便。同时Phar还提供了数字签名验证等功能。


.phar 文件可以像 .php 文件一样被 PHP 引擎解释执行，同时你还可以写出这样的代码来包含 .phar 中的代码。

```php

<?php

    require "xxx.phar";
    require "phar://xxx.phar/aa/bb.php";
    
?>

```

更多信息请参见[官网](http://www.php.net/manual/zh/phar.using.intro.php);


----

>PHP5.4

>2012 ~ 2013


**```Short Open Tag```**

Short Open Tag 自PHP5.4起总是可用。

在这里集中讲一下有关 PHP 起止标签的问题。即：

```php

<?php

    //code
    
?>

```

通常就是上面的形式，除此之外还有一种简写形式：

```php

<? /*  code  */ ?>

```

还可以把

```php

<? echo $foo;?>

```

简写成：

```php

<?=$foo?>

```

这种简写形式被称为 Short Open Tag, 在 PHP5.3 起被默认开启，在 PHP5.4 起总是可用。
使用这种简写形式在 HTML 中嵌入 PHP 变量将会非常方便。


对于纯 PHP 文件(如类实现文件), PHP 官方建议顶格写起始标记，同时 ```省略``` 结束标记。
这样可以确保整个 PHP 文件都是 PHP 代码，没有任何输出，否则当你包含该文件后，设置 Header 和 Cookie 时会遇到一些麻烦（Header 和 Cookie 必须在输出任何内容之前被发送）。


**```数组简写形式```**


这是非常方便的一项特征！

```php

<?php
    
    //原来数组的写法
    $arr = array("key" => "value", "key2" => "value2");
    
    //简写形式
    $arr = ["key" => "value", "key2" => "value2"];

?>


```


**```Traits```**

所谓Traits就是“构件”，是用来替代继承的一种机制。PHP中无法进行多重继承，但一个类可以包含多个Traits.

详细内部请看[这里](/php-trait-details/)还有[这里](/php-using-the-trait-implements-the-singleton-pattern/)


**```内置 Web 服务器```**

PHP从5.4开始内置一个轻量级的Web服务器，不支持并发，定位是用于开发和调试环境。

在开发环境使用它的确非常方便。

```bash

php -S localhost:8000

```

这样就在当前目录建立起了一个Web服务器，你可以通过 http://localhost:8000/ 来访问。

其中localhost是监听的ip，8000是监听的端口，可以自行修改。

很多应用中，都会进行URL重写，所以PHP提供了一个设置路由脚本的功能:


```bash

php -S localhost:8000 index.php

```

这样一来，所有的请求都会由index.php来处理。


**```细节修改```**


**PHP5.4 新增了动态访问静态方法的方式：**

```php
    
<?php
    
    $func = "Foo";
    
    A::{$func}();   // 相当于 A::Foo();
    
?>

```

**新增在实例化时访问类成员的特征：**

```php
    
<?php
    
    (new MyClass())->foo();
        
?>

```

**新增支持对函数返回数组的成员访问解析(这种写法在之前版本是会报错的)：**


```php
    
<?php
    
    var_dump( func()[0] );      //如果func返回一个数据，这里直接取第0项元素
        
?>

```

----

>PHP5.5

>2013起

**```yield关键字```**

yield关键字用于当函数需要返回一个迭代器的时候，逐个返回值。

该函数返回一个迭代器对象。


**``` list()用于foreach ```**

该特性可以在foreach中解析嵌套的数组：

```php

<?php

    $arr = [
        [1,2,3],
        ["a","b","c"]
    ];

    foreach ($arr as list($a, $b, $c)){
        echo $a."==".$b."==".$c.PHP_EOL;
    }

?>

```

结果：

```text

    1==2==3
    a==b==c

```

**```其它细节修改```**

- 不推荐使用 mysql 函数，推荐使用 PDO 或 MySQLi, 参见前文。

- 不再支持Windows XP.

- 可用 MyClass::class 取到一个类的完整限定名(包括命名空间)。

- empty() 支持表达式作为参数。

- try-catch 结构新增 finally 块。


----

>PHP5.6

>2014年8月

**```常量表达式```**

在常量、属性声明和函数参数默认值声明时，以前版本只允许常量值，PHP5.6开始允许使用包含数字、字符串字面值和常量的标量表达式。

```php

<?php

    const ONE = 1;
    const TWO = ONE * 2;

    class C {

        const THREE = TWO + 1;

        const ONE_THIRD = ONE / self::THREE;

        const SENTENCE = 'The value of '.self::THREE.' is 3';

        public function f ($a = ONE + self::THREE) {
            return $a;
        }
    }

    echo (new C)->f();  // 4

    echo C::SENTENCE;   //The value of 3 is 3

?>

```


**```可变参数函数```**

可变函数的实现，不再依赖```func_get_args()```函数，现在可以通过新增的操作符```...```更简洁地实现。

```php

<?php

    function foo($req, $opt = null, ...$params){

        printf("\$req: %d; \$opt: %d; number of params: %d\n",
                $req, $opt, count($params));
    }

    foo(1);
    foo(1,2);
    foo(1, 2, 3);
    foo(1, 2, 3, 4);
    foo(1, 2, 3, 4, 5);

?>

```

以上输出：

```php

    $req: 1; $opt: 0; number of params: 0
    $req: 1; $opt: 2; number of params: 0
    $req: 1; $opt: 2; number of params: 1
    $req: 1; $opt: 2; number of params: 2
    $req: 1; $opt: 2; number of params: 3

```

**```参数解包功能```**

在调用函数时，通过```...```操作符可以把数组或者可遍历对象解包到参数列表，这和Ruby等语言中的扩张(splat)操作符类似。

```php

<?php

    function add($a, $b, $c){
        return $a + $b + $c;
    }

    $operators = [1, 2, 3];

    echo add(...$operators);    //6
?>

```

**```导入函数和常量```**

use 操作符开始支持函数和常量的导入。 ```use function``` 和 ```use const``` 结构的用法的示例：

```php

<?php

    namespace cc\jaylee {

        const FOO = 11;

        function f(){
            echo __FUNCTION__;
        }
    }

    namespace {

        use const cc\jaylee\FOO;
        use function cc\jaylee\f;

        echo FOO;   \\ 11

        f();        \\ cc\jaylee\f
    }

?>

```


**```phpdbg```**

PHP自带了一个交互式调试器phpdbg，它是一个SAPI模块，更多信息参考[ phpdbg 文档](http://phpdbg.com/docs)。


**```php://input可以被复用```**

```php://input``` 开始支持多次打开和读取，这给处理POST数据的模块的内存占用带来了极大的改善。


**```大文件上传支持```**

可以上传超过2G的大文件。


**```GMP支持操作符重载```**

**```新增gost-crypto哈希算法```**

**```SSL/TLS改进```**





