# 增肌减脂工作台（本地桌面 App）

一个**纯本地**的增肌减脂记录 / 监督 / 指导工具。数据全部存在你自己的电脑上，**不会联网、不会上传**。
AI 分析由对话式助手（WorkBuddy）读取本地数据文件后给出，App 本身不含 AI、不需要任何密钥。

> 目标方向默认是「健体（薄肌线条）」：体重基本稳定、力量稳步上升、线条更清晰，而不是一味减脂或猛增肌。

---

## 功能

- **身体**：记录体重 / 腰围 / 胸围 / 臂围 / 大腿围 / 体脂率，自动画趋势图。
- **训练**：按动作记录组数 × 次数 × 重量，自动对比跨日进展、提醒该加重（平台期检测）。
- **饮食**：按早 / 午 / 晚拍照留档 → 把照片发给 AI 估算蛋白 / 脂肪 / 碳水 / 热量 → 粘贴自动填入（也可手填）。
- **指导**：根据目标 + 近 7 天饮食 + 训练状态，给出蛋白 / 热量是否达标、体重趋势、加重建议等。
- **数据**：一键导出 / 导入 JSON 备份；桌面模式下数据自动写本机文件。

---

## 三种使用方式

| 方式 | 适合 | 说明 |
|------|------|------|
| **桌面 App（推荐）** | 日常长期使用 | 打包后双击打开，数据存本机，无需服务器 |
| **浏览器直接打开** | 临时看一眼 | 双击 `index.html`，数据存浏览器 localStorage（换浏览器会丢，记得导出备份） |
| **本地服务器（Windows）** | 想要数据自动落盘工作间 | 用 `start.bat` 启动，AI 可直接读工作间 `data.json` |

---

## 打包成桌面 App

> 关键点：仓库里**不含** NW.js 运行时（它约 400MB+，GitHub 不让传）。打包脚本会在你本机自动下载对应系统的运行时，再把 `index.html` + `package.json` 组装进去。所以 App 体积大是正常的，不影响使用。

### macOS

```bash
chmod +x build-mac.sh
./build-mac.sh
```

脚本会下载 NW.js、生成 `FitnessCoach.app`。
首次打开若被系统拦截（Gatekeeper），在终端执行：

```bash
xattr -cr "/路径/FitnessCoach.app"
```

然后右键 App → 打开即可。数据落在：`~/Library/Application Support/fitness-coach/data.json`

### Windows

双击 `build-win.bat`（或右键「以管理员身份运行」）。脚本会下载 NW.js、生成 `FitnessCoach/FitnessCoach.exe`。
双击 `FitnessCoach.exe` 即可使用。数据落在：`C:\Users\你的用户名\AppData\Roaming\fitness-coach\data.json`

---

## 让 AI 帮你分析

1. 在 App 里正常记录身体 / 训练 / 饮食数据。
2. 打开 WorkBuddy（或同类对话助手），把本机数据文件 `data.json` 发过去（桌面模式在上面的路径；服务器模式在 `fitness-coach/data.json`）。
3. 说类似：「帮我分析最近两周的进展，给我下一阶段的训练和饮食建议」。
4. AI 读取后给出阶段性分析与可执行建议。无需每天导出，需要时发一次即可。

---

## 目录结构

```
fitness-coach/
├── index.html        # 主程序（单文件，内联 CSS/JS，零外部依赖）
├── server.js         # 本地服务器（Windows 服务器模式用，自动落盘 data.json）
├── start.bat         # Windows 一键启动服务器 + 打开浏览器
├── package.json      # NW.js 桌面 App 清单
├── make-icon.js      # 生成应用图标（零依赖）
├── build-mac.sh      # macOS 打包脚本
├── build-win.bat     # Windows 打包脚本
└── README.md
```

---

## 隐私说明

- 所有数据只存在你本机，App 不联网、不上传。
- `data.json` 和 `photos/` 已在 `.gitignore` 中，不会被提交到仓库。
- 只有当你主动把文件发给 AI 时，数据才会离开你的电脑。

---

## 技术说明

- 热量算法（默认「健体」）：TDEE = Mifflin-St Jeor BMR × 活动系数；目标热量 = TDEE × 1.05；蛋白 = 2.0 g/kg。
  - 减脂 = TDEE × 0.8 / 2.0 g/kg；增肌 = TDEE × 1.10 / 1.8 g/kg；维持 = TDEE / 1.6 g/kg。
- 桌面壳基于 [NW.js](https://nwjs.io)（内置 Chromium + Node.js），前端通过 `require('fs')` 直接写本机文件。
