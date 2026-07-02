# 奶龙TI

奶龙TI 是一个抽象奶龙人格鉴定网页。

它通过一组轻松、搞怪、抽象的问题，判断你更像哪一种奶龙人格：可能是废奶、孤奶、奶尸、草奶、卧奶，也可能是隐藏的酒奶。

本项目仅供娱乐、整活和朋友互相调侃，不是严肃心理测评。

## 功能

- 30 道主线题
- 2 道隐藏彩蛋题
- 27 种抽象奶龙人格结果
- 结果页人格判词
- 15 项奶龙状态画像
- 27 张奶龙结果主图
- 奶思者结果图随机展示
- 结果分享卡下载
- 纯前端本地计算，不需要登录，不上传答案

## 本地运行

```bash
npm install
npm run dev
```

默认可访问：

```text
http://127.0.0.1:5173/
```

如果想固定使用 5174 端口：

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

然后打开：

```text
http://127.0.0.1:5174/
```

## 构建

```bash
npm run build
```

## 验证

```bash
npm run check
npm run verify:data
npm run verify:http
```

## Cloudflare Pages 部署

在 Cloudflare Pages 中使用静态站点部署，不要使用 Workers Sites。

```text
Build command: npm run build
Build output directory: dist
Root directory: /
Node.js version: 20
```

本项目不需要 `@cloudflare/vite-plugin`，也不需要 Worker 入口文件。

## 图片资源

结果主图位于：

```text
public/images/types/
```

图片按人格 code 命名，例如：

```text
NL-FW.png
NL-SOLO.png
NL-DEAD.png
NL-THINK-1.png
NL-THINK-2.png
```

其中 `NL-THINK` 奶思者有两张图，程序会随机展示。

## 说明

奶龙相关形象仅用于抽象整活和二创测试展示。若用于公开传播或商业用途，请注意相关 IP、素材授权和平台规则。
