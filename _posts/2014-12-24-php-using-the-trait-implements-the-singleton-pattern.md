---
layout: post
title: "PHP使用trait实现单例模式"
date: 2014-11-09 22:18:41 +0800
comments: true
categories: PHP
---

```Traits``` 是PHP5.4新添加的一个特性，提高了代码的重用性，也使得PHP能够实现类似Java，C++的多重继承。

**使用Trait实现单例模式**

- 首先定义一个traits

```php

<?php

    trait Singleton {
        
        protected static $_instance;

        final public function getInstance(){
            if (!isset(self::$_instance)){
                self::$_instance = new static();    //延迟静态绑定
            }

            return self::$_instance;
        }

        private function __construct(){
            $this->init();
        }

        protected function init(){}
        
        final private function __wakeup(){}
        final private function __clone(){}
    }
    
?>

```

- 在类中使用该traits

```php

<?php
    
    class Foo {
        
        use Singleton;

        protected function init(){
            echo "www.jaylee.cc";
        }
    }

    $foo1 = Foo::getInstance(); //输出www.jaylee.cc
    $foo2 = Foo::getInstance(); //无输出

```

这样，用traits就使一个类变成了单例类，非常方便，且代码简洁。

