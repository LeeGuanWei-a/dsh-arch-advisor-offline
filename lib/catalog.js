// awesome-architecture catalog data (zh titles + en topics + keywords).
// Mirrors the live repo layout: tutorial/ templates/ cases/ + en/ mirrors.
export const TUT = [
  ['01-为什么先有架构思维', 'Why architecture-first thinking'],
  ['02-架构师的思考框架', "The architect's thinking framework"],
  ['03-读懂与画好架构图', 'Reading and drawing architecture diagrams'],
  ['04-十大核心架构模式', '10 core architecture patterns'],
  ['05-数据与状态', 'Data and state'],
  ['06-质量属性与取舍', 'Quality attributes and trade-offs'],
  ['07-从0到1设计一个系统', 'Designing a system from 0 to 1'],
  ['08-架构决策记录与演进', 'ADRs and evolution'],
  ['09-架构品味', 'Architectural taste'],
  ['10-分布式系统的硬道理', 'Distributed systems: the hard truths'],
  ['11-数据一致性工程', 'The engineering of data consistency'],
  ['12-为失败而设计', 'Designing for failure: resilience'],
  ['13-规模化的力学', 'The mechanics of scale'],
  ['14-演进与拆分大型系统', 'Evolving and splitting large systems'],
  ['15-组织即架构', 'Organization as architecture'],
  ['16-安全与多租户架构', 'Security and multi-tenancy'],
  ['17-大模型时代的架构判断', 'Architecting in the age of LLMs'],
  ['18-读地图用框架拆解陌生系统', 'Reading the map: deconstruct unfamiliar systems'],
  ['19-完整设计演练中等复杂度系统', 'Full design walkthrough: medium complexity'],
  ['20-演进剧本MVP到规模化', 'Evolution playbook: MVP to scale'],
  ['21-拆分与迁移实战', 'Splitting and migration in practice'],
  ['22-AI原生系统设计', 'AI-native system design'],
  ['23-规格即架构约束怎么写给AI', 'Spec as architecture: constraints for AI'],
  ['24-审查清单AI产出默认缺什么', 'Review checklist: what AI output omits by default'],
  ['25-评测驱动把够好写进架构', 'Eval-driven: bake good enough into architecture'],
  ['26-协作决策树何时vibe何时spec-first', 'Collaboration decision tree: when to vibe, when to spec-first'],
  ['27-编程语言与后端框架选型', 'Languages and backend frameworks'],
  ['28-数据库与存储选型', 'Databases and storage'],
  ['29-缓存消息队列与事件系统选型', 'Cache, queues and events'],
  ['30-API与服务通信选型', 'APIs and service communication'],
  ['31-云原生与部署平台选型', 'Cloud native and deployment'],
  ['32-可观测性与可靠性技术栈选型', 'Observability and reliability'],
  ['33-AI基础设施技术栈选型', 'AI infrastructure'],
  ['34-技术选型决策树', 'Technology selection decision tree'],
  ['35-AI原生组织架构', null],
  ['36-超级个体与超级团队', null],
  ['37-共享上下文架构', null],
  ['38-AI工作流架构', null],
  ['39-责任与治理架构', null],
  ['40-AI原生组织演进路线', null],
  ['T01-训练方案不是算法排行榜先把决策分层', 'Training plans are not an algorithm leaderboard: layer the decision first'],
  ['术语表', null],
  ['演进触发信号', null]
];

// Tutorial entries with English mirrors (chapters 01-34, plus the Txx topic series).
export const TUT_EN = new Set(['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','T01']);

