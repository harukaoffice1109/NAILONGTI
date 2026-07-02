export const dimensions = [
  {
    "id": "N1",
    "model": "奶味模型",
    "name": "软萌度",
    "low": "冷硬、装成熟",
    "high": "软乎乎、会撒娇"
  },
  {
    "id": "N2",
    "model": "奶味模型",
    "name": "幼稚纯度",
    "low": "人间清醒",
    "high": "童心爆棚、低幼上头"
  },
  {
    "id": "N3",
    "model": "奶味模型",
    "name": "被宠需求",
    "low": "自己扛",
    "high": "想被抱抱/哄哄/偏爱"
  },
  {
    "id": "D1",
    "model": "龙性模型",
    "name": "喷火攻击性",
    "low": "忍气吞声",
    "high": "一点就炸、嘴角漏火"
  },
  {
    "id": "D2",
    "model": "龙性模型",
    "name": "护食占有欲",
    "low": "佛系分享",
    "high": "护食护人护地盘"
  },
  {
    "id": "D3",
    "model": "龙性模型",
    "name": "领地意识",
    "low": "哪都能凑合",
    "high": "我的窝谁都别碰"
  },
  {
    "id": "F1",
    "model": "发疯模型",
    "name": "抽象表达",
    "low": "正常说人话",
    "high": "语言开始变异"
  },
  {
    "id": "F2",
    "model": "发疯模型",
    "name": "情绪爆冲",
    "low": "稳定冷静",
    "high": "雷霆大笑/突然崩坏"
  },
  {
    "id": "F3",
    "model": "发疯模型",
    "name": "整活冲动",
    "low": "安静围观",
    "high": "必须上才艺/发怪图"
  },
  {
    "id": "S1",
    "model": "生存模型",
    "name": "摆烂程度",
    "low": "自律推进",
    "high": "躺平成一摊奶黄"
  },
  {
    "id": "S2",
    "model": "生存模型",
    "name": "回血方式",
    "low": "靠计划恢复",
    "high": "靠吃睡笑发呆恢复"
  },
  {
    "id": "S3",
    "model": "生存模型",
    "name": "抗压形态",
    "low": "越压越清醒",
    "high": "越压越变异"
  },
  {
    "id": "C1",
    "model": "社交模型",
    "name": "贴贴需求",
    "low": "保持距离",
    "high": "想贴贴想蹭蹭"
  },
  {
    "id": "C2",
    "model": "社交模型",
    "name": "群聊污染力",
    "low": "潜水",
    "high": "疯狂发图刷屏"
  },
  {
    "id": "C3",
    "model": "社交模型",
    "name": "边界感",
    "low": "电子围栏",
    "high": "直接钻进别人怀里"
  }
] as const;

export type DimensionId = typeof dimensions[number]["id"];
