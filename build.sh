#!/bin/bash

rm -rf /tmp/_site

jekyll build

cp -r _site /tmp/_site

git checkout master

rm -rf ./*

cp -r /tmp/_site/* .

git add -A

git commit -a -m 'update'

git push origin master




