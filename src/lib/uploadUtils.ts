import { message } from 'antd'

import { ImageUploadType } from '@/components/ImageUpload'

/**
 * 通用文件上传函数
 * @param file 要上传的文件
 * @param type 上传类型
 * @param onProgress 进度回调函数
 * @param t 翻译函数
 * @returns 上传结果对象，包含url等信息
 */
export const uploadFile = async (
  file: File,
  type: ImageUploadType,
  onProgress?: (percent: number) => void,
  t?: (key: string) => string,
): Promise<{ url: string; success: boolean }> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    // 如果需要进度条，使用XMLHttpRequest
    if (onProgress) {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/admin/upload', true)

        // 监听上传进度
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            onProgress(progress)
          }
        }

        // 处理响应
        xhr.onload = () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText)
            if (t) message.success(t('common.operationSuccess'))
            resolve({ url: result.url, success: true })
          } else {
            if (t) message.error(t('common.error'))
            resolve({ url: '', success: false })
          }
        }

        xhr.onerror = () => {
          if (t) message.error(t('common.error'))
          resolve({ url: '', success: false })
        }

        xhr.send(formData)
      })
    }
    // 如果不需要进度条，使用fetch
    else {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        if (t) message.error(t('common.error'))
        return { url: '', success: false }
      }

      const data = await response.json()
      if (t) message.success(t('common.operationSuccess'))
      return { url: data.url, success: true }
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    if (t) message.error(t('common.error'))
    return { url: '', success: false }
  }
}
