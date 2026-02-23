# 忍者防御 (火之意志) - Shinobi Defense (Will of Fire)

一个基于 Naruto 题材的塔防游戏，使用 React + Vite + Tailwind CSS 构建。

## 🚀 快速开始

### 本地开发

1. 克隆仓库：
   ```bash
   git clone <your-repo-url>
   cd shinobi-defense
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

### 部署到 Vercel

1. 将代码推送至 GitHub。
2. 在 [Vercel 控制台](https://vercel.com) 中导入该仓库。
3. **重要配置**：在 Vercel 的环境变量 (Environment Variables) 中添加以下变量：
   - `GEMINI_API_KEY`: 你的 Google Gemini API 密钥（如果游戏逻辑中使用了 AI 功能）。
4. 点击部署。

## 🎮 玩法说明

- **目标**：保护木叶村免受苦无袭击。
- **操作**：点击屏幕发射手里剑进行拦截。
- **得分**：击毁敌方苦无获得功勋，达到 1000 分即可获胜。
- **资源**：注意查克拉（弹药）的使用。

## 🛠️ 技术栈

- **前端框架**: React 19
- **构建工具**: Vite 6
- **样式**: Tailwind CSS 4
- **动画**: Motion
- **图标**: Lucide React
