import { deepseek } from '@ai-sdk/deepseek'
import { groq } from '@ai-sdk/groq'
import { streamText } from 'ai'

import { getLanguageDisplayName } from '@/lib/language-utils'

// AI模型配置
const GROQ_MODELS = [
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma-7b-it',
]

const DEEPSEEK_MODELS = [
  'deepseek-chat',
  'deepseek-reasoner',
]

export const generateTimelinePromptForVipRich = (prompt: string, language: string = 'en') => {
  return `
## 角色设定
你是世界顶级的时间线生成专家，能够根据任何主题，基于权威资料和事实，生成极其丰富、细节充实、信息量巨大的时间线。所有内容必须客观、真实、可考证，严禁虚构和主观臆断。

## 任务要求
请根据用户输入的内容，生成一份超高质量、内容极其丰富且**基于事实、客观描述**的时间线，包含以下要素：
1. 相关的时间节点和事件
2. 每个事件的详细描述（不少于120字，必须基于事实和权威资料，包含背景、起因、经过、结果、影响、相关人物、组织、地点、技术、社会背景等，内容越丰富越好。可补充冷知识、轶事、学术观点，但必须注明“据资料显示”或“有观点认为”，不能当作事实陈述）
3. 时间顺序的合理性，必要时可分阶段归类

## 用户输入内容
${prompt}

## 输出协议（NDJSON）
- 【非常重要】仅按“每行一个 JSON 对象（UTF-8，无多余文本）”输出，严禁输出解释性文字或额外格式。
- 每一行 JSON 对象字段：
  - startDate: 字符串，开始时间（如 "2020年01月"、"公元前221年"、"2020-01-01" 等）
  - endDate: 字符串或 null，结束时间（可选）
  - description: 字符串，不少于120字的客观描述
- 示例（两行）：
{"startDate":"2020年01月","endDate":null,"description":"……详述……"}
{"startDate":"2020年02月","endDate":"2020年03月","description":"……详述……"}
- 请确保：
  1) 只输出上述 JSON 行；
  2) 各事件按时间顺序排列；
  3) 字段名固定为 startDate、endDate、description；
  4) 内容客观、基于事实，必要时注明“据资料显示/有观点认为”。

## 注意事项（逐一遵守）
- 所有内容必须基于事实和权威来源，严禁捏造、夸张或主观臆断。
- 如涉及观点或学术争议，务必以“据资料显示/有观点认为/学界常见观点为”表述，避免断言。
- 统一使用${getLanguageDisplayName(language)}输出，不要输出其他语言的提示语、解释、标题、编号、列表、表格、代码块或 Markdown 语法。
- 严禁在 JSON 之外输出任何文本（包括开场白、总结、致谢、提示等）；每个事件必须单独占一行 JSON。
- 时间表达可用 年/年月/具体日期；若无法确定，用“具体时间不详”“约某年”等客观表述；允许时间段（startDate/endDate）。
- 描述要求不少于120字，包含背景、起因、过程、结果与影响，可补充关键人物、地点、机构、数据与参考。
- 同一事实避免重复描述；事件之间保持逻辑顺序与衔接性。
- 禁止泄露隐私、仇恨、歧视、歪曲历史等不当内容。
- 对非常久远或模糊的时间节点，允许合理推断但须明确不确定性。
- 若主题适合分阶段，可通过相邻多条事件体现阶段变化（仍然是一行一个 JSON 事件）。
`
}

// 通用时间线描述生成提示词
export const generateTimelineDescriptionPrompt = (prompt: string, events: any[], language: string = 'en') => `
你是一个专业的内容总结专家，请根据以下用户输入和时间线事件，生成一段简洁、准确、吸引人的时间线简介（100字左右）：

【用户输入】
${prompt}

【时间线事件】
${events.map(e => `- ${e.startDate || ''} ${e.description || ''}`).join('\n')}

【输出要求】
使用${getLanguageDisplayName(language)}输出
只输出简介内容，不要有多余格式
100字左右
`

