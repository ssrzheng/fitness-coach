#!/usr/bin/env bash
# 在 macOS 上把 fitness-coach 打包成桌面 App（FitnessCoach.app）
# 需要：curl、unzip（系统自带）；node（用于生成图标，没有会自动跳过）
# 用法：chmod +x build-mac.sh && ./build-mac.sh
set -e

NW_VERSION="v0.98.0"
NW_URL="https://dl.nwjs.io/${NW_VERSION}/nwjs-${NW_VERSION}-osx-x64.zip"
APP_NAME="FitnessCoach"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> 下载 NW.js（${NW_URL}）"
curl -L -o "$DIR/nwjs.zip" "$NW_URL"

echo "==> 解压"
rm -rf "$DIR/nwjs-tmp"
mkdir -p "$DIR/nwjs-tmp"
unzip -q -o "$DIR/nwjs.zip" -d "$DIR/nwjs-tmp"
SRC=$(find "$DIR/nwjs-tmp" -maxdepth 1 -type d -name 'nwjs*.app' | head -1)
if [ -z "$SRC" ]; then echo "解压失败，未找到 .app"; exit 1; fi

rm -rf "$DIR/$APP_NAME.app"
cp -R "$SRC" "$DIR/$APP_NAME.app"
mkdir -p "$DIR/$APP_NAME.app/Contents/Resources/app"
cp "$DIR/index.html" "$DIR/package.json" "$DIR/$APP_NAME.app/Contents/Resources/app/"

# 生成图标（可选）
if command -v node >/dev/null 2>&1; then
  node "$DIR/make-icon.js" "$DIR/$APP_NAME.app/Contents/Resources/app/icon.png"
fi

rm -rf "$DIR/nwjs-tmp" "$DIR/nwjs.zip"
echo "==> 完成：$DIR/$APP_NAME.app"
echo "==> 首次打开若被 macOS 拦截（Gatekeeper），在终端执行："
echo "    xattr -cr \"$DIR/$APP_NAME.app\""
echo "    然后右键 App → 打开"
