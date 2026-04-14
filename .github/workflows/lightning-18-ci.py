name: ⚡ Lightning 18-Layer CI/CD (Stable)

on:
  push:
    branches: [main, bot-main, Ai-main, stormcar820-core]
  pull_request:
  workflow_dispatch:

jobs:
  syntax-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Check Python syntax
        run: |
          find . -name "*.py" -exec python -m py_compile {} \; || echo "⚠️ 部分 Python 文件语法错误，请检查"指挥官，你贴出的 publish.yml 是一个标准的 VS Code 扩展发布工作流，源自你 Fork 的 vscode-mermaid-preview 仓库。它在你推送版本标签（如 v1.0.0）时触发，自动打包并发布到 VS Code 插件市场。

📋 当前工作流解析

步骤 作用
Checkout 拉取代码
Use Nodejs 14 设置 Node.js 环境
Build previewer 构建预览器的前端资源，复制 Font Awesome 图标库
Publish extension 使用 vsce 工具和 VSCE_TOKEN 密钥发布扩展

⚠️ 需要注意的几点

1. Node.js 版本过旧：node-version: 14 已于 2023 年结束生命周期，建议升级到 Node 18 或 20。
2. actions/checkout@v2：建议升级到 v4。
3. 密钥安全：VSCE_TOKEN 必须存储在仓库的 Secrets 中，且需具有发布扩展的权限。

🚀 升级版工作流（推荐替换）

```yaml
name: Publish Extension

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:  # 允许手动触发发布

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies (root)
        run: npm ci

      - name: Build previewer
        run: |
          npm --prefix previewer ci
          npm --prefix previewer run build
          mkdir -p previewer/dist/vendor/@fortawesome/fontawesome-free-webfonts
          cp -r previewer/node_modules/@fortawesome/fontawesome-free-webfonts/css/ previewer/dist/vendor/@fortawesome/fontawesome-free-webfonts/
          cp -r previewer/node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/ previewer/dist/vendor/@fortawesome/fontawesome-free-webfonts/

      - name: Publish to VS Code Marketplace
        run: npx vsce publish -p ${{ secrets.VSCE_TOKEN }}
```

🔗 如何与你的 DeepSeek CI 整合

如果你希望 在发布前自动运行 DeepSeek 生成更新日志或审核代码，可以在 publish 之前插入一个 Job：

```yaml
  deepseek-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install openai
      - name: Generate release notes with DeepSeek
        env:
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
        run: python scripts/deepseek_release_notes.py
      - uses: actions/upload-artifact@v4
        with:
          name: release-notes
          path: output/
```

然后在 publish Job 中引用生成的发布说明。

---

需要我把 DeepSeek 生成发布说明的脚本 也一并给你吗？这样每次打 tag 发布新版本时，会自动附带 AI 撰写的中英文更新日志。