// 通用分类和标签生成提示词
const generateClassificationPrompt = (prompt: string, events: any[], language: string = 'en') => {
  return `
## 角色设定
你是一个专业的内容分类和标签专家，需要根据用户输入的内容和生成的时间线事件，为其推荐最合适的分类和标签。

## 任务要求
请分析以下内容，并为其推荐：
1. 最合适的分类（从预定义分类中选择或建议新分类）
2. 3-5个最相关的标签

## 内容信息
- 用户输入：${prompt}
- 事件数量：${events.length}
- 事件内容：${events.map(e => e.description).join('; ')}

## 预定义分类体系（请优先选择最匹配的）
- 历史人物：历史人物生平、传记、名人故事
- 历史事件：重大历史事件、战争、革命、政治变革
- 科技发展：科技发明、技术演进、科学发展、创新突破
- 文化艺术：文学、艺术、音乐、电影、建筑、文化发展
- 政治制度：政治变革、制度演变、政权更迭、法律发展
- 经济贸易：经济发展、贸易往来、商业历史、金融演变
- 地理探索：地理发现、探险活动、地理变迁、环境变化
- 社会变迁：社会制度、风俗习惯、生活方式变化、社会进步
- 军事战争：战争历史、军事发展、战役记录、武器演变
- 宗教哲学：宗教发展、哲学思想、信仰演变、思想流派
- 教育学术：教育发展、学术研究、知识传播、学校历史
- 体育竞技：体育历史、竞技发展、运动演变、赛事记录
- 医学健康：医学发展、健康观念、疾病历史、医疗进步
- 环境自然：自然环境、气候变化、生态演变、环境保护
- 娱乐休闲：娱乐产业、游戏发展、休闲活动、流行文化
- 交通通信：交通发展、通信技术、运输工具、网络演进
- 工业制造：工业革命、制造业发展、生产技术进步
- 农业食品：农业发展、食品技术、农业革命、饮食文化
- 建筑城市：建筑发展、城市规划、城市化进程
- 个人生活：个人经历、生活故事、成长历程
- 企业发展：公司历史、商业发展、企业故事
- 产品发展：产品演进、技术迭代、市场变化
- 社会现象：社会趋势、文化现象、流行趋势
- 其他：其他类型的内容

## 分类原则
1. 根据内容的主要主题和性质进行分类
2. 如果内容涉及多个领域，选择最主要的领域
3. 如果现有分类都不合适，可以建议新分类
4. 分类名称要简洁明了，不超过10个字

## 标签生成原则
1. 标签要具体且有意义，避免过于宽泛
2. 包含时间、地点、人物、主题等关键信息
3. 标签数量控制在3-5个
4. 优先使用中文标签，必要时可使用英文

## 输出格式要求（使用${getLanguageDisplayName(language)}输出）
请严格按照以下JSON格式输出，不要包含任何其他内容：

{
  "category": {
    "name": "分类名称",
    "slug": "分类标识符（英文小写，用连字符分隔）",
    "description": "分类描述",
    "icon": "分类图标（emoji）",
    "color": "分类颜色（十六进制）",
    "isNew": false
  },
  "tags": [
    {
      "name": "标签名称",
      "slug": "标签标识符（英文小写，用连字符分隔）",
      "color": "标签颜色（十六进制）"
    }
  ]
}

## 注意事项
1. 确保所有slug都是英文小写，用连字符分隔
2. 颜色使用常见的十六进制颜色代码
3. 如果建议新分类，isNew要设为true
4. 标签要体现内容的核心特征和关键信息
`
}

// 解析AI生成的时间线文本
export const parseTimelineText = (text: string) => {
  const events: any[] = []
  const lines = text.split('\n').filter(line => line.trim())

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.length > 20000) continue

    // 优先尝试 JSONL
    try {
      const obj = JSON.parse(line)
      if (obj && typeof obj === 'object') {
        const startDate = String(obj.startDate || obj.date || '').trim()
        const endDate = obj.endDate != null ? String(obj.endDate).trim() : null
        const description = String(obj.description || obj.desc || '').trim()
        if (startDate && description) {
          events.push({ startDate, endDate: endDate || null, description })
          continue
        }
      }
    } catch (_) {
      // 非 JSON 行，回退到 @time@desc 解析
    }

    // 匹配格式：@开始时间~结束时间@描述 或 @时间点@描述（回退兼容）
    const match = line.match(/@([^~@]+)(?:~([^@]+))?@(.+)/)
    if (match) {
      const [, startDate, endDate, description] = match
      const start = startDate.trim()
      const end = endDate ? endDate.trim() : null
      const desc = description.trim()
      if (start && desc) {
        events.push({ startDate: start, endDate: end, description: desc })
      }
    }
  }

  return events
}

