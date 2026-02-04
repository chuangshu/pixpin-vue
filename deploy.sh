#!/bin/bash
# 部署脚本 - 在本地运行

echo "📦 推送代码到 GitHub..."

# 确保代码已提交
if [ -z "$(git log --oneline -1 2>/dev/null)" ]; then
    echo "❌ 还没有提交代码"
    exit 1
fi

# 推送代码
git push -u origin main

echo "✅ 代码已推送！"
echo ""
echo "📋 下一步 - 启用 GitHub Pages:"
echo "1. 打开 https://github.com/chuangshu/pixpin-vue/settings/pages"
echo "2. Source 选择: 'main'"
echo "3. 点击 Save"
echo ""
echo "🌐 访问地址: https://chuangshu.github.io/pixpin-vue/"
