import { deepseek } from '@ai-sdk/deepseek'
import { groq } from '@ai-sdk/groq'
import { streamText, generateText } from 'ai'

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

function getAIModel(model: string) {
  if (GROQ_MODELS.includes(model)) return groq(model)
  else if (DEEPSEEK_MODELS.includes(model)) return deepseek(model)
  else return deepseek('deepseek-chat')
}

/**
 * 生成漫画标题
 */
export async function generateComicTitle(prompt: string, model: string = 'deepseek-chat') {
  try {
    const aiModel = getAIModel(model)
    
    const systemPrompt = '你是一个专业的漫画标题创作专家。根据用户的创意，生成一个吸引人、简洁有力的漫画标题。只返回标题文本，不要任何解释。'

    const { text } = await generateText({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `创意：${prompt}\n\n请生成一个漫画标题：` }
      ],
      temperature: 0.8,
      maxTokens: 100,
    })

    return {
      success: true,
      data: { title: text.trim() }
    }
  } catch (error: any) {
    return {
      success: false,
      error: '标题生成失败',
      detail: error?.message
    }
  }
}

/**
 * 生成漫画描述
 */
export async function generateComicDescription(prompt: string, title?: string, model: string = 'deepseek-chat') {
  try {
    const aiModel = getAIModel(model)
    
    const systemPrompt = '你是一个专业的漫画简介撰写专家。根据用户的创意和标题，生成一个精彩的漫画故事简介（100-150字），包含故事背景和主要情节。只返回简介文本，不要任何解释。'

    const userPrompt = title 
      ? `创意：${prompt}\n标题：${title}\n\n请生成漫画简介：`
      : `创意：${prompt}\n\n请生成漫画简介：`

    const { text } = await generateText({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      maxTokens: 300,
    })

    return {
      success: true,
      data: { description: text.trim() }
    }
  } catch (error: any) {
    return {
      success: false,
      error: '描述生成失败',
      detail: error?.message
    }
  }
}

/**
 * 生成漫画风格
 */
export async function generateComicStyle(prompt: string, title?: string, description?: string, model: string = 'deepseek-chat') {
  try {
    const aiModel = getAIModel(model)
    
    const systemPrompt = `你是一个专业的漫画风格顾问。根据用户的创意，推荐最合适的漫画风格。

可选风格：
- anime: 日式动漫风格
- manga: 日式漫画风格
- manhwa: 韩式漫画风格
- manhua: 国风漫画风格
- realistic: 写实风格
- cartoon: 卡通风格
- chibi: Q版风格
- watercolor: 水彩风格
- sketch: 素描风格

返回纯JSON格式，不要包含任何markdown标记、代码块符号或其他格式：
{
  "name": "风格名称",
  "slug": "style-slug",
  "description": "风格描述",
  "icon": "🎨",
  "color": "#8b5cf6",
  "status": "active",
  "sortOrder": 0
}

注意：
- slug使用英文，小写，用连字符连接
- description是对该风格的简短描述
- icon是一个emoji表情符号
- color是十六进制颜色代码
- status固定为"active"
- sortOrder固定为0
- 直接返回JSON对象，不要用\`\`\`json包裹，不要任何解释文字`

    let userPrompt = `创意：${prompt}`
    if (title) userPrompt += `\n标题：${title}`
    if (description) userPrompt += `\n简介：${description}`
    userPrompt += '\n\n请推荐最合适的风格：'

    const { text } = await generateText({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 200,
    })

    const result = JSON.parse(text)

    return {
      success: true,
      data: { style: result }
    }
  } catch (error: any) {
    return {
      success: false,
      error: '风格生成失败',
      detail: error?.message
    }
  }
}

/**
 * 生成漫画分类
 */
