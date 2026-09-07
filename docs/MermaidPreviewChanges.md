# 🔔 What Changed in Mermaid Preview

## Mermaid Preview 2.2.0

**Mermaid Preview is now a local-only preview extension.**

Everything that needed a Mermaid account has moved to the **[Mermaid](https://marketplace.visualstudio.com/items?itemName=MermaidChart.vscode-mermaid-chart)** extension. Install it to keep using those features.

---

## 📦 Moved to the Mermaid extension

These features are no longer part of Mermaid Preview:

- **Sync Diagram** — saving a diagram back to your Mermaid account
- **Connect Diagram** — attaching a local diagram to a Mermaid project
- **Link Diagram** — inserting a Mermaid diagram ID into your code
- **Login / Logout** — Mermaid accounts and sign-in
- **Cloud diagram browser** — browsing Mermaid projects and diagrams in the side panel
- **Download diagram** — pulling a cloud diagram into your editor
- **Refresh** — re-syncing the cloud diagram list
- **Smart sync & conflict detection** — comparing local and remote versions
- **AI chat & Regenerate Diagram** — AI-assisted diagram generation

If you run one of these commands in Mermaid Preview, you will see a notice instead — nothing is synced, connected, or linked.

---

## ✅ Still here, still local

Mermaid Preview keeps everything that works without an account:

- Live diagram preview with pan, zoom, and reset
- Export to **PNG** and **SVG**
- Mermaid diagrams inside Markdown preview
- Auto-detect Mermaid blocks in Markdown, HTML, Hugo, and reStructuredText, with an **Edit Diagram** link
- Syntax highlighting for `.mmd` and `.mermaid` files
- Diagram templates on an empty file, plus snippets while you type
- **Create Diagram** and **Diagram help**
- Local sidebar home and settings for Preview
- Theme, max zoom, max text size, and max edges settings

---

## 🚀 Keep using the moved features

1. Install the **Mermaid** extension from the VS Code Marketplace.
2. Sign in with your Mermaid account.
3. Sync, Connect, Link, and the cloud side panel work there as before.


---

## Commands that now show this notice

| Command | Where it moved |
|---------|----------------|
| **Mermaid Preview: Sync Diagram** | Mermaid extension |
| **Mermaid Preview: Connect Diagram** | Mermaid extension |
| **Mermaid Preview: Link Diagram** | Mermaid extension |
