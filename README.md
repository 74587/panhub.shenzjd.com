# PanHub · 全网最全的网盘搜索（纯静态前台）

> 一个搜索框，搜遍全网网盘资源 —— 即搜即得、聚合去重、零服务端部署

**在线体验**：<https://panhub.shenzjd.com>

本仓库是 PanHub 开源的**纯静态前台**：没有服务端、没有后台、没有数据库。
构建产物是一堆静态文件，丢到任意静态托管（GitHub Pages / Cloudflare / Vercel /
对象存储 / Nginx）即可运行。

## ✨ 特性

- **纯静态**：只有 HTML + Vue 3，`npm run build` 产出 `dist/`，无任何服务端依赖
- **零配置**：接口地址已指向 PanHub 官方服务，clone 后构建即可用
- **连接官方搜索**：聚合 Telegram 频道与第三方源，边搜边出（SSE 流式）
- **一键获取**：搜索结果可直接换取网盘分享链接并复制口令
- **影视榜单**：豆瓣 12 分类，点击即可一键搜索
- **链接探活**：服务端检测失效 / 需密码链接，自动标记角标
- **深色模式**：跟随系统 `prefers-color-scheme`，首屏无闪白

## 🚀 快速开始

```bash
npm install
npm run dev      # 本地开发 http://localhost:4001
npm run build    # 产出 dist/（纯静态）
npm run preview  # 本地预览构建产物
```

## 📦 部署

产物在 `dist/`，任何静态托管都可用。构建时 `base` 已设为相对路径，
因此**部署在子路径也能正常工作**（例如 GitHub Pages 的 `/仓库名/`）。

### GitHub Pages（本仓库已内置自动部署）

推送 `main` 即自动构建并发布，无需手动跑构建。Action 会尝试自动开启 Pages；
若因仓库权限导致失败，手动开启一次即可：

1. 打开仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**（不要选 "Deploy from a branch"）
3. 到 **Actions** 页等 `Deploy to GitHub Pages` 跑完，访问
   `https://<用户名>.github.io/<仓库名>/`

之后每次 push 到 `main` 都会自动重新发布。

### 其他平台

| 平台 | 设置 |
|------|------|
| **Cloudflare Pages** | 构建命令 `npm run build`，输出目录 `dist` |
| **Vercel** | 框架预设选 `Vite`，构建命令 `npm run build`，输出目录 `dist` |
| **任意静态托管** | 本地 `npm run build` 后，把 `dist/` 整个目录上传 |

## 🔍 工作原理

```
① 用户输入关键词
      ↓
② 确保已登录 —— wx-auth 公共组件（关注公众号 / 小程序扫码）
      ↓
③ GET  /api/search.stream     SSE 长连接，服务端逐批推送，边搜边出
      ↓
④ POST /api/transfer          对带 tid 的条目换取网盘分享链接
      ↓
⑤ 复制口令 → 打开网盘 APP 保存
```

登录与数据都在官方服务侧，前端只负责调用与展示。

## ⚠️ 重要提醒

- **必须由浏览器直连官方 API。** 不要用 Node / 服务端做代理转发：
  官方接口对脚本 UA 有拦截策略，代理转发会被判定为爬虫并封禁 IP。
- **未登录时后端不会报错**，而是返回结构完全一致的演示数据。
  调试接口请先完成登录，否则你看到的是假数据。
- 本仓库**不含任何服务端代码**。请勿在其中提交密钥或私有配置。

## 📖 接口文档

开放的接口清单、鉴权方式、SSE 协议与错误码见 **[API.md](./API.md)**。

## 🛡️ 免责声明

- 不存储、不传播任何受版权保护的内容；资源链接均来自公开网络
- 请遵守当地法律法规与平台使用条款；侵权问题请联系源站处理

## 📄 开源协议

本项目基于 [PolyForm Noncommercial License 1.0.0](./LICENSE) 授权：

- ✅ 允许个人学习、研究等**非商业用途**的自由使用、修改与分发
- ❌ 任何商业用途（包括但不限于销售、收费服务、商业网站部署、广告变现）需事先获得作者书面授权
- 📮 商务合作请联系：[Telegram](https://t.me/shenzjd_com)