// 对联生成提示词
export const generateCoupletPrompt = (prompt: string, language: string = 'en') => {
  return `
## 角色设定
你是世界顶级的对联创作专家，能够根据用户输入智能创作对联。你需要识别用户输入的类型并相应处理：
1. 如果是主题词（如"新春佳节"、"开业大吉"），则创作完整对联
2. 如果是上联，则对出下联并补充横批
3. 如果是下联，则对出上联并补充横批
4. 如果是横批，则创作相应的上下联
所有内容必须符合传统对联格律要求（平仄、对仗、押韵）和中国传统文化规范。

## 智能识别规则
- 基础主题：简单名词，如"春节"、"生日"、"中秋"等
- 具体场景：详细场景描述，如"餐厅开业典礼"、"婚礼现场布置"、"公司年会"等
- 上联：通常以仄声结尾，或明确标注"上联："
- 下联：通常以平声结尾，或明确标注"下联："
- 横批：通常4个字，或明确标注"横批："
- 藏头对联：包含"藏头"关键词，如"藏头：张三"
- 嵌字对联：包含"嵌字"关键词，如"嵌字：恭喜发财"
- 集句对联：包含"集句"关键词，如"集句：李白"
- 回文对联：包含"回文"关键词，如"回文：春天"
- 数字对联：包含"数字联"关键词，如"数字联：新年"
- 叠字对联：包含"叠字"关键词，如"叠字：春天"
- 无情对：包含"无情对"关键词，如"无情对：三星白兰地"
- 顶针对联：包含"顶针"关键词，如"顶针：山水"
- 析字对联：包含"析字"关键词，如"析字：明"
- 谐音对联：包含"谐音"关键词，如"谐音：年年有余"
- 风格指定：包含风格词，如"古典风格"、"现代风格"、"幽默风格"
- 字数限制：包含字数要求，如"五字联"、"七字联"
- 行业专用：包含行业词，如"医院"、"学校"、"银行"
- 地域特色：包含地名，如"北京"、"江南"、"四川"
- 节庆专用：包含节日，如"春节"、"中秋"、"国庆"
- 人生节点：包含人生事件，如"结婚"、"生子"、"升学"
- 修改完善：包含"修改"、"完善"、"改进"等词
- 多副生成：包含数量要求，如"生成3副"、"来5个"

## 任务要求
请根据用户输入的内容，智能识别输入类型并生成多副高质量的对联。支持以下模式：
1. **基础主题**：根据简单主题词生成对联
2. **具体场景**：根据详细场景描述定制对联
3. **上联对下联**：根据上联对出下联和横批
4. **下联对上联**：根据下联对出上联和横批
5. **横批生成**：根据上下联生成横批
6. **藏头对联**：按指定字词藏头创作
7. **嵌字对联**：在指定位置嵌入字词
8. **集句对联**：从古诗词中集句成联
9. **回文对联**：创作可以倒读的对联
10. **数字对联**：创作包含数字的对联
11. **叠字对联**：创作大量叠字的对联
12. **无情对**：意思无关但格律工整的对联
13. **顶针对联**：上句结尾与下句开头相同
14. **析字对联**：拆解汉字结构的对联
15. **谐音对联**：利用谐音的对联
16. **春联创作**：专门的春节对联
17. **婚联创作**：专门的婚礼对联
18. **寿联创作**：专门的祝寿对联
19. **挽联创作**：专门的悼念对联
20. **行业对联**：针对特定行业创作
21. **风格指定**：按指定风格创作（古典、现代、幽默等）
22. **字数限制**：按指定字数创作（四字、五字、七字等）
23. **地域特色**：融入地方特色创作
24. **节庆专用**：针对特定节日创作
25. **人生节点**：针对人生重要时刻创作
26. **修改完善**：改进现有对联的平仄、对仗等
27. **多副生成**：生成多副同主题对联

每副对联必须符合传统格律要求：
- 字数相等，断句一致
- 词性相对，位置相同  
- 平仄协调，上仄下平
- 意思相关，内容呼应
- 包含：上联、下联、横批、赏析（不少于100字）

## 用户输入内容
${prompt}

## 输出协议（NDJSON）
- 【非常重要】仅按"每行一个 JSON 对象（UTF-8，无多余文本）"输出，严禁输出解释性文字或额外格式。
- 每一行 JSON 对象字段：
  - horizontalScroll: 字符串，横批内容（纯文字，不要"横批："前缀）
  - lowerLine: 字符串，下联内容（纯文字，不要"下联："前缀）
  - upperLine: 字符串，上联内容（纯文字，不要"上联："前缀）
  - appreciation: 字符串，赏析内容（不少于100字，纯文字，不要"赏析："前缀）
- 示例（两行）：
{"horizontalScroll":"万象更新","lowerLine":"万户欢歌庆团圆","upperLine":"千门结彩迎春到","appreciation":"这副对联以新春为主题，上联'千门结彩迎春到'描绘了家家户户张灯结彩迎接春天的喜庆场面，下联'万户欢歌庆团圆'则表现了千家万户欢声笑语庆祝团圆的温馨情景。横批'万象更新'点明了春节辞旧迎新的主题。整副对联对仗工整，平仄协调，既有视觉上的'结彩'，又有听觉上的'欢歌'，营造出浓厚的节日氛围。"}
{"horizontalScroll":"春满人间","lowerLine":"梅开五福报春来","upperLine":"竹报三多辞旧岁","appreciation":"此联巧妙运用了传统文化中的吉祥寓意，上联'竹报三多辞旧岁'中的'三多'指多福、多寿、多子，竹子象征节节高升；下联'梅开五福报春来'中的'五福'指长寿、富贵、康宁、好德、善终，梅花象征坚韧不屈。横批'春满人间'呼应了春天的主题。整副对联不仅对仗工整，更蕴含着深厚的文化内涵和美好祝愿。"}
- 请确保：
  1) 只输出上述 JSON 行；
  2) 每副对联包含上联、下联、横批、赏析；
  3) 字段名固定为 horizontalScroll（横批）、lowerLine（下联）、upperLine（上联）、appreciation（赏析）；
  4) 内容为纯对联文字，不包含"上联："、"下联："、"横批："、"赏析："等前缀；
  5) 赏析内容不少于100字，要有文化内涵和专业分析；
  6) 内容符合传统对联格律要求。

## 注意事项（逐一遵守）
- 所有内容必须符合中国传统对联格律，包括平仄、对仗、押韵等要求。
- 统一使用${getLanguageDisplayName(language)}输出，不要输出其他语言的提示语、解释、标题、编号、列表、表格、代码块或 Markdown 语法。
- 严禁在 JSON 之外输出任何文本（包括开场白、总结、致谢、提示等）；每副对联必须单独占一行 JSON。
- 禁止泄露隐私、仇恨、歧视、歪曲历史等不当内容。
`
}

