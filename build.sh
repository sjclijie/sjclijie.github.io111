#!/bin/bash

rm -rf /tmp/_site

jekyll build

cp -r _site /tmp/_site



