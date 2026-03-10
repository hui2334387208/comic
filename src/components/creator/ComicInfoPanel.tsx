'use client'

import { Sparkles, BookOpen } from 'lucide-react'
import { useComicCreateStore } from '@/store/creator/comicCreateStore'
import { globalMessage } from '@/components/common/GlobalMessage'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Input, Button, Select } from 'antd'

const { TextArea } = Input

export default function ComicInfoPanel() {
  const locale = useLocale()
  const { comicInfo, setComicInfo, setPrompt, isGenerating, setIsGenerating } = useComicCreateStore()

  const [categories, setCategories] = useState<any[]>([])
  const [styles, setStyles] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const [categoriesRes, stylesRes, tagsRes] = await Promise.all([
        fetch('/api/creator/categories'),
        fetch('/api/creator/styles'),
        fetch('/api/creator/tags'),
      ])

      const [categoriesData, stylesData, tagsData] = await Promise.all([
        categoriesRes.json(),
        stylesRes.json(),
        tagsRes.json(),
      ])

      if (categoriesData.success) setCategories(categoriesData.data)
      if (stylesData.success) setStyles(stylesData.data)
      if (tagsData.success) setTags(tagsData.data)
    } catch (error) {
      console.error('加载选项失败:', error)
    }
  }

  const handleAIGenerate = async () => {
    if (!comicInfo.prompt.trim()) {
      globalMessage.warning('请输入创意内容')
      return
    }

    setIsGenerating(true)

    try {
      const promptText = comicInfo.prompt.trim()
      const requestBody = {
        prompt: promptText,
        model: 'deepseek-chat',
        language: locale
      }

      // 1. 生成标题
      const titleResponse = await fetch('/api/creator/generate/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      const titleData = await titleResponse.json()
      if (titleData.success && titleData.data?.title) {
        setComicInfo({ title: titleData.data.title })
      }

      // 2. 生成描述
      const descResponse = await fetch('/api/creator/generate/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...requestBody, title: titleData.data?.title }),
      })
      const descData = await descResponse.json()
      if (descData.success && descData.data?.description) {
        setComicInfo({ description: descData.data.description })
      }

      // 3. 生成风格
      const styleResponse = await fetch('/api/creator/generate/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...requestBody, title: titleData.data?.title, description: descData.data?.description }),
      })
      const styleData = await styleResponse.json()
      if (styleData.success && styleData.data?.style) {
        setComicInfo({ style: styleData.data.style })
      }

      // 4. 生成分类
      const categoryResponse = await fetch('/api/creator/generate/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...requestBody, title: titleData.data?.title, description: descData.data?.description }),
      })
      const categoryData = await categoryResponse.json()
      if (categoryData.success && categoryData.data?.category) {
        setComicInfo({ category: categoryData.data.category })
      }

      // 5. 生成标签
      const tagsResponse = await fetch('/api/creator/generate/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestBody,
          title: titleData.data?.title,
          description: descData.data?.description,
          category: categoryData.data?.category?.name
        }),
      })
      const tagsData = await tagsResponse.json()
      if (tagsData.success && tagsData.data?.tags) {
        setComicInfo({ tags: tagsData.data.tags })
      }

      globalMessage.success('生成成功！请检查并完善漫画信息')
    } catch (error: any) {
      console.error('AI生成失败:', error)
      globalMessage.error(error.message || 'AI生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateTitle = async () => {
    if (!comicInfo.prompt.trim()) {
      globalMessage.warning('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: comicInfo.prompt.trim(), model: 'deepseek-chat', language: locale }),
      })
      const data = await response.json()
      if (data.success && data.data?.title) {
        setComicInfo({ title: data.data.title })
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateDescription = async () => {
    if (!comicInfo.prompt.trim()) {
      globalMessage.warning('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: comicInfo.prompt.trim(), title: comicInfo.title, model: 'deepseek-chat', language: locale }),
      })
      const data = await response.json()
      if (data.success && data.data?.description) {
        setComicInfo({ description: data.data.description })
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateStyle = async () => {
    if (!comicInfo.prompt.trim()) {
      globalMessage.warning('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: comicInfo.prompt.trim(), title: comicInfo.title, description: comicInfo.description, model: 'deepseek-chat', language: locale }),
      })
      const data = await response.json()
      if (data.success && data.data?.style) {
        setComicInfo({ style: data.data.style })
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateCategory = async () => {
    if (!comicInfo.prompt.trim()) {
      globalMessage.warning('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: comicInfo.prompt.trim(), title: comicInfo.title, description: comicInfo.description, model: 'deepseek-chat', language: locale }),
      })
      const data = await response.json()
      if (data.success && data.data?.category) {
        setComicInfo({ category: data.data.category })
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateTags = async () => {
    if (!comicInfo.prompt.trim()) {
      globalMessage.warning('请先输入创意内容')
      return
    }
    setIsGenerating(true)
    try {
      const response = await fetch('/api/creator/generate/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: comicInfo.prompt.trim(), title: comicInfo.title, description: comicInfo.description, category: comicInfo.category, model: 'deepseek-chat', language: locale }),
      })
      const data = await response.json()
      if (data.success && data.data?.tags) {
        setComicInfo({ tags: data.data.tags })
      }
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <aside className="w-[350px] bg-gradient-to-b from-indigo-50 to-purple-50 border-r-2 border-indigo-200 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* AI 生成 */}
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="text-indigo-600" size={18} />
            <h3 className="text-sm font-bold text-gray-800">AI 智能生成</h3>
          </div>
          <textarea
            value={comicInfo.prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入创意，AI 自动生成全部内容..."
            className="w-full px-3 py-2 bg-indigo-50/50 border-2 border-indigo-200 rounded-xl text-gray-800 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none"
            rows={3}
          />
          <button
            onClick={handleAIGenerate}
            disabled={!comicInfo.prompt.trim() || isGenerating}
            className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? '生成中...' : '✨ 一键生成'}
          </button>
        </div>

        {/* 漫画信息 */}
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <BookOpen className="text-indigo-600" size={18} />
            <h3 className="text-sm font-bold text-gray-800">漫画信息</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1.5">名称</label>
              <div className="flex gap-2">
                <Input
                  value={comicInfo.title}
                  onChange={(e) => setComicInfo({ title: e.target.value })}
                  placeholder="漫画标题"
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  className="flex-1 !px-3 !py-2 !bg-indigo-50/50 !border-2 !border-indigo-200 !rounded-xl !text-gray-800 !text-sm placeholder:!text-gray-500 focus:!outline-none focus:!border-indigo-400 disabled:!opacity-50 disabled:!cursor-not-allowed"
                />
                <Button
                  onClick={handleRegenerateTitle}
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  icon={<Sparkles size={16} />}
                  className="!w-10 !h-10 !flex !items-center !justify-center !bg-indigo-600 hover:!bg-indigo-700 !text-white !rounded-xl !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed !border-indigo-600 hover:!border-indigo-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1.5">描述</label>
              <div className="flex gap-2">
                <TextArea
                  value={comicInfo.description}
                  onChange={(e) => setComicInfo({ description: e.target.value })}
                  placeholder="简要描述"
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  className="flex-1 !px-3 !py-2 !bg-indigo-50/50 !border-2 !border-indigo-200 !rounded-xl !text-gray-800 !text-sm placeholder:!text-gray-500 focus:!outline-none focus:!border-indigo-400 !resize-none disabled:!opacity-50 disabled:!cursor-not-allowed"
                  rows={2}
                />
                <Button
                  onClick={handleRegenerateDescription}
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  icon={<Sparkles size={16} />}
                  className="!w-10 !h-10 !flex !items-center !justify-center !bg-indigo-600 hover:!bg-indigo-700 !text-white !rounded-xl !transition-all !self-start disabled:!opacity-50 disabled:!cursor-not-allowed !border-indigo-600 hover:!border-indigo-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1.5">风格</label>
              <div className="flex gap-2">
                <Select
                  value={comicInfo.style || undefined}
                  onChange={(value) => setComicInfo({ style: value })}
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  placeholder="选择风格"
                  className="flex-1 [&_.ant-select-selector]:!bg-indigo-50/50 [&_.ant-select-selector]:!border-2 [&_.ant-select-selector]:!border-indigo-200 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!px-3 [&_.ant-select-selector]:!py-2 [&_.ant-select-selector]:!text-gray-800 [&_.ant-select-selector]:!text-sm [&_.ant-select-selector]:!h-[40px] [&_.ant-select-selector]:!shadow-none hover:[&_.ant-select-selector]:!border-indigo-300 [&.ant-select-focused_.ant-select-selector]:!border-indigo-400 [&.ant-select-focused_.ant-select-selector]:!shadow-none [&.ant-select-disabled_.ant-select-selector]:!opacity-50 [&.ant-select-disabled_.ant-select-selector]:!cursor-not-allowed [&_.ant-select-selection-placeholder]:!text-gray-500"
                  popupClassName="!rounded-xl !border-2 !border-indigo-200"
                  dropdownStyle={{
                    borderRadius: '12px',
                    border: '2px solid rgb(199 210 254)',
                  }}
                >
                  {styles.map((style) => (
                    <Select.Option key={style.id} value={style.id}>
                      {style.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  onClick={handleRegenerateStyle}
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  icon={<Sparkles size={16} />}
                  className="!w-10 !h-10 !flex !items-center !justify-center !bg-indigo-600 hover:!bg-indigo-700 !text-white !rounded-xl !transition-all !self-start disabled:!opacity-50 disabled:!cursor-not-allowed !border-indigo-600 hover:!border-indigo-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1.5">分类</label>
              <div className="flex gap-2">
                <Select
                  value={comicInfo.category || undefined}
                  onChange={(value) => setComicInfo({ category: value })}
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  placeholder="选择分类"
                  className="flex-1 [&_.ant-select-selector]:!bg-indigo-50/50 [&_.ant-select-selector]:!border-2 [&_.ant-select-selector]:!border-indigo-200 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!px-3 [&_.ant-select-selector]:!py-2 [&_.ant-select-selector]:!text-gray-800 [&_.ant-select-selector]:!text-sm [&_.ant-select-selector]:!h-[40px] [&_.ant-select-selector]:!shadow-none hover:[&_.ant-select-selector]:!border-indigo-300 [&.ant-select-focused_.ant-select-selector]:!border-indigo-400 [&.ant-select-focused_.ant-select-selector]:!shadow-none [&.ant-select-disabled_.ant-select-selector]:!opacity-50 [&.ant-select-disabled_.ant-select-selector]:!cursor-not-allowed [&_.ant-select-selection-placeholder]:!text-gray-500"
                  popupClassName="!rounded-xl !border-2 !border-indigo-200"
                  dropdownStyle={{
                    borderRadius: '12px',
                    border: '2px solid rgb(199 210 254)',
                  }}
                >
                  {categories.map((category) => (
                    <Select.Option key={category.id} value={category.id}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  onClick={handleRegenerateCategory}
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  icon={<Sparkles size={16} />}
                  className="!w-10 !h-10 !flex !items-center !justify-center !bg-indigo-600 hover:!bg-indigo-700 !text-white !rounded-xl !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed !border-indigo-600 hover:!border-indigo-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1.5">标签</label>
              <div className="flex gap-2">
                <Select
                  mode="multiple"
                  value={comicInfo.tags}
                  onChange={(values) => setComicInfo({ tags: values })}
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  placeholder="选择标签"
                  className="flex-1 [&_.ant-select-selector]:!bg-indigo-50/50 [&_.ant-select-selector]:!border-2 [&_.ant-select-selector]:!border-indigo-200 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!px-1 [&_.ant-select-selector]:!py-1 [&_.ant-select-selector]:!text-gray-800 [&_.ant-select-selector]:!text-sm [&_.ant-select-selector]:!shadow-none hover:[&_.ant-select-selector]:!border-indigo-300 [&.ant-select-focused_.ant-select-selector]:!border-indigo-400 [&.ant-select-focused_.ant-select-selector]:!shadow-none [&.ant-select-disabled_.ant-select-selector]:!opacity-50 [&.ant-select-disabled_.ant-select-selector]:!cursor-not-allowed [&_.ant-select-selection-placeholder]:!text-gray-500"
                  popupClassName="!rounded-xl !border-2 !border-indigo-200"
                  dropdownStyle={{
                    borderRadius: '12px',
                    border: '2px solid rgb(199 210 254)',
                  }}
                >
                  {tags.map((tag) => (
                    <Select.Option key={tag.id} value={tag.id}>
                      {tag.name}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  onClick={handleRegenerateTags}
                  disabled={!comicInfo.prompt.trim() || isGenerating}
                  icon={<Sparkles size={16} />}
                  className="!w-10 !h-10 !flex !items-center !justify-center !bg-indigo-600 hover:!bg-indigo-700 !text-white !rounded-xl !transition-all !self-start disabled:!opacity-50 disabled:!cursor-not-allowed !border-indigo-600 hover:!border-indigo-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