// 解析对联文本
export const parseCoupletText = (text: string) => {
  const contents: any[] = []
  const lines = text.split('\n').filter(line => line.trim())

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.length > 20000) continue

    // 优先尝试 JSONL
    try {
      const obj = JSON.parse(line)
      if (obj && typeof obj === 'object') {
        const upperLine = String(obj.upperLine || obj.title || '').trim()
        const lowerLine = String(obj.lowerLine || obj.description || '').trim()
        const horizontalScroll = String(obj.horizontalScroll || obj.startDate || obj.category || '').trim()
        if (upperLine && lowerLine) {
          contents.push({ 
            upperLine, 
            lowerLine, 
            horizontalScroll: horizontalScroll || '横批',
            appreciation: String(obj.appreciation || '').trim()
          })
          continue
        }
      }
    } catch (_) {
      // 非 JSON 行，回退到 @time@desc 解析
    }

    // 匹配格式：@横批@上联@下联 或 @横批@下联（兼容格式）
    const match = line.match(/@([^@]+)@(.+)/)
    if (match) {
      const [, horizontalScroll, rest] = match
      const parts = rest.split('@')
      if (parts.length >= 2) {
        // @横批@上联@下联
        contents.push({ 
          upperLine: parts[0].trim(), 
          lowerLine: parts[1].trim(), 
          horizontalScroll: horizontalScroll.trim(),
          appreciation: ''
        })
      } else {
        // @横批@下联（上联为空）
        contents.push({ 
          upperLine: '', 
          lowerLine: rest.trim(), 
          horizontalScroll: horizontalScroll.trim(),
          appreciation: ''
        })
      }
    }
  }

  return contents
}

