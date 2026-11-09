# 本目录由 scripts/build-skill.mjs 生成，请勿手改

`skill/dsh-arch-advisor-offline/lib/` 与 `skill/dsh-arch-advisor-offline/content/` 是包根同名目录的副本，
目的是让「复制 skill 目录即可安装」成立。要改内容请改包根的 `lib/`、`content/`，然后运行：

```sh
npm run skill:sync
```

`npm run smoke` 会校验副本与源是否一致（不一致即失败）。