export async function generateComicCategory(prompt: string, title?: string, description?: string, model: string = 'deepseek-chat') {
  try {
    const aiModel = getAIModel(model)
    
    const systemPrompt = `你是一个专业的漫画分类专家。根据用户的创意，推荐最合适的漫画分类。

可选分类：热血、恋爱、奇幻、科幻、悬疑、搞笑、校园、冒险、治愈、恐怖、武侠、历史、运动、美食、职场、推理

返回纯JSON格式，不要包含任何markdown标记、代码块符号或其他格式：
{
  "name": "分类名称",
  "slug": "拼音-slug",
  "description": "分类描述",
  "icon": "🎨",
  "color": "#8b5cf6",
  "status": "active",
  "sortOrder": 0
}

注意：
- slug使用拼音或英文翻译，小写，用连字符连接
- description是对该分类的简短描述
- icon是一个emoji表情符号
- color是十六进制颜色代码
- status固定为"active"
- sortOrder固定为0
- 直接返回JSON对象，不要用\`\`\`json包裹，不要任何解释文字`

    let userPrompt = `创意：${prompt}`
    if (title) userPrompt += `\n标题：${title}`
    if (description) userPrompt += `\n简介：${description}`
    userPrompt += '\n\n请推荐分类：'

    const { text } = await generateText({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 200,
    })

    const result = JSON.parse(text)

    return {
      success: true,
      data: { category: result }
    }
  } catch (error: any) {
    return {
      success: false,
      error: '分类生成失败',
      detail: error?.message
    }
  }
}

/**
 * 生成漫画标签
 */
export async function generateComicTags(prompt: string, title?: string, description?: string, category?: string, model: string = 'deepseek-chat') {
  try {
    const aiModel = getAIModel(model)
    
    const systemPrompt = `你是一个专业的漫画标签专家。根据用户的创意，生成3-5个准确反映漫画特点的标签。

标签示例：穿越、重生、系统、修仙、玄幻、都市、霸总、甜宠、虐恋、复仇、逆袭、爽文、群像、单女主、后宫、热血、搞笑、治愈、悬疑、推理、校园、青春、职场、美食、运动、机甲、末世、丧尸、异能、魔法、剑与魔法、龙族、精灵、兽人、吸血鬼、狼人、天使、恶魔等

返回纯JSON格式，不要包含任何markdown标记、代码块符号或其他格式：
{
  "tags": [
    {
      "name": "标签1",
      "slug": "pinyin1-slug",
      "description": "标签描述",
      "icon": "🏷️",
      "color": "#8b5cf6",
      "status": "active",
      "sortOrder": 0
    }
  ]
}

注意：
- slug使用拼音或英文翻译，小写，用连字符连接
- description是对该标签的简短描述
- icon是一个emoji表情符号
- color是十六进制颜色代码
- status固定为"active"
- sortOrder固定为0
- 直接返回JSON对象，不要用\`\`\`json包裹，不要任何解释文字`

    let userPrompt = `创意：${prompt}`
    if (title) userPrompt += `\n标题：${title}`
    if (description) userPrompt += `\n简介：${description}`
    if (category) userPrompt += `\n分类：${category}`
    userPrompt += '\n\n请生成标签：'

    const { text } = await generateText({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 400,
    })

    const result = JSON.parse(text)

    return {
      success: true,
      data: { tags: result.tags || [] }
    }
  } catch (error: any) {
    return {
      success: false,
      error: '标签生成失败',
      detail: error?.message
    }
  }
}

/**
 * 生成单页内容
 */
