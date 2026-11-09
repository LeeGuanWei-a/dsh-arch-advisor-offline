# 知识库总目录（awesome-architecture 离线快照）

来源：`study8677/awesome-architecture`（MIT，中英双语）。这是定位用的索引；正文请用 `arch.mjs read` 或宿主读文件工具读取 `content/` 下同名路径。

> 本文件由 `npm run skill:refs` 从 `lib/` 数据源生成，**请勿手改**；要改内容请改数据源后重新生成。

## 教程 tutorial/（40 章 + T01 专题 + 术语表 + 演进触发信号）

| id | 编号 | 中文标题 | 英文标题 | 英文版 | 路径 |
| --- | --- | --- | --- | --- | --- |
| tutorial:01 | 01 | 为什么先有架构思维 | Why architecture-first thinking | 有 | `tutorial/01-为什么先有架构思维.md` |
| tutorial:02 | 02 | 架构师的思考框架 | The architect's thinking framework | 有 | `tutorial/02-架构师的思考框架.md` |
| tutorial:03 | 03 | 读懂与画好架构图 | Reading and drawing architecture diagrams | 有 | `tutorial/03-读懂与画好架构图.md` |
| tutorial:04 | 04 | 十大核心架构模式 | 10 core architecture patterns | 有 | `tutorial/04-十大核心架构模式.md` |
| tutorial:05 | 05 | 数据与状态 | Data and state | 有 | `tutorial/05-数据与状态.md` |
| tutorial:06 | 06 | 质量属性与取舍 | Quality attributes and trade-offs | 有 | `tutorial/06-质量属性与取舍.md` |
| tutorial:07 | 07 | 从0到1设计一个系统 | Designing a system from 0 to 1 | 有 | `tutorial/07-从0到1设计一个系统.md` |
| tutorial:08 | 08 | 架构决策记录与演进 | ADRs and evolution | 有 | `tutorial/08-架构决策记录与演进.md` |
| tutorial:09 | 09 | 架构品味 | Architectural taste | 有 | `tutorial/09-架构品味.md` |
| tutorial:10 | 10 | 分布式系统的硬道理 | Distributed systems: the hard truths | 有 | `tutorial/10-分布式系统的硬道理.md` |
| tutorial:11 | 11 | 数据一致性工程 | The engineering of data consistency | 有 | `tutorial/11-数据一致性工程.md` |
| tutorial:12 | 12 | 为失败而设计 | Designing for failure: resilience | 有 | `tutorial/12-为失败而设计.md` |
| tutorial:13 | 13 | 规模化的力学 | The mechanics of scale | 有 | `tutorial/13-规模化的力学.md` |
| tutorial:14 | 14 | 演进与拆分大型系统 | Evolving and splitting large systems | 有 | `tutorial/14-演进与拆分大型系统.md` |
| tutorial:15 | 15 | 组织即架构 | Organization as architecture | 有 | `tutorial/15-组织即架构.md` |
| tutorial:16 | 16 | 安全与多租户架构 | Security and multi-tenancy | 有 | `tutorial/16-安全与多租户架构.md` |
| tutorial:17 | 17 | 大模型时代的架构判断 | Architecting in the age of LLMs | 有 | `tutorial/17-大模型时代的架构判断.md` |
| tutorial:18 | 18 | 读地图用框架拆解陌生系统 | Reading the map: deconstruct unfamiliar systems | 有 | `tutorial/18-读地图用框架拆解陌生系统.md` |
| tutorial:19 | 19 | 完整设计演练中等复杂度系统 | Full design walkthrough: medium complexity | 有 | `tutorial/19-完整设计演练中等复杂度系统.md` |
| tutorial:20 | 20 | 演进剧本MVP到规模化 | Evolution playbook: MVP to scale | 有 | `tutorial/20-演进剧本MVP到规模化.md` |
| tutorial:21 | 21 | 拆分与迁移实战 | Splitting and migration in practice | 有 | `tutorial/21-拆分与迁移实战.md` |
| tutorial:22 | 22 | AI原生系统设计 | AI-native system design | 有 | `tutorial/22-AI原生系统设计.md` |
| tutorial:23 | 23 | 规格即架构约束怎么写给AI | Spec as architecture: constraints for AI | 有 | `tutorial/23-规格即架构约束怎么写给AI.md` |
| tutorial:24 | 24 | 审查清单AI产出默认缺什么 | Review checklist: what AI output omits by default | 有 | `tutorial/24-审查清单AI产出默认缺什么.md` |
| tutorial:25 | 25 | 评测驱动把够好写进架构 | Eval-driven: bake good enough into architecture | 有 | `tutorial/25-评测驱动把够好写进架构.md` |
| tutorial:26 | 26 | 协作决策树何时vibe何时spec-first | Collaboration decision tree: when to vibe, when to spec-first | 有 | `tutorial/26-协作决策树何时vibe何时spec-first.md` |
| tutorial:27 | 27 | 编程语言与后端框架选型 | Languages and backend frameworks | 有 | `tutorial/27-编程语言与后端框架选型.md` |
| tutorial:28 | 28 | 数据库与存储选型 | Databases and storage | 有 | `tutorial/28-数据库与存储选型.md` |
| tutorial:29 | 29 | 缓存消息队列与事件系统选型 | Cache, queues and events | 有 | `tutorial/29-缓存消息队列与事件系统选型.md` |
| tutorial:30 | 30 | API与服务通信选型 | APIs and service communication | 有 | `tutorial/30-API与服务通信选型.md` |
| tutorial:31 | 31 | 云原生与部署平台选型 | Cloud native and deployment | 有 | `tutorial/31-云原生与部署平台选型.md` |
| tutorial:32 | 32 | 可观测性与可靠性技术栈选型 | Observability and reliability | 有 | `tutorial/32-可观测性与可靠性技术栈选型.md` |
| tutorial:33 | 33 | AI基础设施技术栈选型 | AI infrastructure | 有 | `tutorial/33-AI基础设施技术栈选型.md` |
| tutorial:34 | 34 | 技术选型决策树 | Technology selection decision tree | 有 | `tutorial/34-技术选型决策树.md` |
| tutorial:35 | 35 | AI原生组织架构 | — | 无 | `tutorial/35-AI原生组织架构.md` |
| tutorial:36 | 36 | 超级个体与超级团队 | — | 无 | `tutorial/36-超级个体与超级团队.md` |
| tutorial:37 | 37 | 共享上下文架构 | — | 无 | `tutorial/37-共享上下文架构.md` |
| tutorial:38 | 38 | AI工作流架构 | — | 无 | `tutorial/38-AI工作流架构.md` |
| tutorial:39 | 39 | 责任与治理架构 | — | 无 | `tutorial/39-责任与治理架构.md` |
| tutorial:40 | 40 | AI原生组织演进路线 | — | 无 | `tutorial/40-AI原生组织演进路线.md` |
| tutorial:T01 | T01 | 训练方案不是算法排行榜先把决策分层 | Training plans are not an algorithm leaderboard: layer the decision first | 有 | `tutorial/T01-训练方案不是算法排行榜先把决策分层.md` |
| tutorial:g | — | 术语表 | — | 无 | `tutorial/术语表.md` |
| tutorial:s | — | 演进触发信号 | — | 无 | `tutorial/演进触发信号.md` |

