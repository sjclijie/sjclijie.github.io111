---
layout: post
title: "PHP Traits详解"
date: 2014-10-26 17:59:46 +0800
comments: true
categories: php 

---

从PHP5.4起，为了弥补php单继承的不足，引入了traits特性。使得php可以通过trait实现多重继承。

**一个简单的栗子**

```php

<?php
	
	trait R {
		
		public function rich(){
			echo "I'm rich...";
		}
	}
	
	class Person {
		
		//在类中使用traits
		use R;
		
		public function handSome(){
			echo "I'm handSome...";
		}
	}
	
	//实例化对象
	$p = new Person();
	
	$p->rich();    // I'm rich...
	
	$p->handSome(); // I'm handSome...
	
```


**还可以像这样，同时引入多个Traits**

```php
<?php
	
	trait includeTrait {
		public function includeMethod(){
			echo "这个trait将被别的trait包含";
		}
	}
	
	trait firstTrait {
		
		//trait中也可以包含trait
		use includeTrait;
		
		public function firstMethod(){
			echo "method1";
		}
	}
	
	trait secondTrait {
		
		//trait中也可以使用抽象方法
		abstract function secondMethod();
	}
	
	class Foo {
		
		//同时使用多个trait
		use firstTrait, secondTrait;
		
		//重写抽象方法
		public function secondMethod(){
			echo "method2";
		}
	}
	
	$foo = new Foo();
	
	$foo->includeMethod();	//"这个trait将被别的trait包含"
	$foo->firstMethod();	//"method1"
	$foo->secondMethod();	//"method2"
```
 
 
**如果命名冲突了呢？**

```php
<?php
	
	trait T1 {
		
		public function sameMethodName(){
			echo "T1.";
		}
	}
	
	trait T2 {
		//包含了一个和T1同名的方法
		private function sameMethodName(){
			echo "T2.";
		}
	}
	
	class Foo {
		
		//同时使用T1和T2两个traits
		use T1,T2 {
		
			//使用T1中的sameMethodName而不是T2中的
			
			T1::sameMethodName insteadof T2;
			
			//将T2中的sameMethodName改名为anotherMethod;
			T2::sameMethodName as public anotherMethod;
		}
	}
	
	$foo = new Foo();
	
	$foo->sameMethodName();		//"T1."
	
	$foo->anotherMethod();		//"T2."

```


#### 总结

- ```Traits``` 和一个类的形为相似，但是不能被实例化。
- 可以使用```use```引入多个Traits
- 如果一个类引入了多个Traits,并且Traits中有同名的方法，在没有明确指定如何解决冲突时会产生一个致命错误，需要使用```insteadof```操作符来指定使用冲突方法中的哪一个方法，也可以使用```as```操作符将其中一个冲突方法以另一个名称引入。
- 使用```as```语法还可以用来调整方法的访问控制权限。