export async function generatePage(
  pageNumber: number,
  prompt: string,
  comicTitle?: string,
  comicDescription?: string,
  comicStyle?: number,
  comicCategory?: number,
  comicTags?: number[],
  episodeTitle?: string,
  episodeDescription?: string,
  previousPages?: any[],
  model: string = 'deepseek-chat'
) {
  try {
    const aiModel = getAIModel(model)
    
    const systemPrompt = `你是一个专业的漫画分镜师。根据用户创意、漫画信息和话的内容，规划一页的布局和分镜数量。

要求：
- 根据内容选择合适的页面布局（single单格/double双格/multi多格）
- 确定这一页需要多少个分镜格子（4-8格）
- 要符合漫画分镜节奏，与前面的页衔接自然
- 要符合漫画的风格、分类和标签特点

返回纯JSON格式，不要包含任何markdown标记、代码块符号或其他格式：
{
  "pageLayout": "页面布局类型（single/double/multi）",
  "panelCount": 分镜格子数量（4-8之间的整数）
}

注意：直接返回JSON对象，不要用\`\`\`json包裹，不要任何解释文字`

    let userPrompt = `用户创意：${prompt}`
    if (comicTitle) userPrompt += `\n漫画标题：${comicTitle}`
    if (comicDescription) userPrompt += `\n漫画简介：${comicDescription}`
    if (comicStyle) userPrompt += `\n漫画风格ID：${comicStyle}`
    if (comicCategory) userPrompt += `\n漫画分类ID：${comicCategory}`
    if (comicTags && comicTags.length > 0) userPrompt += `\n漫画标签ID：${comicTags.join(', ')}`
    if (episodeTitle) userPrompt += `\n话标题：${episodeTitle}`
    if (episodeDescription) userPrompt += `\n话简介：${episodeDescription}`
    if (previousPages && previousPages.length > 0) {
      userPrompt += `\n\n前面的页：\n${previousPages.map((page: any, i: number) => `第${i + 1}页：布局${page.pageLayout || ''}，${page.panelCount || 0}格`).join('\n')}`
    }
    
    userPrompt += `\n\n请规划第${pageNumber}页的布局和分镜数量：`

    const { text } = await generateText({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      maxTokens: 300,
    })

    const result = JSON.parse(text)

    return {
      success: true,
      data: {
        pageLayout: result.pageLayout || 'multi',
        panelCount: result.panelCount || 6
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: '页生成失败',
      detail: error?.message
    }
  }
}

/**
 * 生成单话的标题和描述
 */
export async function generateEpisode(
  prompt: string,
  episodeNumber: number,
  comicTitle?: string,
  comicDescription?: string,
  comicStyle?: number,
  comicCategory?: number,
  comicTags?: number[],
  previousEpisodes?: any[],
  model: string = 'deepseek-chat'
) {
  try {
    const aiModel = getAIModel(model)
    
    const systemPrompt = `你是一个专业的漫画编剧。根据用户的创意和已有信息，生成一话的标题和简介。

要求：
- 标题要简洁有力，能体现该话的核心内容
- 简介要详细（50-80字），包含该话的主要情节和冲突
- 要符合漫画叙事节奏，与前面的话衔接自然
- 故事要连贯，有起承转合
- 要符合漫画的风格、分类和标签特点

返回纯JSON格式，不要包含任何markdown标记、代码块符号或其他格式：
{
  "title": "话标题",
  "description": "话简介"
}

注意：直接返回JSON对象，不要用\`\`\`json包裹，不要任何解释文字`

    let userPrompt = `用户创意：${prompt}`
    if (comicTitle) userPrompt += `\n漫画标题：${comicTitle}`
    if (comicDescription) userPrompt += `\n漫画简介：${comicDescription}`
    if (comicStyle) userPrompt += `\n漫画风格ID：${comicStyle}`
    if (comicCategory) userPrompt += `\n漫画分类ID：${comicCategory}`
    if (comicTags && comicTags.length > 0) userPrompt += `\n漫画标签ID：${comicTags.join(', ')}`
    if (previousEpisodes && previousEpisodes.length > 0) {
      userPrompt += `\n\n前面的话：\n${previousEpisodes.map((ep: any, i: number) => `第${i + 1}话：${ep.name}\n${ep.description || ''}`).join('\n\n')}`
    }
    
    userPrompt += `\n\n请生成第${episodeNumber}话的标题和简介：`

    const { text } = await generateText({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      maxTokens: 8000,
    })

    const result = JSON.parse(text)

    return {
      success: true,
      data: {
        title: result.title || `第${episodeNumber}话`,
        description: result.description || ''
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: '话生成失败',
      detail: error?.message
    }
  }
}

/**
 * 生成单个分镜内容
 */
export async function generatePanel(
  panelNumber: number,
  prompt: string,
  comicTitle?: string,
  comicDescription?: string,
  comicStyle?: number,
  comicCategory?: number,
  comicTags?: number[],
  episodeTitle?: string,
  episodeDescription?: string,
  pageLayout?: string,
  panelCount?: number,
  previousPanels?: any[],
  model: string = 'deepseek-chat'
) {
  try {
    const aiModel = getAIModel(model)
    
    const systemPrompt = `你是一个专业的漫画分镜师。根据用户创意、漫画信息、话的内容和页的布局，创作一个分镜格子的详细内容。

要求：
- 画面描述要详细具体，包含场景、人物、动作、表情等，适合AI绘画模型理解
- 对话要自然，符合角色性格（如果没有对话就留空）
- 旁白用于故事叙述或心理描述（如果没有旁白就留空）
- 情感氛围要准确（如紧张、温馨、激动、悲伤、搞笑、神秘等）
- 镜头角度要合理（如近景、远景、特写、俯视、仰视、侧面、正面等）
- 角色信息要明确（出现的角色名称和状态）
- 要与前面的分镜衔接自然，保持故事连贯性
- 要符合漫画的风格、分类和标签特点
- 要符合页面布局（${pageLayout}）和总分镜数（${panelCount}格）

返回纯JSON格式，不要包含任何markdown标记、代码块符号或其他格式：
{
  "sceneDescription": "详细的画面描述",
  "dialogue": "角色对话（没有就留空字符串）",
  "narration": "旁白内容（没有就留空字符串）",
  "emotion": "情感氛围",
  "cameraAngle": "镜头角度",
  "characters": "角色信息"
}

注意：直接返回JSON对象，不要用\`\`\`json包裹，不要任何解释文字`

    let userPrompt = `用户创意：${prompt}`
    if (comicTitle) userPrompt += `\n漫画标题：${comicTitle}`
    if (comicDescription) userPrompt += `\n漫画简介：${comicDescription}`
    if (comicStyle) userPrompt += `\n漫画风格ID：${comicStyle}`
    if (comicCategory) userPrompt += `\n漫画分类ID：${comicCategory}`
    if (comicTags && comicTags.length > 0) userPrompt += `\n漫画标签ID：${comicTags.join(', ')}`
    if (episodeTitle) userPrompt += `\n话标题：${episodeTitle}`
    if (episodeDescription) userPrompt += `\n话简介：${episodeDescription}`
    if (pageLayout) userPrompt += `\n页面布局：${pageLayout}`
    if (panelCount) userPrompt += `\n总分镜数：${panelCount}格`
    if (previousPanels && previousPanels.length > 0) {
      userPrompt += `\n\n前面的分镜：\n${previousPanels.map((panel: any, i: number) => `第${i + 1}格：\n画面：${panel.sceneDescription || ''}\n对话：${panel.dialogue || '无'}\n旁白：${panel.narration || '无'}\n情感：${panel.emotion || ''}\n镜头：${panel.cameraAngle || ''}\n角色：${panel.characters || ''}`).join('\n\n')}`
    }
    
    userPrompt += `\n\n请创作第${panelNumber}格的分镜内容：`

    const { text } = await generateText({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      maxTokens: 500,
    })

    const result = JSON.parse(text)

    return {
      success: true,
      data: {
        sceneDescription: result.sceneDescription || '',
        dialogue: result.dialogue || '',
        narration: result.narration || '',
        emotion: result.emotion || '',
        cameraAngle: result.cameraAngle || '正面',
        characters: result.characters || ''
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: '分镜生成失败',
      detail: error?.message
    }
  }
}
