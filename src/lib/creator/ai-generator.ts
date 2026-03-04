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