术语表 / 演进触发信号是单篇专题，无编号、无英文版；演进触发信号与教程 20 章配合使用。

## 模板 templates/（31 个 + 1 个专题入口）

每个模板固定结构：解决什么问题 → 部件与数据流 → 关键决策与权衡 → 规模化死点 → 演进路线 → 真实产品。

| id | 分组 | 中文标题 | 英文标题 | 关键词 | 路径 |
| --- | --- | --- | --- | --- | --- |
| template:ai-chat-product | 经典/通用 | AI 对话产品 | AI Chat Product | LLM推理,流式输出,上下文管理,RAG,成本控制,Claude,ChatGPT | `templates/ai-chat-product/README.md` |
| template:browser-extension | 经典/通用 | 浏览器插件 | Browser Extension | 内容脚本,后台分离,页面注入,隐私边界,变现,Honey,Grammarly | `templates/browser-extension/README.md` |
| template:standard-web-app | 经典/通用 | 普通网站 | Standard Web App | 经典三层,缓存,读写分离,企业官网,博客,SaaS后台 | `templates/standard-web-app/README.md` |
| template:mobile-app | 经典/通用 | 移动 App | Mobile App | 离线优先,数据同步,客户端状态,推送,iOS,Android | `templates/mobile-app/README.md` |
| template:ecommerce-platform | 经典/通用 | 电商平台 | E-commerce Platform | 库存,订单,支付,超卖,大促洪峰,Amazon,Shopify,淘宝 | `templates/ecommerce-platform/README.md` |
| template:social-feed | 经典/通用 | 社交信息流 | Social Feed | Feed,拉取,推送,关注关系,热点扩散,扇出,Twitter,X,Instagram | `templates/social-feed/README.md` |
| template:video-streaming | 经典/通用 | 视频流媒体 | Video Streaming | 转码,CDN,自适应码率,推荐,Netflix,YouTube | `templates/video-streaming/README.md` |
| template:realtime-chat | 经典/通用 | 实时通讯 | Realtime Chat | 长连接,消息时序,离线投递,群扩散,WhatsApp,Slack,微信 | `templates/realtime-chat/README.md` |
| template:url-shortener | 经典/通用 | 短链接服务 | URL Shortener | 读多写少,缓存,301,302,分布式唯一ID,Bitly,TinyURL,t.co | `templates/url-shortener/README.md` |
| template:payment-system | 经典/通用 | 支付系统 | Payment System | 幂等,复式记账,对账,状态机,Stripe,支付宝,PayPal | `templates/payment-system/README.md` |
| template:search-engine | 经典/通用 | 搜索引擎 | Search Engine | 倒排索引,相关性排序,召回,精排,分片,Google,Elasticsearch | `templates/search-engine/README.md` |
| template:ride-hailing | 经典/通用 | 网约车/出行 | Ride-Hailing | 地理空间索引,实时位置,供需匹配,动态定价,Uber,滴滴,DiDi | `templates/ride-hailing/README.md` |
| template:collaborative-doc | 经典/通用 | 实时协同文档 | Collaborative Doc | OT,CRDT,单writer,操作日志,离线同步,Google Docs,Figma | `templates/collaborative-doc/README.md` |
| template:cloud-storage | 经典/通用 | 云存储/网盘 | Cloud Storage | 文件分块,内容寻址去重,增量同步,断点续传,Dropbox,iCloud | `templates/cloud-storage/README.md` |
| template:notification-system | 经典/通用 | 通知/推送系统 | Notification System | 多渠道扇出,去重,限频,异步重试,优先级,Novu,FCM,APNs | `templates/notification-system/README.md` |
| template:online-ticketing | 经典/通用 | 在线票务/抢票 | Online Ticketing | 虚拟等候室,原子扣减,防超卖,锁座,TTL,Ticketmaster,12306 | `templates/online-ticketing/README.md` |
| template:ai-gateway | AI 原生 | AI 网关/中转 | AI Gateway | 统一接口,计费限流,负载均衡,故障转移,缓存,One API,LiteLLM,Portkey | `templates/ai-gateway/README.md` |
| template:rag-knowledge-base | AI 原生 | RAG 知识库 | RAG Knowledge Base | 切块,向量检索,混合检索,重排,引用溯源,RAGFlow,LlamaIndex,Dify | `templates/rag-knowledge-base/README.md` |
| template:ai-agent-platform | AI 原生 | AI Agent 平台/工作流 | AI Agent Platform | 行动循环,工具沙箱,记忆,可控兜底,Dify,Coze,LangGraph | `templates/ai-agent-platform/README.md` |
| template:inference-serving | AI 原生 | 模型推理服务 | Inference Serving | 连续批处理,分页KV缓存,量化,vLLM,SGLang,Triton | `templates/inference-serving/README.md` |
| template:vector-database | AI 原生 | 向量数据库 | Vector Database | ANN,近似最近邻,HNSW,IVF,召回,延迟,Milvus,Qdrant,pgvector | `templates/vector-database/README.md` |
| template:claude-code | AI 编码/Agent | Claude Code | Claude Code | 本地优先,编码agent,子代理,钩子,技能,MCP,双层权限,OS沙箱,上下文压缩,Anthropic | `templates/claude-code/README.md` |
| template:codex | AI 编码/Agent | OpenAI Codex | OpenAI Codex | 本地CLI,云端异步沙箱,沙箱,审批,防注入,自动开PR,Codex CLI | `templates/codex/README.md` |
| template:openclaw | AI 编码/Agent | OpenClaw(龙虾) | OpenClaw | 自托管,gateway,聊天即UI,心跳,cron,可插拔harness,记忆纯文本,Clawdbot | `templates/openclaw/README.md` |
| template:hermes | AI 编码/Agent | Hermes | Hermes | 常驻,自我成长,FTS5,持久记忆,自动沉淀技能,cron,多渠道,Nous Research | `templates/hermes/README.md` |
| template:system-prompt-architecture | 系统提示词 | 系统提示词架构 | System Prompt Architecture | 分层Agent OS,决策树路由,Skills外化,合规,运行时注入,ChatGPT,Gemini,Grok,Cursor | `templates/system-prompt-architecture/README.md` |
| template:embedded-device | 工业/嵌入式 | 嵌入式设备固件 | Embedded Device Firmware | HAL分层,状态机,看门狗,A/B双分区OTA,Zephyr,FreeRTOS,智能门锁 | `templates/embedded-device/README.md` |
| template:iot-platform | 工业/嵌入式 | IoT 设备平台 | IoT Device Platform | 百万长连接,一机一密,设备影子,灰度OTA,AWS IoT Core,Tuya,EMQX | `templates/iot-platform/README.md` |
| template:industrial-edge | 工业/嵌入式 | 工业边缘网关 | Industrial Edge | 协议归一,边缘自治,OT/IT隔离,Purdue,受控反向控制,EdgeX,OPC UA,SCADA | `templates/industrial-edge/README.md` |
| template:automotive-ee | 工业/嵌入式 | 车载电子电气 | Automotive E/E | ASIL隔离,CAN,车载以太网,整车OTA,影子模式,openpilot,AUTOSAR,特斯拉 | `templates/automotive-ee/README.md` |
| template:robotics | 工业/嵌入式 | 机器人系统 | Robotics System | 感知,规划,控制频率分层,安全旁路,录制回放,车队管理,ROS 2,PX4 | `templates/robotics/README.md` |
| template:ai-native-organization | 专题入口 | AI 原生组织专题入口 | AI-native Organization Index | 组织,流程,AI原生,35-40导读 | `templates/ai-native-organization/README.md` |

