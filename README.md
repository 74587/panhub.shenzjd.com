# PanHub · 全网最全的网盘搜索

> 一个搜索框，搜遍全网网盘资源 —— 即搜即得、聚合去重、轻量部署

**在线体验**：<https://panhub.shenzjd.com>

## ✨ 核心特性

- **多源聚合**：Telegram 频道 + 第三方插件，聚合去重、智能排序
- **影视榜单**：豆瓣 12 分类，点击即可一键搜索
- **零服务端**：纯静态页面，构建产物丢到任意静态托管即可运行
- **多端部署**：GitHub Pages / Cloudflare / Vercel

## 🚀 快速开始

```bash
npm install
npm run dev      # 本地开发 http://localhost:4001
npm run build    # 产出 dist/（纯静态）
npm run preview  # 本地预览构建产物
```

## ⚡ 一键部署

### GitHub Pages（本仓库已内置自动部署）

推送 `main` 即自动构建并发布，无需手动跑构建。Action 会尝试自动开启 Pages，
若因仓库权限导致失败，手动开启一次即可：

1. 打开仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 到 **Actions** 页等 `Deploy to GitHub Pages` 跑完，访问
   `https://<用户名>.github.io/<仓库名>/`

### 其他平台

| 平台 | 设置 |
|------|------|
| Cloudflare Pages | 构建命令 `npm run build`，输出目录 `dist` |
| Vercel | 框架预设选 `Vite`，构建命令 `npm run build`，输出目录 `dist` |
| 任意静态托管 | 本地 `npm run build` 后，把 `dist/` 整个目录上传 |

> 构建时 `base` 已设为相对路径，部署在子路径（如 `/仓库名/`）也能正常工作。

## 📦 支持平台

阿里云盘 / 夸克 / 百度网盘 / 115 / 迅雷 / UC / 天翼云盘 / 123 网盘 / 移动云盘 / 磁力链接

## 🔐 登录

搜索需登录：登录态由独立的认证服务 wx-auth 校验（关注公众号 + 验证码）。

## 📖 接口文档

开放的接口清单、鉴权方式、SSE 协议与错误码见 **[API.md](./API.md)**。

## ⚠️ 注意事项

- 请使用浏览器访问，不要用脚本或服务端代理转发请求
- 本仓库不含任何服务端代码，请勿在其中提交密钥或私有配置

## 🛡️ 免责声明

- 不存储、不传播任何受版权保护的内容；资源链接均来自公开网络
- 请遵守当地法律法规与平台使用条款；侵权问题请联系源站处理

## 📄 开源协议

本项目基于 [PolyForm Noncommercial License 1.0.0](./LICENSE) 授权：

- ✅ 允许个人学习、研究等**非商业用途**的自由使用、修改与分发
- ❌ 任何商业用途（包括但不限于销售、收费服务、商业网站部署、广告变现）需事先获得作者书面授权
- 📮 商务合作请联系：[Telegram](https://t.me/shenzjd_com)
