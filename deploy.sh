#!/bin/bash
set -e  # 出错就退出

echo ">>> 检查 Ruby 和 Bundler 路径"
RUBY_PATH=$(which ruby)
BUNDLE_PATH=$(which bundle)

echo "当前 Ruby: $RUBY_PATH"
echo "当前 Bundle: $BUNDLE_PATH"

# 如果 ruby 来自 homebrew 而不是系统自带
if [[ "$RUBY_PATH" == *"/opt/homebrew/"* ]]; then
  echo "检测到 Homebrew Ruby，切换到系统 Ruby..."
  export PATH=/usr/bin:/bin:/usr/sbin:/sbin:$PATH
  hash -r
  echo "切换后的 Ruby: $(which ruby)"
  echo "切换后的 Bundle: $(which bundle)"
fi

#echo ">>> 安装依赖"
cd /Users/yangkaiqi/blog/site
#bundle _2.3.26_ install

echo ">>> 构建 Jekyll"
bundle _2.3.26_ exec jekyll build --destination ../_site

echo ">>> 复制 vercel.json"
cd /Users/yangkaiqi/blog
cp vercel.json _site/

echo ">>> 提交 main 分支"
git add .
git commit -m "Deploy site" || echo "（没有改动可提交）"
git push origin main --force

echo ">>> 提交 gh-pages 分支"
cd _site
git add .
git commit -m "Deploy site" || echo "（没有改动可提交）"
git push -u origin gh-pages --force

echo ">>> 部署完成 ✅"