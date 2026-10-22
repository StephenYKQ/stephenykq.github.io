#!/bin/bash

set -euo pipefail

export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7890

# 强制使用 Homebrew Ruby
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
hash -r

ROOT="/Users/yangkaiqi/blog"
SITE="$ROOT/site"
BUILD="$ROOT/_site"
MAIN_BRANCH="main"
BRANCH="gh-pages"

echo ">>> 检查 Ruby 和 Bundler 路径"

echo "当前 Ruby: $(command -v ruby)"
echo "当前 Bundle: $(command -v bundle)"
ruby -v

cd "$ROOT"

echo ">>> 检查 Git 仓库"

git rev-parse --show-toplevel >/dev/null

echo ">>> 检查 Bundler 2.3.26"

bundle _2.3.26_ -v

echo ">>> 安装/检查依赖"

cd "$SITE"
bundle _2.3.26_ install

echo ">>> 构建 Jekyll"

bundle _2.3.26_ exec jekyll build --destination "$BUILD"

echo ">>> 复制部署配置"

cp "$ROOT/vercel.json" "$BUILD/"
cp "$ROOT/package.json" "$BUILD/"

echo ">>> 提交 main 分支"

cd "$ROOT"
git add -A

if git diff --cached --quiet; then
    echo "（main 分支没有改动可提交）"
else
    git commit -m "Deploy site"
fi

git push origin "HEAD:$MAIN_BRANCH" --force

echo ">>> 准备 gh-pages 部署工作目录"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --branch "$BRANCH" --single-branch \
    "$(git -C "$ROOT" remote get-url origin)" \
    "$TMP/deploy"

cd "$TMP/deploy"

echo ">>> 清理旧部署文件"

git rm -r --ignore-unmatch .

echo ">>> 复制新构建文件"

# 复制所有文件，包括隐藏文件，但不复制目录本身
rsync -a --delete --exclude='.git' "$BUILD/" "$TMP/deploy/"

echo ">>> 提交 gh-pages 分支"

git add -A

if git diff --cached --quiet; then
    echo "（网站内容没有变化，无需提交）"
else
    git commit -m "Deploy site"
    git push origin "$BRANCH"
fi

echo ">>> 部署完成 ✅"
