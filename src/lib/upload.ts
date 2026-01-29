/**
 * 通用文件上传工具
 * 支持多种文件类型：avatar, image, prompt, project, document等
 * 使用分片上传处理大文件，突破Vercel Blob 4.5MB限制
 */

export type UploadType = 
  | 'avatar'        // 用户头像
  | 'image'         // 通用图片
  | 'prompt'        // 提示词封面
  | 'project'       // 项目封面
  | 'document'      // 文档
  | 'video'         // 视频
  | 'audio'         // 音频

export interface UploadResult {
  success: boolean
  url?: string
  filename?: string
  type?: string
  size?: number
  contentType?: string
  error?: string
}

export interface UploadOptions {
  onProgress?: (percent: number) => void
  maxSize?: number // MB
  allowedTypes?: string[] // MIME types
  subfolder?: string // 子文件夹路径，如 "ABC123/preview"
}

// Vercel Blob单次上传限制为4.5MB
const CHUNK_SIZE = 4 * 1024 * 1024 // 4MB per chunk (留一些缓冲)

// 默认文件大小限制（单位：MB）- 支持分片上传，可以处理更大的文件
export const DEFAULT_SIZE_LIMITS: Record<UploadType, number> = {
  avatar: 10,      // 头像支持更大尺寸
  image: 50,       // 图片支持50MB
  prompt: 20,      // 提示词封面支持20MB
  project: 20,     // 项目封面支持20MB
  document: 200,   // 文档支持200MB
  video: 500,      // 视频支持500MB
  audio: 100,      // 音频支持100MB
}

// 默认允许的文件类型
export const DEFAULT_ALLOWED_TYPES: Record<UploadType, string[]> = {
  avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  prompt: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  project: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
}

/**
 * 计算文件MD5哈希值
 */
const calculateFileHash = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const hashBuffer = await crypto.subtle.digest('MD5', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      resolve(hashHex)
    }
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 创建文件分片
 */
const createFileChunks = (file: File): Blob[] => {
  const chunks: Blob[] = []
  let start = 0
  
  while (start < file.size) {
    const end = Math.min(start + CHUNK_SIZE, file.size)
    chunks.push(file.slice(start, end))
    start = end
  }
  
  return chunks
}

/**
 * 分片上传文件
 */
const uploadFileChunks = async (
  file: File,
  type: UploadType,
  onProgress?: (percent: number) => void,
  subfolder?: string
): Promise<UploadResult> => {
  try {
    // 计算文件哈希
    const fileHash = await calculateFileHash(file)
    const chunks = createFileChunks(file)
    const totalChunks = chunks.length

    // 如果文件小于分片大小，直接上传
    if (totalChunks === 1) {
      return await uploadSingleFile(file, type, onProgress, subfolder)
    }

    // 上传分片
    const uploadPromises = chunks.map(async (chunk, index) => {
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('index', index.toString())
      formData.append('fileHash', fileHash)
      formData.append('type', type)
      formData.append('totalChunks', totalChunks.toString())
      formData.append('originalName', file.name)
      if (subfolder) {
        formData.append('subfolder', subfolder)
      }

      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '分片上传失败')
      }

      // 更新进度
      if (onProgress) {
        const progress = Math.round(((index + 1) / totalChunks) * 100)
        onProgress(progress)
      }

      return result
    })

    await Promise.all(uploadPromises)

    // 合并分片
    const mergeResponse = await fetch('/api/upload/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileHash,
        type,
        totalChunks,
        originalName: file.name,
        subfolder
      }),
    })

    const mergeResult = await mergeResponse.json()

    if (!mergeResult.success) {
      throw new Error(mergeResult.error || '文件合并失败')
    }

    return {
      success: true,
      url: mergeResult.url,
      filename: mergeResult.filename,
      type: mergeResult.type,
      size: mergeResult.size,
      contentType: mergeResult.contentType,
    }

  } catch (error) {
    console.error('分片上传失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '分片上传失败'
    }
  }
}

/**
 * 单文件上传（小于分片大小）
 */
const uploadSingleFile = async (
  file: File,
  type: UploadType,
  onProgress?: (percent: number) => void,
  subfolder?: string
): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  if (subfolder) {
    formData.append('subfolder', subfolder)
  }

  if (onProgress) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total)
          onProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          resolve({
            success: result.success,
            url: result.url,
            filename: result.filename,
            type: result.type,
            size: result.size,
            contentType: result.contentType,
            error: result.error
          })
        } else {
          const error = JSON.parse(xhr.responseText)
          resolve({
            success: false,
            error: error.error || '上传失败'
          })
        }
      }

      xhr.onerror = () => {
        resolve({
          success: false,
          error: '网络错误，上传失败'
        })
      }

      xhr.open('POST', '/api/upload', true)
      xhr.send(formData)
    })
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()

  return {
    success: result.success,
    url: result.url,
    filename: result.filename,
    type: result.type,
    size: result.size,
    contentType: result.contentType,
    error: result.error
  }
}

/**
 * 通用文件上传函数
 * @param file 要上传的文件
 * @param type 上传类型
 * @param options 上传选项
 * @returns 上传结果
 */
export const uploadFile = async (
  file: File,
  type: UploadType,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    const { onProgress, maxSize, allowedTypes, subfolder } = options
    
    // 验证文件
    const validation = validateFile(file, type, maxSize, allowedTypes)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // 根据文件大小决定使用分片上传还是单文件上传
    if (file.size > CHUNK_SIZE) {
      return await uploadFileChunks(file, type, onProgress, subfolder)
    } else {
      return await uploadSingleFile(file, type, onProgress, subfolder)
    }

  } catch (error) {
    console.error('文件上传失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    }
  }
}

/**
 * 验证文件
 */
const validateFile = (
  file: File,
  type: UploadType,
  maxSize?: number,
  allowedTypes?: string[]
): { valid: boolean; error?: string } => {
  // 检查文件大小
  const sizeLimit = maxSize || DEFAULT_SIZE_LIMITS[type]
  if (file.size > sizeLimit * 1024 * 1024) {
    return {
      valid: false,
      error: `文件大小不能超过 ${sizeLimit}MB`
    }
  }

  // 检查文件类型
  const types = allowedTypes || DEFAULT_ALLOWED_TYPES[type]
  if (!types.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件类型，请上传 ${types.join(', ')} 格式的文件`
    }
  }

  return { valid: true }
}

/**
 * 删除文件
 * @param url 文件URL
 * @returns 删除结果
 */
export const deleteFile = async (url: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    const result = await response.json()

    return {
      success: result.success,
      error: result.error
    }
  } catch (error) {
    console.error('删除文件失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败'
    }
  }
}

/**
 * 获取文件预览URL（用于显示）
 * @param url 原始文件URL
 * @param options 预览选项
 * @returns 预览URL
 */
export const getPreviewUrl = (url: string, options: {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
} = {}): string => {
  if (!url) return ''
  
  // 如果是Vercel Blob URL，可以添加查询参数进行图片处理
  if (url.includes('blob.vercel-storage.com')) {
    const params = new URLSearchParams()
    if (options.width) params.append('w', options.width.toString())
    if (options.height) params.append('h', options.height.toString())
    if (options.quality) params.append('q', options.quality.toString())
    if (options.format) params.append('f', options.format)
    
    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }
  
  return url
}
