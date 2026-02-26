import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { db } from '@/db'
import { comics } from '@/db/schema/comic'
import { eq } from 'drizzle-orm'
import { consumeCredits, getUserCredits } from '@/lib/credits-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { title, description, style = 'anime', comicId } = body || {}

    if (!title || !description) {
      return NextResponse.json({ error: '请提供标题和描述' }, { status: 400 })
    }

    // 检查用户余额
    const userCreditsData = await getUserCredits(userId)
    if (userCreditsData.balance <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: '次数不足，无法生成封面' 
      }, { status: 402 })
    }

    // 构建封面描述提示词
    const coverPrompt = `${title}，${description}，漫画封面，精美插画，${style}风格，高质量，详细绘制`

    // 调用阿里云通义万象wan2.6-t2i模型生成封面
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'wan2.6-t2i',
        input: {
          messages: [{
            role: 'user',
            content: [{
              text: coverPrompt
            }]
          }]
        },
        parameters: {
          negative_prompt: '',
          prompt_extend: true,
          watermark: false,
          n: 1,
          size: '1280*1280'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('阿里云API调用失败:', errorText)
      return NextResponse.json({ 
        success: false, 
        error: '封面生成失败', 
        detail: errorText 
      }, { status: 500 })
    }

    const result = await response.json()
    
    if (result.output?.choices?.[0]?.message?.content?.[0]?.image) {
      const coverUrl = result.output?.choices?.[0]?.message?.content?.[0]?.image
      
      // 如果提供了comicId，更新数据库中的封面
      if (comicId) {
        try {
          await db.update(comics)
            .set({ 
              coverImage: coverUrl,
              updatedAt: new Date()
            })
            .where(eq(comics.id, comicId))
          
          console.log(`漫画${comicId}封面已更新到数据库`)
        } catch (dbError) {
          console.error('更新封面到数据库失败:', dbError)
        }
      }

      // 扣除1次
      const consumeResult = await consumeCredits(
        userId,
        1,
        comicId,
        'comic_generation',
        `生成漫画 #${comicId} 封面`
      )

      if (consumeResult.success) {
        console.log(`封面生成成功，扣除1次，剩余${consumeResult.balance}次`)
      } else {
        console.error(`扣除次数失败:`, consumeResult.message)
      }
      
      return NextResponse.json({
        success: true,
        data: {
          coverUrl,
          comicId,
          prompt: coverPrompt,
          remainingCredits: consumeResult.balance
        }
      })
    } else {
      console.error('封面生成结果异常:', result)
      return NextResponse.json({ 
        success: false, 
        error: '封面生成失败', 
        detail: '未获取到有效的图片URL' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('封面生成失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: '封面生成失败', 
      detail: error?.message 
    }, { status: 500 })
  }
}