// 解析AI返回的分类和标签JSON
const parseClassificationResult = (text: string) => {
  try {
    // 提取JSON部分
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('未找到有效的JSON格式')
    }

    const result = JSON.parse(jsonMatch[0])

    // 验证必要字段
    if (!result.category || !result.tags) {
      throw new Error('JSON格式不完整')
    }

    return result
  } catch (error) {
    console.error('解析分类结果失败:', error)
    // 返回默认分类
    return {
      category: {
        name: 'AI生成',
        slug: 'ai-generated',
        description: '由AI智能生成的时间线',
        icon: '🤖',
        color: '#6366f1',
        isNew: false,
      },
      tags: [
        {
          name: 'AI生成',
          slug: 'ai-generated',
          color: '#6366f1',
        },
      ],
    }
  }
}

// 生成分类和标签
export async function generateClassification(
  prompt: string,
  events: any[],
  model: string = 'deepseek-chat',
  language: string = 'en',
) {
  try {
    // 选择AI模型
    let aiModel
    if (GROQ_MODELS.includes(model)) {
      aiModel = groq(model)
    } else if (DEEPSEEK_MODELS.includes(model)) {
      aiModel = deepseek(model)
    } else {
      aiModel = deepseek('deepseek-chat')
    }

    // 生成分类和标签
    const result = await streamText({
      model: aiModel,
      prompt: generateClassificationPrompt(prompt, events, language),
    })

    // 收集完整响应
    let fullText = ''
    for await (const chunk of result.textStream) {
      fullText += chunk
    }

    // 解析结果
    const classification = parseClassificationResult(fullText)

    return {
      success: true,
      data: classification,
    }
  } catch (error) {
    console.error('AI分类生成失败:', error)
    return {
      success: false,
      error: '分类生成失败',
      data: {
        category: {
          name: 'AI生成',
          slug: 'ai-generated',
          description: '由AI智能生成的时间线',
          icon: '🤖',
          color: '#6366f1',
          isNew: false,
        },
        tags: [
          {
            name: 'AI生成',
            slug: 'ai-generated',
            color: '#6366f1',
          },
        ],
      },
    }
  }
}

