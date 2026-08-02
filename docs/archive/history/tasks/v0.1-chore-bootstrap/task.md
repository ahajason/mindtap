# chore(bootstrap): v0.1.0 references + router 引导

> 创建: 2026-06-21

## Why
V0.1.0 启动需要把 V1.0 归档的参考素材(swift / spec / analysis)与 active 仓库
建立稳定引用关系,同时引入 style guide 路由依赖与测试栈。
不引导的话,后续每个 task 都会重复处理"spec 从哪来 / taskisland 怎么拉"
这种基础设施问题,既慢又易出错。

## What
物理操作:清掉 taskisland 残留、重新拉取完整 clone、复制 spec 与分析
文档、装路由与测试栈依赖。

## Done when
- [ ] docs/references/source/taskisland/ 是 taskisland 完整 clone (git ignore)
- [ ] docs/references/taskisland.md 存在,带 active frontmatter
- [ ] docs/references/README.md 存在,内容是 reference banner + 维护说明
- [ ] docs/design/glassic-ui-spec.md 存在(字面 cp + frontmatter + 关联区已改)
- [ ] package.json 含 react-router-dom ^7
- [ ] package.json 含 vitest + @testing-library/react + @testing-library/jest-dom + jsdom
- [ ] npm install 通过