// Templates: [slug, zh, en, keywords]
export const TPL = [
  ['ai-chat-product', 'AI 对话产品', 'AI Chat Product', 'LLM推理,流式输出,上下文管理,RAG,成本控制,Claude,ChatGPT'],
  ['browser-extension', '浏览器插件', 'Browser Extension', '内容脚本,后台分离,页面注入,隐私边界,变现,Honey,Grammarly'],
  ['standard-web-app', '普通网站', 'Standard Web App', '经典三层,缓存,读写分离,企业官网,博客,SaaS后台'],
  ['mobile-app', '移动 App', 'Mobile App', '离线优先,数据同步,客户端状态,推送,iOS,Android'],
  ['ecommerce-platform', '电商平台', 'E-commerce Platform', '库存,订单,支付,超卖,大促洪峰,Amazon,Shopify,淘宝'],
  ['social-feed', '社交信息流', 'Social Feed', 'Feed,拉取,推送,关注关系,热点扩散,扇出,Twitter,X,Instagram'],
  ['video-streaming', '视频流媒体', 'Video Streaming', '转码,CDN,自适应码率,推荐,Netflix,YouTube'],
  ['realtime-chat', '实时通讯', 'Realtime Chat', '长连接,消息时序,离线投递,群扩散,WhatsApp,Slack,微信'],
  ['url-shortener', '短链接服务', 'URL Shortener', '读多写少,缓存,301,302,分布式唯一ID,Bitly,TinyURL,t.co'],
  ['payment-system', '支付系统', 'Payment System', '幂等,复式记账,对账,状态机,Stripe,支付宝,PayPal'],
  ['search-engine', '搜索引擎', 'Search Engine', '倒排索引,相关性排序,召回,精排,分片,Google,Elasticsearch'],
  ['ride-hailing', '网约车/出行', 'Ride-Hailing', '地理空间索引,实时位置,供需匹配,动态定价,Uber,滴滴,DiDi'],
  ['collaborative-doc', '实时协同文档', 'Collaborative Doc', 'OT,CRDT,单writer,操作日志,离线同步,Google Docs,Figma'],
  ['cloud-storage', '云存储/网盘', 'Cloud Storage', '文件分块,内容寻址去重,增量同步,断点续传,Dropbox,iCloud'],
  ['notification-system', '通知/推送系统', 'Notification System', '多渠道扇出,去重,限频,异步重试,优先级,Novu,FCM,APNs'],
  ['online-ticketing', '在线票务/抢票', 'Online Ticketing', '虚拟等候室,原子扣减,防超卖,锁座,TTL,Ticketmaster,12306'],
  ['ai-gateway', 'AI 网关/中转', 'AI Gateway', '统一接口,计费限流,负载均衡,故障转移,缓存,One API,LiteLLM,Portkey'],
  ['rag-knowledge-base', 'RAG 知识库', 'RAG Knowledge Base', '切块,向量检索,混合检索,重排,引用溯源,RAGFlow,LlamaIndex,Dify'],
  ['ai-agent-platform', 'AI Agent 平台/工作流', 'AI Agent Platform', '行动循环,工具沙箱,记忆,可控兜底,Dify,Coze,LangGraph'],
  ['inference-serving', '模型推理服务', 'Inference Serving', '连续批处理,分页KV缓存,量化,vLLM,SGLang,Triton'],
  ['vector-database', '向量数据库', 'Vector Database', 'ANN,近似最近邻,HNSW,IVF,召回,延迟,Milvus,Qdrant,pgvector'],
  ['claude-code', 'Claude Code', 'Claude Code', '本地优先,编码agent,子代理,钩子,技能,MCP,双层权限,OS沙箱,上下文压缩,Anthropic'],
  ['codex', 'OpenAI Codex', 'OpenAI Codex', '本地CLI,云端异步沙箱,沙箱,审批,防注入,自动开PR,Codex CLI'],
  ['openclaw', 'OpenClaw(龙虾)', 'OpenClaw', '自托管,gateway,聊天即UI,心跳,cron,可插拔harness,记忆纯文本,Clawdbot'],
  ['hermes', 'Hermes', 'Hermes', '常驻,自我成长,FTS5,持久记忆,自动沉淀技能,cron,多渠道,Nous Research'],
  ['system-prompt-architecture', '系统提示词架构', 'System Prompt Architecture', '分层Agent OS,决策树路由,Skills外化,合规,运行时注入,ChatGPT,Gemini,Grok,Cursor'],
  ['embedded-device', '嵌入式设备固件', 'Embedded Device Firmware', 'HAL分层,状态机,看门狗,A/B双分区OTA,Zephyr,FreeRTOS,智能门锁'],
  ['iot-platform', 'IoT 设备平台', 'IoT Device Platform', '百万长连接,一机一密,设备影子,灰度OTA,AWS IoT Core,Tuya,EMQX'],
  ['industrial-edge', '工业边缘网关', 'Industrial Edge', '协议归一,边缘自治,OT/IT隔离,Purdue,受控反向控制,EdgeX,OPC UA,SCADA'],
  ['automotive-ee', '车载电子电气', 'Automotive E/E', 'ASIL隔离,CAN,车载以太网,整车OTA,影子模式,openpilot,AUTOSAR,特斯拉'],
  ['robotics', '机器人系统', 'Robotics System', '感知,规划,控制频率分层,安全旁路,录制回放,车队管理,ROS 2,PX4'],
  ['ai-native-organization', 'AI 原生组织专题入口', 'AI-native Organization Index', '组织,流程,AI原生,35-40导读']
];

export const TPL_GROUP = ['经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','经典/通用','AI 原生','AI 原生','AI 原生','AI 原生','AI 原生','AI 编码/Agent','AI 编码/Agent','AI 编码/Agent','AI 编码/Agent','系统提示词','工业/嵌入式','工业/嵌入式','工业/嵌入式','工业/嵌入式','工业/嵌入式','专题入口'];

export const CAS = [
  ['stararena-ticketing', 'StarArena 演唱会抢票', 'StarArena: concert ticketing', '有限库存,虚拟等候室,锁座,支付状态机,对账补偿,在线票务,电商,支付'],
  ['patchdesk-saas', 'PatchDesk 轻量工单 SaaS', 'PatchDesk: lightweight ticketing SaaS', '模块化单体,多租户隔离,RBAC,Outbox,异步通知,搜索报表演进,Web,SaaS'],
  ['documind-rag', 'DocuMind 企业 RAG 知识库', 'DocuMind: enterprise RAG', '入库,切块,混合检索,Graph RAG,重排,引用,权限,提示注入,评测,RAG,AI对话,向量库'],
  ['syncroom-collaboration', 'SyncRoom 实时协同工作台', 'SyncRoom: realtime collaboration', '长连接,服务端序号,离线补齐,多端同步,OT,CRDT,Presence,通知降级,实时通讯,协同文档'],
  ['feedstream-content', 'FeedStream 内容分发', 'FeedStream: content distribution', '推拉混合,大V扇出,时间线收件箱,推荐排序,搜索索引,转码,CDN,审核召回,社交Feed,视频'],
  ['codepilot-agent', 'CodePilot 编码 Agent 平台', 'CodePilot: coding Agent', '工具调用,权限网关,沙箱,人工审批,上下文压缩,检查点,子代理,trace,eval,AI Agent,Codex,Claude Code']
];

export const REPO = 'study8677/awesome-architecture';
export const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;
export const API = `https://api.github.com/repos/${REPO}/contents/`;
