# Muse iPhone 用量小组件

解锁手机就能看 Muse 用量，不用打开 App 查。

## 显示什么

- **周额度剩余**：进度条 + 百分比，重置倒计时
- **额外 Token 剩余**：进度条 + 百分比，还剩多少（例如 5.5B）
- 颜色：剩余 ≥25% 绿色，<25% 黄色，<10% 红色（两条都按这个规则）
- 取不到数据时显示缓存，并标“缓存”；连缓存都没有才显示离线

为什么两条都显示：周额度经常是 0%，但额外 Token 还有很多，那时其实还能用。只看周额度会一直红，没意义。

## 数据怎么来

- VM 上每 3 小时跑 `subscription-status status`，解析成 `muse-usage.json`，推到这个私有仓
- 小组件只读这个 JSON，不碰 Muse 登录
- 刷新时间是 iOS 定的，3 小时是服务端更新频率，不是小组件保证刷新

## 安装步骤（iPhone）

### 1. 建一只读令牌（只做一次，约 2 分钟）

全权限令牌绝对不要填进手机脚本。新建一个只读的：

1. 电脑打开 github.com → 头像 → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
2. Token name 填 `muse-usage-widget-readonly`
3. Expiration 选最长（细粒度令牌最长 1 年，到期前换一把）
4. Repository access 选 **Only select repositories**，只勾 `linuxdowill-hub/muse-usage-widget`
5. Permissions 里只开 **Contents → Read-only**，其他什么都不开
6. Generate token，复制下来（只显示一次）

### 2. 装 Scriptable，导入脚本

1. App Store 免费安装 Scriptable
2. 打开 Scriptable → 右上角 `+` → 粘贴本仓 `MuseUsage.js` 的全部内容 → 命名为 `MuseUsage`
3. 把脚本最上面 `READONLY_TOKEN` 的 `PASTE_READONLY_TOKEN_HERE` 换成第 1 步复制的令牌，保存

### 3. 加到桌面

1. 长按桌面空白处 → 左上角 `+` → 搜 Scriptable → 选尺寸（建议中号）
2. 点添加好的小组件 → Edit Widget → Script 选 `MuseUsage`
3. 回到桌面，等 iOS 刷新一次就会出数。想立刻看：在 Scriptable 里打开这个脚本点运行

## 文件

- `muse-usage.json`：最新用量数据（每 3 小时更新）
- `MuseUsage.js`：小组件脚本
- `update_usage.py`：VM 上的更新脚本（`subscription-status` → 解析 → 推仓）

## 排障

- 一直显示“缓存”：令牌可能过期或仓库没选对，重新按第 1 步建一把
- 显示离线：没网且手机里没缓存过，先联网打开脚本跑一次
- 数字几个小时不变：正常，服务端 3 小时才更新一次，iOS 也不会每分钟刷新小组件
