# Glassic UI Token 索引

> **REFERENCE ONLY — 仅作索引**
>
> 本文件不定义、复制或覆盖任何 token 数值。玻璃参数以《浅色玻璃拟态实现规范》的 G3 token 表为设计侧真值，以共享主题文件为代码侧真值。

## Token 族

| 用途 | Token 族 |
|---|---|
| 背景模糊 | `--glass-blur-1` / `--glass-blur-2` / `--glass-blur-3` |
| 半透填充 | `--glass-fill-1` / `--glass-fill-2` / `--glass-fill-3` |
| 边缘高光 | `--glass-border-1` / `--glass-border-2` / `--glass-border-3` |
| 软阴影 | `--glass-shadow-1` / `--glass-shadow-2` / `--glass-shadow-3` |

## 使用边界

- 组件只引用 token，不在组件内 hard-code 玻璃参数。
- 同一容器只有一个材质 owner，内容层不重复添加背景、模糊或阴影。
- Windows 透明浮窗遵循共享规范中的平台例外：不使用 1px 实体外边框。
- 旧 token 数值和第三方玻璃组件示例属于历史资料，不在本索引保留。

## 权威入口

- 设计侧：《浅色玻璃拟态（Light Glassmorphism）— 开发落地实现规范》
- 代码侧：共享主题 CSS