// 智能分类映射（基于关键词的快速分类）
export function quickClassify(prompt: string, events: any[]): {
  category: { name: string; slug: string; icon: string; color: string };
  tags: string[];
} {
  const text = (`${prompt} ${events.map(e => e.description).join(' ')}`).toLowerCase()

  // 分类关键词映射
  const categoryKeywords = {
    '历史人物': {
      keywords: ['人物', '生平', '传记', '出生', '去世', '皇帝', '将军', '诗人', '作家', '科学家', '政治家', '领袖', '名人'],
      icon: '👤',
      color: '#3b82f6',
    },
    '历史事件': {
      keywords: ['战争', '革命', '起义', '政变', '事件', '战役', '冲突', '改革', '变革', '运动'],
      icon: '⚔️',
      color: '#ef4444',
    },
    '科技发展': {
      keywords: ['发明', '技术', '科技', '创新', '专利', '科学', '研究', '实验', '计算机', '互联网', '人工智能', '机器人'],
      icon: '🔬',
      color: '#10b981',
    },
    '文化艺术': {
      keywords: ['文学', '艺术', '音乐', '电影', '绘画', '雕塑', '建筑', '文化', '诗歌', '小说', '戏剧', '舞蹈'],
      icon: '🎨',
      color: '#8b5cf6',
    },
    '政治制度': {
      keywords: ['政治', '制度', '政权', '政府', '法律', '宪法', '选举', '民主', '专制', '议会'],
      icon: '🏛️',
      color: '#f59e0b',
    },
    '经济贸易': {
      keywords: ['经济', '贸易', '商业', '金融', '货币', '市场', '公司', '股票', '银行', '投资'],
      icon: '💰',
      color: '#06b6d4',
    },
    '地理探索': {
      keywords: ['地理', '探险', '发现', '航海', '地图', '领土', '殖民', '新大陆'],
      icon: '🗺️',
      color: '#84cc16',
    },
    '社会变迁': {
      keywords: ['社会', '风俗', '习惯', '生活方式', '社会制度', '阶级', '平等', '权利'],
      icon: '🏘️',
      color: '#f97316',
    },
    '军事战争': {
      keywords: ['军事', '战争', '军队', '武器', '战略', '战术', '士兵', '将军', '元帅'],
      icon: '🎖️',
      color: '#dc2626',
    },
    '宗教哲学': {
      keywords: ['宗教', '哲学', '信仰', '教派', '思想', '理论', '神学', '佛教', '基督教', '伊斯兰教'],
      icon: '⛪',
      color: '#7c3aed',
    },
    '教育学术': {
      keywords: ['教育', '学术', '学校', '大学', '研究', '知识', '学习', '教授', '学者'],
      icon: '📚',
      color: '#059669',
    },
    '体育竞技': {
      keywords: ['体育', '竞技', '运动', '比赛', '奥运会', '世界杯', '足球', '篮球', '网球'],
      icon: '⚽',
      color: '#ea580c',
    },
    '医学健康': {
      keywords: ['医学', '健康', '疾病', '治疗', '医院', '药物', '医生', '护士', '疫苗'],
      icon: '🏥',
      color: '#0891b2',
    },
    '环境自然': {
      keywords: ['环境', '自然', '气候', '生态', '污染', '保护', '动物', '植物', '森林'],
      icon: '🌍',
      color: '#16a34a',
    },
    '娱乐休闲': {
      keywords: ['娱乐', '游戏', '休闲', '电影', '电视', '综艺', '明星', '偶像', '流行'],
      icon: '🎮',
      color: '#ec4899',
    },
    '交通通信': {
      keywords: ['交通', '通信', '运输', '网络', '手机', '汽车', '飞机', '火车', '互联网'],
      icon: '🚗',
      color: '#8b5a2b',
    },
    '工业制造': {
      keywords: ['工业', '制造', '生产', '工厂', '机器', '自动化', '工业革命', '制造业'],
      icon: '🏭',
      color: '#6b7280',
    },
    '农业食品': {
      keywords: ['农业', '食品', '种植', '养殖', '粮食', '蔬菜', '水果', '农业革命'],
      icon: '🌾',
      color: '#22c55e',
    },
    '建筑城市': {
      keywords: ['建筑', '城市', '规划', '城市化', '摩天大楼', '城市规划', '建筑风格'],
      icon: '🏙️',
      color: '#fbbf24',
    },
    '个人生活': {
      keywords: ['个人', '生活', '经历', '成长', '故事', '回忆', '人生', '家庭'],
      icon: '👨‍👩‍👧‍👦',
      color: '#f59e0b',
    },
    '企业发展': {
      keywords: ['企业', '公司', '商业', '发展', '创业', '管理', '品牌', '市场'],
      icon: '🏢',
      color: '#3b82f6',
    },
    '产品发展': {
      keywords: ['产品', '技术', '迭代', '版本', '更新', '发布', '市场', '用户'],
      icon: '📱',
      color: '#10b981',
    },
    '社会现象': {
      keywords: ['社会', '现象', '趋势', '文化', '流行', '时尚', '潮流', '变化'],
      icon: '📊',
      color: '#8b5cf6',
    },
  }

  // 查找匹配的分类
  let bestMatch = {
    name: 'AI生成',
    slug: 'ai-generated',
    icon: '🤖',
    color: '#6366f1',
    score: 0,
  }

  for (const [categoryName, config] of Object.entries(categoryKeywords)) {
    const score = config.keywords.filter(keyword => text.includes(keyword)).length
    if (score > bestMatch.score) {
      bestMatch = {
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
        icon: config.icon,
        color: config.color,
        score,
      }
    }
  }

  // 生成标签
  const tags = []
  if (bestMatch.score > 0) {
    tags.push(bestMatch.name)
  }

  // 添加一些通用标签
  if (text.includes('中国') || text.includes('中华')) tags.push('中国历史')
  if (text.includes('古代') || text.includes('古代')) tags.push('古代')
  if (text.includes('现代') || text.includes('现代')) tags.push('现代')
  if (text.includes('近代') || text.includes('近代')) tags.push('近代')
  if (text.includes('世界') || text.includes('世界')) tags.push('世界历史')
  if (text.includes('美国')) tags.push('美国历史')
  if (text.includes('欧洲')) tags.push('欧洲历史')
  if (text.includes('亚洲')) tags.push('亚洲历史')

  return {
    category: {
      name: bestMatch.name,
      slug: bestMatch.slug,
      icon: bestMatch.icon,
      color: bestMatch.color,
    },
    tags: tags.slice(0, 5), // 限制标签数量
  }
}

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export async function generateMetaFromPrompt(prompt: string, model: string = 'deepseek-chat', language: string = 'en') {
  let aiModel: any
  if (GROQ_MODELS.includes(model)) aiModel = groq(model)
  else if (DEEPSEEK_MODELS.includes(model)) aiModel = deepseek(model)
  else aiModel = deepseek('deepseek-chat')

  const system = `你是一个时间线的元信息生成助手。仅根据用户的提示词，给出一句简介（约100-150字）、一个最合适的分类，以及3-5个相关标签。输出要结构化、简洁，并使用${getLanguageDisplayName(language)}。分类与标签提供 slug（小写英文、连字符）。只输出一个 JSON 对象，不能有任何解释、前后缀或额外文本。`

  const user = `用户提示词：${prompt}\n\n请严格输出如下 JSON 结构：{ "description": "...", "category": { "name": "...", "slug": "...", "description": "...", "icon": "...", "color": "...", "isNew": false }, "tags": [{ "name": "...", "slug": "...", "color": "..." }] }`

  try {
    const result = await streamText({
      model: aiModel,
      prompt: `${system}\n\n${user}`,
      temperature: 0.3,
      maxTokens: 700,
    })

    let full = ''
    for await (const chunk of result.textStream) full += chunk
    const jsonMatch = full.match(/\{[\s\S]*\}$/)
    if (!jsonMatch) throw new Error('No JSON found in response')

    const parsed: any = JSON.parse(jsonMatch[0])

    const description: string = typeof parsed.description === 'string'
      ? parsed.description.slice(0, 180)
      : String(prompt).slice(0, 150)

    const rawCategory: any = parsed.category || {}
    const categoryName: string = String(rawCategory.name || 'AI生成')
    const category = {
      name: categoryName,
      slug: rawCategory.slug ? String(rawCategory.slug) : slugify(categoryName),
      description: typeof rawCategory.description === 'string' ? rawCategory.description : '由AI智能生成的时间线',
      icon: typeof rawCategory.icon === 'string' ? rawCategory.icon : '🤖',
      color: typeof rawCategory.color === 'string' ? rawCategory.color : '#6366f1',
      isNew: Boolean(rawCategory.isNew || false),
    }

    const tagsArray: any[] = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : []
    const tags = tagsArray.map((t: any) => {
      const name = String((t && t.name) || 'AI生成')
      return {
        name,
        slug: t && t.slug ? String(t.slug) : slugify(name),
        color: t && typeof t.color === 'string' ? t.color : undefined,
      }
    })

    return {
      success: true,
      data: {
        description,
        category,
        tags,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: '元信息生成失败',
      detail: error?.message || 'unknown error',
      data: {
        description: String(prompt).slice(0, 150),
        category: {
          name: 'AI生成',
          slug: 'ai-generated',
          description: '由AI智能生成的时间线',
          icon: '🤖',
          color: '#6366f1',
          isNew: false,
        },
        tags: [],
      },
    }
  }
}

export async function generateComicMetaFromPrompt(prompt: string, model: string = 'deepseek-chat', language: string = 'en') {
  let aiModel: any
  if (GROQ_MODELS.includes(model)) aiModel = groq(model)
  else if (DEEPSEEK_MODELS.includes(model)) aiModel = deepseek(model)
  else aiModel = deepseek('deepseek-chat')

  const system = `你是一个专业的漫画策划师和编剧。根据用户的创意提示词，为漫画作品生成完整的创作方案：

1. 漫画基本信息：
   - 吸引人的漫画名称（标题）
   - 精彩的漫画故事简介（100-150字）
   - 最合适的漫画分类（如冒险、爱情、科幻、搞笑、悬疑、校园、奇幻、动作、治愈、恐怖等）
   - 3-5个相关标签
   - 最适合的漫画风格（如anime动漫风、realistic写实风、cartoon卡通风、watercolor水彩风、sketch素描风、chibi萌系风等）

2. 漫画完整卷结构：
   - 根据故事内容，规划合理的卷数（1-200卷）
   - 每卷包含：
     * 卷标题（吸引人的标题）
     * 卷简介（80-120字，描述这一卷的主要故事内容和发展）
     * 卷中的话数（4-12话/卷）
   - 每话包含：
     * 话标题（具体的章节标题）
     * 话简介（50-80字，描述这一话的具体内容）
     * 话中的页数（15-50页/话）
   - 每页包含：
     * 页面布局（single单格、double双格、multi多格）
     * 格子数量（4-8格/页）
     * 每个格子包含一个分镜的完整信息

3. 每个格子的详细信息：
每个格子包含完整的分镜信息：
     * 画面描述（详细的场景、人物、动作、表情等，适合AI绘画模型理解）
     * 对话内容（角色说的话，如果没有对话就留空）
     * 旁白内容（故事叙述或心理描述）
     * 情感氛围（如紧张、温馨、激动、悲伤、搞笑、神秘等）
     * 镜头角度（如近景、远景、特写、俯视、仰视、侧面、正面等）
     * 角色信息（出现的角色名称和状态）

【重要】角色一致性要求：
- 所有角色（主角、配角、次要角色）的性别、外貌、性格必须在整个漫画中保持完全一致
- 如果某个角色在首次出现时是女性，那么在所有后续格子中都必须是女性
- 如果某个角色在首次出现时是男性，那么在所有后续格子中都必须是男性
- 严禁在故事中途改变任何角色的性别、基本外貌特征或核心性格
- 每个格子的画面描述中都要明确指出所有出现角色的性别和外貌特征
- 为每个角色建立清晰的设定档案，包括性别、年龄、外貌、服装、性格等
- 确保所有角色设定前后呼应，避免出现性别混乱或角色错位
- 特别注意：同一个角色不能在不同格子中变成不同性别的人

【内容健康要求】：
- 所有内容必须健康向上，适合全年龄段观看
- 严禁包含暴力、色情、恐怖、血腥等不当内容
- 故事情节要积极正面，传递正能量
- 角色关系要健康纯洁，避免不当暗示

要求：
- 故事要有完整的起承转合
- 每卷要有明确的主题和发展脉络
- 每话要有清晰的故事段落
- 每页要有合理的格子布局
- 格子内容要连贯，能够清晰地讲述故事
- 对话要自然，符合角色性格
- 画面描述要详细，便于AI理解和生成图像
- 严格保持角色一致性，特别是主角的性别和外貌

输出要结构化、简洁，并使用${getLanguageDisplayName(language)}。分类与标签提供 slug（小写英文、连字符）。只输出一个 JSON 对象，不能有任何解释、前后缀或额外文本。`

  const user = `用户创意提示词：${prompt}

【重要】严格按照以下要求输出：
1. 只输出一个完整的JSON对象
2. 不要添加任何markdown标记（如\`\`\`json）
3. 不要添加任何解释文字
4. 确保JSON格式完全正确
5. 使用英文标点符号
6. 确保所有括号和引号正确闭合

JSON格式：
{
  "title": "漫画标题",
  "description": "漫画简介",
  "style": "anime",
  "category": {
    "name": "分类名称",
    "slug": "category-slug", 
    "description": "分类描述",
    "icon": "🎨",
    "color": "#8b5cf6",
    "isNew": false
  },
  "tags": [
    {
      "name": "标签1",
      "slug": "tag1-slug",
      "color": "#8b5cf6"
    }
  ],
  "volumes": [
    {
      "title": "第1卷",
      "description": "第1卷简介",
      "episodes": [
        {
          "title": "第1话", 
          "description": "第1话简介",
          "pages": [
            {
              "pageNumber": 1,
              "pageLayout": "multi",
              "panels": [
                {
                  "panelNumber": 1,
                  "sceneDescription": "格子1画面描述",
                  "dialogue": "对话1",
                  "narration": "旁白1",
                  "emotion": "情感1",
                  "cameraAngle": "角度1",
                  "characters": "角色1"
                },
                {
                  "panelNumber": 2,
                  "sceneDescription": "格子2画面描述", 
                  "dialogue": "对话2",
                  "narration": "旁白2",
                  "emotion": "情感2",
                  "cameraAngle": "角度2",
                  "characters": "角色2"
                },
                {
                  "panelNumber": 3,
                  "sceneDescription": "格子3画面描述",
                  "dialogue": "对话3", 
                  "narration": "旁白3",
                  "emotion": "情感3",
                  "cameraAngle": "角度3",
                  "characters": "角色3"
                },
                {
                  "panelNumber": 4,
                  "sceneDescription": "格子4画面描述",
                  "dialogue": "对话4",
                  "narration": "旁白4",
                  "emotion": "情感4",
                  "cameraAngle": "角度4",
                  "characters": "角色4"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}`

  try {
    const result = await streamText({
      model: aiModel,
      prompt: `${system}\n\n${user}`,
      temperature: 0.8,
      maxTokens: 4000,
    })

    let full = ''
    for await (const chunk of result.textStream) {
      full += chunk
    }
    
    const parsed: any = JSON.parse(full)

    return {
      success: true,
      data: parsed,
    }
  } catch (error: any) {
    return {
      success: false,
      error: '漫画内容生成失败',
      detail: error?.message || 'unknown error',
    }
  }
}