英文镜像：同一路径加 `en/` 前缀（`en/templates/<slug>/README.md`）。

## 案例 cases/（6 个）

案例读法：起始架构为何合理 → 哪个量化信号逼它升级 → 新架构选了什么、放弃了什么。

| id | 中文标题 | 英文标题 | 关键词 | 路径 |
| --- | --- | --- | --- | --- |
| case:stararena-ticketing | StarArena 演唱会抢票 | StarArena: concert ticketing | 有限库存,虚拟等候室,锁座,支付状态机,对账补偿,在线票务,电商,支付 | `cases/stararena-ticketing/README.md` |
| case:patchdesk-saas | PatchDesk 轻量工单 SaaS | PatchDesk: lightweight ticketing SaaS | 模块化单体,多租户隔离,RBAC,Outbox,异步通知,搜索报表演进,Web,SaaS | `cases/patchdesk-saas/README.md` |
| case:documind-rag | DocuMind 企业 RAG 知识库 | DocuMind: enterprise RAG | 入库,切块,混合检索,Graph RAG,重排,引用,权限,提示注入,评测,RAG,AI对话,向量库 | `cases/documind-rag/README.md` |
| case:syncroom-collaboration | SyncRoom 实时协同工作台 | SyncRoom: realtime collaboration | 长连接,服务端序号,离线补齐,多端同步,OT,CRDT,Presence,通知降级,实时通讯,协同文档 | `cases/syncroom-collaboration/README.md` |
| case:feedstream-content | FeedStream 内容分发 | FeedStream: content distribution | 推拉混合,大V扇出,时间线收件箱,推荐排序,搜索索引,转码,CDN,审核召回,社交Feed,视频 | `cases/feedstream-content/README.md` |
| case:codepilot-agent | CodePilot 编码 Agent 平台 | CodePilot: coding Agent | 工具调用,权限网关,沙箱,人工审批,上下文压缩,检查点,子代理,trace,eval,AI Agent,Codex,Claude Code | `cases/codepilot-agent/README.md` |
