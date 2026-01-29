'use client'
import { Watermark } from 'antd'
import * as htmlToImage from 'html-to-image'
import jsPDF from 'jspdf'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import React, { useState, useRef, useCallback, useEffect } from 'react'

import CommentSection from '@/components/couplet/CommentSection'
import FavoriteButton from '@/components/couplet/FavoriteButton'
import LikeButton from '@/components/couplet/LikeButton'
import CoupletVersionManager from '@/components/couplet/CoupletVersionManager'

// AI模型ID到友好名称的映射
const modelMap: Record<string, string> = {
  'deepseek-chat': 'DeepSeek-V3',
  'deepseek-reasoner': 'DeepSeek-R1',
  // 可继续扩展
}

export interface CoupletContent {
  id: number | string;
  upperLine: string; // 上联
  lowerLine: string; // 下联
  horizontalScroll: string; // 横批
  appreciation?: string; // 赏析内容
}

export interface CoupletVersion {
  id: number;
  coupletId: number;
  version: number;
  parentVersionId?: number;
  versionDescription?: string;
  isLatestVersion: boolean;
  originalCoupletId?: number;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoupletData {
  id: string;
  title: string;
  description: string;
  category: {
    name: string;
    icon?: string;
    slug?: string;
  };
  model: string;
  createdAt: string;
  contents: CoupletContent[];
  tags: { id: number; name: string; slug: string }[];
  prompt?: string;
}

interface ClientCoupletPageProps {
  couplet: CoupletData | null;
  versions: CoupletVersion[];
  currentVersion: CoupletVersion | null;
  coupletId: string;
}

export default function ClientCoupletPage({ couplet: initialCouplet, versions: initialVersions, currentVersion: initialCurrentVersion, coupletId }: ClientCoupletPageProps) {
  const t = useTranslations('main.couplet.detail')
  const [couplet, setCouplet] = useState<CoupletData | null>(initialCouplet)
  const [versions, setVersions] = useState<CoupletVersion[]>(initialVersions)
  const [currentVersion, setCurrentVersion] = useState<CoupletVersion | null>(initialCurrentVersion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showVersionManager, setShowVersionManager] = useState(false)
  const contentToCaptureRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const [isVip, setIsVip] = useState<boolean>(false)
  const [streamPreviewContents, setStreamPreviewContents] = useState<CoupletContent[]>(initialCouplet?.contents || [])
  const locale = useLocale()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return
    }
    fetch('/api/sitemap/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: window.location.pathname }),
    })
  }, [])

  // 确保 SSR 传入的对联内容在首屏也用于渲染（避免偶发水合后为空）
  useEffect(() => {
    if ((streamPreviewContents.length === 0) && Array.isArray(initialCouplet?.contents) && initialCouplet.contents.length > 0) {
      setStreamPreviewContents(initialCouplet.contents)
    }
  }, [initialCouplet])

  // 统一逻辑：进入详情页先拉取数据库数据；有内容→直接渲染；无内容→按提示词流式生成（其他信息仍用DB数据）
  useEffect(() => {
    // SSR 已传入内容则不再请求/生成，避免重复
    if ((initialCouplet?.contents?.length || 0) > 0 || streamPreviewContents.length > 0) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/couplet/${coupletId}`, { cache: 'no-store' })
        const result = await res.json().catch(() => null)
        if (res.ok && result?.success) {
          const apiData = result.data
          const convertedCouplet: CoupletData = {
            id: apiData.id,
            title: apiData.title || t('noTitle'),
            description: apiData.description || t('noDescription'),
            category: {
              name: apiData.category?.name || t('uncategorized'),
              icon: apiData.category?.icon,
              slug: apiData.category?.slug,
            },
            prompt: apiData.prompt,
            model: apiData.model,
            createdAt: apiData.createdAt,
            contents: apiData.contents?.map((content: any) => {
              // 对联数据格式：upperLine是上联，lowerLine是下联，horizontalScroll是横批
              return {
                id: content.id,
                upperLine: content.upperLine || '', // 上联
                lowerLine: content.lowerLine || '', // 下联
                horizontalScroll: content.horizontalScroll || '', // 横批
                appreciation: content.appreciation || '', // 赏析内容
              }
            }) || [],
            tags: Array.isArray(apiData.tags) ? apiData.tags : [],
          }
          if (!cancelled) {
            setCouplet(convertedCouplet)
            if (convertedCouplet.contents.length > 0) {
              setStreamPreviewContents(convertedCouplet.contents)
              return
            }
            // 没有内容则继续尝试流式生成
            const promptText = convertedCouplet.prompt || ''
            if (!promptText) return
            setIsRegenerating(true)
            setError('')
            setStreamPreviewContents([])
            try {
              const streamRes = await fetch('/api/couplet/generate/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptText, language: locale }),
              })
              if (!streamRes.ok) {
                throw new Error((await streamRes.json().catch(() => ({})))?.error || t('regenerateFailed'))
              }
              const reader = streamRes.body?.getReader()
              const decoder = new TextDecoder('utf-8')
              let fullText = ''
              let buffer = ''
              let previewIndex = 0
              if (reader) {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                  const { value, done } = await reader.read()
                  if (done) break
                  const chunkText = decoder.decode(value, { stream: true })
                  fullText += chunkText
                  buffer += chunkText
                  const lines = buffer.split('\n')
                  buffer = lines.pop() || ''
                  for (const raw of lines) {
                    const line = raw.trim()
                    if (!line) continue
                    // 优先 JSON 行
                    try {
                      const obj = JSON.parse(line)
                      // 对联格式：horizontalScroll是横批，upperLine是上联，lowerLine是下联
                      const horizontalScroll = String(obj.horizontalScroll || obj.startDate || obj.category || '')
                      const upperLine = String(obj.upperLine || obj.title || '')
                      const lowerLine = String(obj.lowerLine || obj.description || obj.desc || '')
                      const appreciation = String(obj.appreciation || '')
                      if (horizontalScroll && upperLine && lowerLine) {
                        const newContent: CoupletContent = {
                          id: `preview-${Date.now()}-${previewIndex++}`,
                          upperLine: upperLine, // 上联
                          lowerLine: lowerLine, // 下联
                          horizontalScroll: horizontalScroll, // 横批
                          appreciation: appreciation, // 赏析内容
                        }
                        setStreamPreviewContents(prev => [...prev, newContent])
                        // eslint-disable-next-line no-await-in-loop
                        await new Promise(requestAnimationFrame)
                        continue
                      }
                    } catch (_) {
                      // 支持格式：@横批@上联@下联 或 @横批@上联下联（合并）
                      const match = line.match(/\s*@([^@]+)@([^@]+)(?:@(.+))?/)
                      if (match) {
                        const horizontalScroll = match[1].trim() // 横批
                        const upperLine = match[2].trim() // 上联
                        const lowerLine = match[3] ? match[3].trim() : '' // 下联（可选）
                        if (horizontalScroll && upperLine) {
                          const newContent: CoupletContent = {
                            id: `preview-${Date.now()}-${previewIndex++}`,
                            upperLine: upperLine, // 上联
                            lowerLine: lowerLine, // 下联
                            horizontalScroll: horizontalScroll, // 横批
                            appreciation: '', // 赏析内容暂时为空
                          }
                          setStreamPreviewContents(prev => [...prev, newContent])
                          // eslint-disable-next-line no-await-in-loop
                          await new Promise(requestAnimationFrame)
                        }
                      }
                    }
                  }
                }
              }
              if (buffer.trim()) {
                const line = buffer.trim()
                try {
                  const obj = JSON.parse(line)
                  // 对联格式：horizontalScroll是横批，upperLine是上联，lowerLine是下联
                  const horizontalScroll = String(obj.horizontalScroll || obj.startDate || obj.category || '')
                  const upperLine = String(obj.upperLine || obj.title || '')
                  const lowerLine = String(obj.lowerLine || obj.description || obj.desc || '')
                  const appreciation = String(obj.appreciation || '')
                  if (horizontalScroll && upperLine && lowerLine) {
                    const newContent: CoupletContent = {
                      id: `preview-${Date.now()}-${++previewIndex}`,
                      upperLine: upperLine, // 上联
                      lowerLine: lowerLine, // 下联
                      horizontalScroll: horizontalScroll, // 横批
                      appreciation: appreciation, // 赏析内容
                    }
                    setStreamPreviewContents(prev => [...prev, newContent])
                  }
                } catch (_) {
                  // 支持格式：@横批@上联@下联 或 @横批@上联下联（合并）
                  const match = line.match(/\s*@([^@]+)@([^@]+)(?:@(.+))?/)
                  if (match) {
                    const horizontalScroll = match[1].trim() // 横批
                    const upperLine = match[2].trim() // 上联
                    const lowerLine = match[3] ? match[3].trim() : '' // 下联（可选）
                    if (horizontalScroll && upperLine) {
                      const newContent: CoupletContent = {
                        id: `preview-${Date.now()}-${++previewIndex}`,
                        upperLine: upperLine, // 上联
                        lowerLine: lowerLine, // 下联
                        horizontalScroll: horizontalScroll, // 横批
                        appreciation: '', // 赏析内容暂时为空
                      }
                      setStreamPreviewContents(prev => [...prev, newContent])
                    }
                  }
                }
              }
              // 解析并保存
              const parseRes = await fetch('/api/couplet/generate/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: fullText }),
              })
              const parseData = await parseRes.json()
              if (!parseRes.ok || !Array.isArray(parseData?.data?.contents) || parseData.data.contents.length === 0) {
                throw new Error(parseData?.error || t('regenerateFailed'))
              }
              const contents = parseData.data.contents
              const saveRes = await fetch(`/api/couplet/${coupletId}/contents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents }),
              })
              const saveData = await saveRes.json()
              if (!saveRes.ok || !saveData?.success) {
                throw new Error(saveData?.error || t('regenerateFailed'))
              }
              // 成功后计数 +1
              try { await fetch('/api/couplet/generate/increment', { method: 'POST' }) } catch (_) {}
            } catch (e) {
              console.error(e)
              if (!cancelled) setError(t('regenerateFailed'))
            } finally {
              if (!cancelled) setIsRegenerating(false)
            }
          }
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [coupletId])

  // 仅用于切换版本、重新生成等交互 fetch
  const fetchCoupletData = async (versionId?: number) => {
    try {
      setLoading(true)
      const url = versionId ? `/api/couplet/${coupletId}?versionId=${versionId}` : `/api/couplet/${coupletId}`
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        const apiData = result.data
        const convertedCouplet = {
          id: apiData.id,
          title: apiData.title || t('noTitle'),
          description: apiData.description || t('noDescription'),
          category: {
            name: apiData.category?.name || t('uncategorized'),
            icon: apiData.category?.icon,
            slug: apiData.category?.slug,
          },
          prompt: apiData.prompt,
          model: apiData.model,
          createdAt: apiData.createdAt,
          contents: apiData.contents?.map((content: any, index: number) => {
            // 对联数据格式：upperLine是上联，lowerLine是下联，horizontalScroll是横批
            return {
              id: content.id,
              upperLine: content.upperLine || '', // 上联
              lowerLine: content.lowerLine || '', // 下联
              horizontalScroll: content.horizontalScroll || '', // 横批
              appreciation: content.appreciation || '', // 赏析内容
            }
          }) || [],
          tags: Array.isArray(apiData.tags) ? apiData.tags : [],
        }
        setCouplet(convertedCouplet)
        // 切换版本后，用该版本的内容作为渲染源
        setStreamPreviewContents(convertedCouplet.contents)
      } else {
        setError(result.message || t('getCoupletFailed'))
      }
    } catch (error) {
      console.error('获取对联错误:', error)
      setError(t('getCoupletFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleVersionChange = (version: CoupletVersion) => {
    setCurrentVersion(version)
    fetchCoupletData(version.id)
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError('')
    // 清空当前流式渲染的数据，避免新旧内容叠加
    setStreamPreviewContents([])
    try {
      // 限额检查，避免超额仍然触发生成
      const limitRes = await fetch('/api/couplet/generate/check-limit', { method: 'POST' })
      const limitData = await limitRes.json()

      if (limitRes.status === 429 && !limitData?.data?.allowed) {
        throw new Error(t('hero.limitExceeded'))
      }
      if (!limitRes.ok) {
        throw new Error(t('hero.generateError'))
      }

      // 重新生成：不命中缓存，直接流式 → 解析 → 描述 → 分类 → 保存（force）
      const streamRes = await fetch('/api/couplet/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: couplet?.prompt, model: couplet?.model, language: locale }),
      })
      if (!streamRes.ok) {
        throw new Error((await streamRes.json().catch(() => ({})))?.error || t('regenerateFailed'))
      }

      // 实时读取流并按行解析对联内容
      const reader = streamRes.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      let fullText = ''
      let buffer = ''
      let previewIndex = 0

      if (reader) {
        // 逐块读取
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunkText = decoder.decode(value, { stream: true })
          fullText += chunkText
          buffer += chunkText
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const raw of lines) {
            const line = raw.trim()
            if (!line) continue
            // 优先 JSON 行
            try {
              const obj = JSON.parse(line)
              // 对联格式：horizontalScroll是横批，upperLine是上联，lowerLine是下联
              const horizontalScroll = obj.horizontalScroll || ''
              const upperLine = obj.upperLine || ''
              const lowerLine = obj.lowerLine || ''
              const appreciation = obj.appreciation || ''
              if (horizontalScroll && upperLine && lowerLine) {
                const newContent: CoupletContent = {
                  id: `preview-${Date.now()}-${previewIndex++}`,
                  upperLine: upperLine, // 上联
                  lowerLine: lowerLine, // 下联
                  horizontalScroll: horizontalScroll, // 横批
                  appreciation: appreciation
                }
                setStreamPreviewContents(prev => [...prev, newContent])
                // 让出一帧，给浏览器机会渲染
                // eslint-disable-next-line no-await-in-loop
                await new Promise(requestAnimationFrame)
                continue
              }
            } catch (_) {
              // 支持格式：@横批@上联@下联 或 @横批@上联下联（合并）
              const match = buffer.match(/\s*@([^@]+)@([^@]+)(?:@(.+))?/)
              if (match) {
                const horizontalScroll = match[1].trim() // 横批
                const upperLine = match[2].trim() // 上联
                const lowerLine = match[3] ? match[3].trim() : '' // 下联（可选）
                if (horizontalScroll && upperLine) {
                  const newContent: CoupletContent = {
                    id: `preview-${Date.now()}-${++previewIndex}`,
                    upperLine: upperLine, // 上联
                    lowerLine: lowerLine, // 下联
                    horizontalScroll: horizontalScroll, // 横批
                    appreciation: '', // 赏析内容暂时为空
                  }
                  setStreamPreviewContents(prev => [...prev, newContent])
                }
              }
            }
          }
        }
      }
      // 处理缓冲区中的最后一行
      if (buffer.trim()) {
        const line = buffer.trim()
        try {
          const obj = JSON.parse(line)
          // 对联格式：horizontalScroll是横批，upperLine是上联，lowerLine是下联
          const horizontalScroll = obj.horizontalScroll || ''
          const upperLine = obj.upperLine || ''
          const lowerLine = obj.lowerLine || ''
          const appreciation = obj.appreciation || ''
          if (horizontalScroll && upperLine && lowerLine) {
            const newContent: CoupletContent = {
              id: `preview-${Date.now()}-${++previewIndex}`,
              upperLine: upperLine, // 上联
              lowerLine: lowerLine, // 下联
              horizontalScroll: horizontalScroll, // 横批
              appreciation: appreciation
            }
            setStreamPreviewContents(prev => [...prev, newContent])
          }
        } catch (_) {
          // 支持格式：@横批@上联@下联 或 @横批@上联下联（合并）
          const match = buffer.match(/\s*@([^@]+)@([^@]+)(?:@(.+))?/)
          if (match) {
            const horizontalScroll = match[1].trim() // 横批
            const upperLine = match[2].trim() // 上联
            const lowerLine = match[3] ? match[3].trim() : '' // 下联（可选）
            if (horizontalScroll && upperLine) {
              const newContent: CoupletContent = {
                id: `preview-${Date.now()}-${++previewIndex}`,
                upperLine: upperLine, // 上联
                lowerLine: lowerLine, // 下联
                horizontalScroll: horizontalScroll, // 横批
                appreciation: '', // 赏析内容暂时为空
              }
              setStreamPreviewContents(prev => [...prev, newContent])
            }
          }
        }
      }

      const parseRes = await fetch('/api/couplet/generate/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
      })
      const parseData = await parseRes.json()
      if (!parseRes.ok || !Array.isArray(parseData?.data?.contents) || parseData.data.contents.length === 0) {
        throw new Error(parseData?.error || t('regenerateFailed'))
      }
      const contents = parseData.data.contents

      // 生成元信息（仅基于提示词）
      const metaRes = await fetch('/api/couplet/generate/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: couplet?.prompt, model: couplet?.model, language: locale }),
      })
      const meta = await metaRes.json().catch(() => ({}))
      const description = metaRes.ok ? (meta?.data?.description || couplet?.prompt || '') : (couplet?.prompt || '')
      const classification = metaRes.ok ? { success: true, data: { category: meta?.data?.category, tags: meta?.data?.tags } } : undefined

      const saveRes = await fetch('/api/couplet/generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: couplet?.prompt, model: couplet?.model, contents, description, classification, coupletId: coupletId, force: false }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok || !saveData?.success) {
        throw new Error(saveData?.error || t('regenerateFailed'))
      }
      const newVersionNumber = Number(saveData?.data?.version || (currentVersion?.version ? currentVersion.version + 1 : 1))
      const newVersion: CoupletVersion = {
        id: Number(saveData?.data?.versionId) || Date.now(),
        coupletId: Number(coupletId),
        version: newVersionNumber,
        parentVersionId: currentVersion?.id,
        versionDescription: `AI生成版本${newVersionNumber}`,
        isLatestVersion: true,
        originalCoupletId: Number(coupletId),
        contentCount: Array.isArray(contents) ? contents.length : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setVersions(prev => {
        const cleared = prev.map(v => ({ ...v, isLatestVersion: false }))
        return [newVersion, ...cleared]
      })
      setCurrentVersion(newVersion)
      // 重新生成成功后计数 +1
      try { await fetch('/api/couplet/generate/increment', { method: 'POST' }) } catch (_) {}
    } catch (error) {
      console.error('重新生成错误:', error)
      setError(t('regenerateFailed'))
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSaveAsImage = useCallback(() => {
    if (contentToCaptureRef.current === null) {
      return
    }
    htmlToImage.toPng(contentToCaptureRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#f9fafb', // Using a light gray similar to the page background
    })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `${couplet?.title || 'couplet'}.png`
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err)
        setError(t('imageSaveFailed'))
      })
  }, [contentToCaptureRef, couplet?.title, t])

  const handleExportAsPdf = useCallback(() => {
    if (contentToCaptureRef.current === null) {
      return
    }

    htmlToImage.toPng(contentToCaptureRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })
      .then((dataUrl) => {
        const img = new Image()
        img.src = dataUrl
        img.onload = () => {
          const pdf = new jsPDF({
            orientation: img.width > img.height ? 'l' : 'p',
            unit: 'px',
            format: [img.width, img.height],
          })

          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pdfHeight = pdf.internal.pageSize.getHeight()

          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
          pdf.save(`${couplet?.title || 'couplet'}.pdf`)
        }
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err)
        setError(t('pdfExportFailed'))
      })
  }, [contentToCaptureRef, couplet?.title, t])

  // 获取用户VIP状态
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/profile')
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          setIsVip(!!user?.isVip)
        })
        .catch(() => { })
    } else {
      setIsVip(false)
    }
  }, [session])

  useEffect(() => {
    // 访问详情页时写入浏览明细
    if (coupletId) {
      fetch(`/api/couplet/${coupletId}/view`, { method: 'POST' })
    }
  }, [coupletId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center">
        {/* 传统装饰背景 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
              <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
              <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                    fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
        </div>
        
        <div className="relative text-center">
          <div className="bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl shadow-2xl border-2 border-red-200/50 dark:border-red-800/50 p-12">
            {/* 传统印章风格加载图标 */}
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-xl animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
                <span className="text-red-800 text-2xl font-black animate-bounce">联</span>
              </div>
            </div>
            
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 mx-auto mb-6" />
            <p className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">{t('loadingCouplet')}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('pleaseWait')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 flex items-center justify-center">
        {/* 传统装饰背景 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
              <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 opacity-5">
            <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
              <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                    fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
        </div>
        
        <div className="relative text-center">
          <div className="bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl shadow-2xl border-2 border-red-200/50 dark:border-red-800/50 p-12">
            {/* 传统印章风格错误图标 */}
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-xl"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
                <span className="text-red-800 text-2xl font-black">❌</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-4">{t('problemOccurred')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">{error}</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
            >
              <span className="text-xl">🏠</span>
              <span>{t('returnHome')}</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20">
      {/* 传统文化背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* 传统云纹装饰 */}
        <div className="absolute top-10 left-10 w-40 h-40 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
            <path d="M20 50 Q30 30, 50 40 Q70 30, 80 50 Q70 70, 50 60 Q30 70, 20 50 Z" 
                  fill="currentColor" opacity="0.6"/>
            <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.8"/>
          </svg>
        </div>
        
        {/* 传统回纹装饰 */}
        <div className="absolute top-32 right-20 w-32 h-32 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
            <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                  fill="none" stroke="currentColor" strokeWidth="3"/>
          </svg>
        </div>
        
        {/* 传统如意纹装饰 */}
        <div className="absolute bottom-20 left-20 w-36 h-36 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-600">
            <path d="M50 10 Q70 20, 80 40 Q90 60, 70 80 Q50 90, 30 80 Q10 60, 20 40 Q30 20, 50 10 Z" 
                  fill="currentColor" opacity="0.4"/>
            <path d="M50 25 Q60 30, 65 45 Q70 60, 60 70 Q50 75, 40 70 Q30 60, 35 45 Q40 30, 50 25 Z" 
                  fill="currentColor" opacity="0.6"/>
          </svg>
        </div>
        
        {/* 传统祥云装饰 */}
        <div className="absolute bottom-32 right-32 w-28 h-28 opacity-5 dark:opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-700">
            <path d="M25 60 Q15 50, 25 40 Q35 30, 50 35 Q65 30, 75 40 Q85 50, 75 60 Q65 70, 50 65 Q35 70, 25 60 Z" 
                  fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* 页面头部 - 重新设计为中国风 */}
      <div className="relative bg-gradient-to-r from-red-600/90 via-red-700/90 to-red-800/90 backdrop-blur-sm border-b-2 border-yellow-400/50 shadow-lg">
        {/* 传统装饰背景 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full text-yellow-400">
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
              <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
            </svg>
          </div>
          <div className="absolute top-0 right-1/4 w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full text-orange-400">
              <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                    fill="none" stroke="currentColor" strokeWidth="4"/>
            </svg>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              {/* 传统印章风格导航 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-red-800 text-sm font-black">联</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-100">
                  <Link href="/" className="hover:text-yellow-300 transition-colors duration-300 font-medium">
                    {t('backToHome')}
                  </Link>
                  <span className="text-yellow-300/60">·</span>
                  <span className="text-yellow-200/80">{t('aiGeneratedResult')}</span>
                </div>
              </div>
              
              {/* 对联标题信息 */}
              {couplet && (
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-yellow-100 tracking-wide">
                    {couplet.title}
                  </h1>
                  {couplet.category && (
                    <div className="inline-flex items-center px-3 py-1 bg-yellow-400/20 text-yellow-200 rounded-full text-sm border border-yellow-400/30">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
                      {couplet.category.name}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* AI模型标识 - 传统风格 */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-200 rounded-2xl text-sm border border-yellow-400/30 backdrop-blur-sm">
                <div className="w-6 h-6 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <span className="text-red-800 text-xs font-bold">AI</span>
                </div>
                <span className="font-medium">{couplet?.model ? modelMap[couplet.model as string] || couplet.model : ''}</span>
              </div>
              
              {/* 操作按钮组 - 传统风格 */}
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold text-sm hover:shadow-xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-yellow-400/30"
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('regenerating')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🎋</span>
                      <span>{t('regenerate')}</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowVersionManager(v => !v)}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-100 rounded-2xl font-bold text-sm hover:bg-gradient-to-r hover:from-yellow-400/30 hover:to-orange-400/30 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-yellow-400/30 backdrop-blur-sm"
                >
                  <span className="text-lg">📜</span>
                  <span>{t('viewVersions')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 版本管理面板 - 传统风格 */}
        {showVersionManager && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl shadow-xl border-2 border-red-200/50 dark:border-red-800/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-lg font-black">版</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('versionManagement')}</h3>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-red-200 to-transparent"></div>
              </div>
              <CoupletVersionManager
                coupletId={parseInt(coupletId)}
                currentVersion={currentVersion || undefined}
                onVersionChange={handleVersionChange}
                versions={versions}
              />
            </div>
          </div>
        )}

        {/* 对联详情主体内容 - 重新设计为传统对联布局 */}
        <div ref={contentToCaptureRef}>
          <Watermark content={isVip ? '' : t('aiCoupletWorkshop')} gap={[120, 120]}>
            {/* 多副对联展示 */}
            <div className="space-y-16">
              {/* Loading状态 - 采用时间线逻辑：只有在没有内容且正在重新生成时显示 */}
              {streamPreviewContents.length === 0 && isRegenerating && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 shadow-2xl border-2 border-red-200/50 dark:border-red-900/50 px-8 py-20 text-center">
                  {/* 传统装饰背景 */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-10 left-10 w-24 h-24">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
                        <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="absolute bottom-10 right-10 w-20 h-20">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
                        <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                              fill="none" stroke="currentColor" strokeWidth="3"/>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="relative">
                    {/* 传统印章风格加载图标 */}
                    <div className="relative w-20 h-20 mx-auto mb-8">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-xl animate-pulse"></div>
                      <div className="absolute inset-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
                        <span className="text-red-800 text-2xl font-black animate-bounce">联</span>
                      </div>
                    </div>
                    
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-4">
                      {t('aiCreating')}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                      {t('pleaseWait')}
                    </p>
                    
                    {/* 传统装饰线 */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-red-400"></div>
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                      <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-red-400"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 对联内容展示 - 采用时间线逻辑：直接显示内容，不管是否在重新生成 */}
              {(streamPreviewContents.length > 0 ? streamPreviewContents : (couplet?.contents || [])).map((content, index) => (
                <div
                  key={content.id || index}
                  className="group relative overflow-hidden bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 shadow-2xl hover:shadow-3xl border-2 border-red-200/50 dark:border-red-900/50 transition-all duration-500 rounded-3xl"
                >
                  {/* 传统装饰背景 */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <path d="M30 50 Q50 30, 70 50 Q50 70, 30 50" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 opacity-5">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
                      <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                            fill="none" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  
                  {/* 传统装饰边框 */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-red-600 rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-red-600 rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-red-600 rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-red-600 rounded-br-lg"></div>
                  
                  <div className="relative px-6 py-8 sm:px-8 sm:py-12">
                    {/* 对联编号 - 传统印章风格 */}
                    <div className="flex items-center justify-center mb-8">
                      <div className="relative inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl border-2 border-yellow-400/50">
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-red-800 text-xs font-bold">印</span>
                        </div>
                        <span className="w-3 h-3 rounded-full bg-yellow-400 mr-3 animate-pulse" />
                        <span className="font-black text-lg tracking-wider">{t('coupletNumber', { number: index + 1 })}</span>
                      </div>
                    </div>

                    {/* 传统对联布局 */}
                    <div className="flex flex-col items-center gap-8 mb-8">
                      {/* 横批 - 传统红色横幅样式 */}
                      {content.horizontalScroll && (
                        <div className="w-full max-w-2xl relative">
                          {/* 横批装饰性光晕 */}
                          <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 via-yellow-500/30 to-yellow-400/20 rounded-2xl blur-lg" />
                          <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-yellow-300 px-8 py-6 rounded-2xl shadow-2xl border-2 border-yellow-400/50">
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-800 text-xs px-4 py-1 rounded-full font-black shadow-md">
                              {t('horizontalScroll')}
                            </div>
                            <div className="text-center">
                              <div className="text-3xl sm:text-4xl font-black tracking-widest" style={{ 
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                letterSpacing: '0.3em'
                              }}>
                                {content.horizontalScroll}
                              </div>
                            </div>
                            {/* 传统印章装饰 */}
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-red-600 shadow-lg">
                              <span className="text-red-800 text-sm font-bold">印</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 上下联布局 */}
                      <div className="flex items-start justify-center gap-8 sm:gap-16 w-full max-w-6xl">
                        {/* 上联 - 右侧，竖排 */}
                        <div className="flex-1 max-w-[300px] sm:max-w-[350px] relative">
                          {/* 装饰性光晕 */}
                          <div className="absolute -inset-2 bg-gradient-to-b from-red-400/20 to-red-600/20 rounded-2xl blur-lg" />
                          <div className="relative bg-gradient-to-b from-red-600 via-red-700 to-red-800 text-yellow-100 px-6 sm:px-8 py-10 sm:py-16 rounded-2xl shadow-2xl border-2 border-yellow-300/50 min-h-[450px] sm:min-h-[550px] flex flex-col items-center justify-center">
                            {/* 上联标签 */}
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-800 text-xs px-4 py-1 rounded-full font-black shadow-md">
                              {t('upperLine')}
                            </div>
                            
                            {/* 装饰性花纹 */}
                            <div className="absolute top-6 left-6 w-8 h-8 border-2 border-yellow-300/40 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-yellow-300/60 rounded-full"></div>
                            </div>
                            <div className="absolute bottom-6 right-6 w-8 h-8 border-2 border-yellow-300/40 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-yellow-300/60 rounded-full"></div>
                            </div>
                            
                            <div 
                              className="text-2xl sm:text-3xl font-black leading-[2.8] text-center break-all"
                              style={{ 
                                writingMode: 'vertical-rl',
                                textOrientation: 'upright',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                                letterSpacing: '0.2em'
                              }}
                            >
                              {content.upperLine || `（${t('regenerating')}）`}
                            </div>
                          </div>
                        </div>

                        {/* 中间装饰区域 */}
                        <div className="w-6 sm:w-12 flex-shrink-0 flex items-center justify-center">
                          <div className="w-full h-40 bg-gradient-to-b from-yellow-400/30 via-red-400/20 to-yellow-400/30 rounded-full shadow-inner"></div>
                        </div>

                        {/* 下联 - 左侧，竖排 */}
                        <div className="flex-1 max-w-[300px] sm:max-w-[350px] relative">
                          {/* 装饰性光晕 */}
                          <div className="absolute -inset-2 bg-gradient-to-b from-red-400/20 to-red-600/20 rounded-2xl blur-lg" />
                          <div className="relative bg-gradient-to-b from-red-600 via-red-700 to-red-800 text-yellow-100 px-6 sm:px-8 py-10 sm:py-16 rounded-2xl shadow-2xl border-2 border-yellow-300/50 min-h-[450px] sm:min-h-[550px] flex flex-col items-center justify-center">
                            {/* 下联标签 */}
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-800 text-xs px-4 py-1 rounded-full font-black shadow-md">
                              {t('lowerLine')}
                            </div>
                            
                            {/* 装饰性花纹 */}
                            <div className="absolute top-6 right-6 w-8 h-8 border-2 border-yellow-300/40 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-yellow-300/60 rounded-full"></div>
                            </div>
                            <div className="absolute bottom-6 left-6 w-8 h-8 border-2 border-yellow-300/40 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-yellow-300/60 rounded-full"></div>
                            </div>
                            
                            <div 
                              className="text-2xl sm:text-3xl font-black leading-[2.8] text-center break-all"
                              style={{ 
                                writingMode: 'vertical-rl',
                                textOrientation: 'upright',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                                letterSpacing: '0.2em'
                              }}
                            >
                              {content.lowerLine || `（${t('regenerating')}）`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 赏析区域 - 传统卷轴样式 */}
                    {content.appreciation && (
                      <div className="mt-12 relative">
                        {/* 卷轴装饰 */}
                        <div className="absolute -top-2 left-0 right-0 h-3 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 dark:from-amber-800 dark:via-amber-700 dark:to-amber-800 rounded-t-2xl shadow-lg" />
                        <div className="relative bg-gradient-to-br from-amber-50/95 via-yellow-50/95 to-amber-50/95 dark:from-amber-950/60 dark:via-yellow-950/40 dark:to-amber-950/60 border-2 border-amber-300/60 dark:border-amber-700/60 rounded-2xl px-8 py-8 shadow-xl backdrop-blur-sm">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white text-xl font-black">📖</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-black text-amber-800 dark:text-amber-200">
                                📜 {t('appreciation')}
                              </span>
                              <span className="text-sm px-3 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700">
                                {t('aiAnalysis')}
                              </span>
                            </div>
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-amber-300 to-transparent"></div>
                          </div>
                          <div className="bg-gradient-to-br from-white/80 to-amber-50/80 dark:from-gray-800/80 dark:to-amber-900/30 rounded-xl p-6 border border-amber-200 dark:border-amber-800 shadow-inner">
                            <p className="text-base sm:text-lg leading-relaxed text-amber-900 dark:text-amber-100 whitespace-pre-line" style={{ 
                              textIndent: '2em',
                              lineHeight: '2.2'
                            }}>
                              {content.appreciation}
                            </p>
                          </div>
                        </div>
                        <div className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 dark:from-amber-800 dark:via-amber-700 dark:to-amber-800 rounded-b-2xl shadow-lg" />
                      </div>
                    )}
                  </div>
                  
                  {/* 悬停光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
                </div>
              ))}

              {/* 空状态 - 采用时间线逻辑：只有在内容为空且不在重新生成时显示 */}
              {!isRegenerating && streamPreviewContents.length === 0 && (couplet?.contents?.length || 0) === 0 && (
                <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50/60 to-amber-50/60 dark:from-gray-900/60 dark:to-gray-800/60 px-8 py-20 text-center">
                  {/* 传统装饰背景 */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-10 left-10 w-24 h-24">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="3"/>
                        <path d="M35 50 Q50 35, 65 50 Q50 65, 35 50" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="absolute bottom-10 right-10 w-20 h-20">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-orange-600">
                        <path d="M20 20 L80 20 L80 40 L40 40 L40 60 L80 60 L80 80 L20 80 L20 60 L60 60 L60 40 L20 40 Z" 
                              fill="none" stroke="currentColor" strokeWidth="3"/>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="text-6xl mb-6">🏮</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      {t('noContentToShow')}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                      {t('clickRegenerateHint')}
                    </p>
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <span className="text-xl mr-2">🎋</span>
                      <span>{t('startCreating')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Watermark>
        </div>

        {/* 操作按钮区域 - 传统风格 */}
        <div className="mt-16 flex flex-col gap-6 sm:flex-row sm:gap-6 justify-center items-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
            {/* 保存图片按钮 */}
            <button
              onClick={handleSaveAsImage}
              className="group relative px-6 py-4 rounded-2xl font-bold text-lg border-2 transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-br from-white/90 to-red-50/80 dark:from-gray-800/90 dark:to-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 hover:shadow-xl active:scale-95 overflow-hidden"
            >
              {/* 按钮装饰背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-lg">🖼️</span>
              </div>
              <span className="relative">{t('saveAsImage')}</span>
            </button>

            {/* 导出PDF按钮 */}
            <button
              onClick={handleExportAsPdf}
              className="group relative px-6 py-4 rounded-2xl font-bold text-lg border-2 transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-br from-white/90 to-orange-50/80 dark:from-gray-800/90 dark:to-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-xl active:scale-95 overflow-hidden"
            >
              {/* 按钮装饰背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-lg">📄</span>
              </div>
              <span className="relative">{t('exportPdf')}</span>
            </button>

            {/* 点赞按钮 */}
            <div className="group relative rounded-2xl font-bold text-lg border-2 transition-all duration-300 bg-gradient-to-br from-white/90 to-yellow-50/80 dark:from-gray-800/90 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 hover:shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <LikeButton />
            </div>

            {/* 收藏按钮 */}
            <div className="group relative rounded-2xl font-bold text-lg border-2 transition-all duration-300 bg-gradient-to-br from-white/90 to-green-50/80 dark:from-gray-800/90 dark:to-green-900/30 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <FavoriteButton />
            </div>
          </div>
        </div>

        {/* 评论区 - 传统风格 */}
        <div className="mt-16">
          <div className="bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-red-900/30 rounded-3xl shadow-xl border-2 border-red-200/50 dark:border-red-800/50 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-black">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('commentSection')}</h3>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-red-200 to-transparent"></div>
            </div>
            <CommentSection />
          </div>
        </div>
      </div>
    </div>
  )
}

