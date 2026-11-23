# My Inspiration Gacha

zhangyuanyuan 的个人作品集。使用原生 HTML、CSS、JavaScript 与透明角色序列帧，无需安装前端依赖。

## 页面入口

本地通过静态 HTTP 服务访问 `site/hi3d-my-capsules.html`。GitHub Actions 会在部署时生成站点根目录入口，所有资源都使用相对路径。

## 发布与更新

仓库的 Pages 来源设为 GitHub Actions。更新 `site/` 中的对应文件并推送到 `main` 后，发布工作流会自动运行。不要上传账号凭据、原始视频、工作区记录或尚未公开的个人资料。

## 功能与内容边界

首轮按六个项目的既定顺序抽取，之后每轮随机且不重复；进度保存在访问者自己的浏览器。所有项目可直接访问。

公开站点只包含展示代码与已确认公开的 `site/hi3d-content.json`，不托管管理界面或上传服务。内容由独立的本机私有管理台编辑并通过 Git 提交发布。封面和简历只引用 `site/assets/` 中明确公开的文件；未上传简历时不显示下载入口。

六个核心作品的稳定标识与扭蛋顺序不变。可在配置的 `extraProjects` 中增加收藏区作品，不增加机器内胶囊。项目详情字段支持纯文本换行，不执行 HTML。尚未提供的项目成果仍为明确占位，不编造数据。

## 链接型项目

项目主链接沿用 `demoUrl` 字段，旧配置保持兼容。`linkType` 决定默认按钮文案，`linkLabel` 可覆盖文案，`displayMode` 为 `external`（默认）或 `embed`；`resourceLinks` 为最多四个 `{label, url}` 补充链接。

收藏卡片与扭蛋预览提供直接体验入口，详情保留案例介绍。选择 `embed` 时，访问者点击后才创建带 sandbox 的 iframe；跨域页面是否能显示由原网站决定，不将 iframe 的 load 事件视为成功证明。始终保留外链并支持关闭；离开详情会卸载外部页面。静态展示与原有动画不依赖外部 Demo 的可用性。
