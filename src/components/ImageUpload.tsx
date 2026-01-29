'use client'

import { PlusOutlined, DeleteOutlined, SortAscendingOutlined, EyeOutlined } from '@ant-design/icons'
import { Upload, Button, Image, message, Modal, Progress, Space } from 'antd'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { uploadFile } from '@/lib/uploadUtils'

export type ImageUploadType = 'article' | 'banner' | 'image' | 'case' | 'product' | 'avatar';

interface ImageUploadProps {
  type: ImageUploadType;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  maxCount?: number;
  multiple?: boolean;
  listType?: 'picture' | 'picture-card';
  showPreview?: boolean;
  showSort?: boolean;
  showDelete?: boolean;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  type,
  value,
  onChange,
  maxCount = 1,
  multiple = false,
  listType = 'picture-card',
  showPreview = true,
  showSort = false,
  showDelete = true,
  width = 120,
  height = 120,
  style,
  className,
  disabled = false,
  required = false,
  label,
}) => {
  const t = useTranslations('admin')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // 处理单图上传
  const handleSingleUpload = async (file: File) => {
    try {
      // 先清除之前的进度
      const fileId = file.name + Date.now() // 使用唯一ID避免同名文件冲突
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

      const result = await uploadFile(
        file,
        type,
        (progress) => {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
        },
        t,
      )

      // 上传完成后清除进度
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[fileId]
        return newProgress
      })

      // 成功后直接更新值
      if (result.success && result.url) {
        // 直接调用父组件的onChange，不使用setTimeout
        onChange?.(result.url)
        return false // 阻止Upload组件默认行为
      }

      return false
    } catch (error) {
      console.error('Error uploading file:', error)
      message.error(t('common.error'))
      return false
    }
  }

  // 处理多图上传
  const handleMultipleUpload = async ({ file, onSuccess, onError }: any) => {
    try {
      // 先清除之前的进度
      const fileId = file.name + Date.now() // 使用唯一ID避免同名文件冲突
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

      const result = await uploadFile(
        file,
        type,
        (progress) => {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
        },
        t,
      )

      // 上传完成后清除进度
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[fileId]
        return newProgress
      })

      if (result.success && result.url) {
        // 安全处理值的更新
        const newValue = Array.isArray(value) ? [...value, result.url] : [result.url]
        onChange?.(newValue)
        onSuccess?.()
      } else {
        onError?.()
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      message.error(t('common.error'))
      onError?.()
    }
  }

  // 处理图片删除
  const handleRemove = async (url: string) => {
    try {
      const response = await fetch('/api/admin/upload/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': document.cookie,
        },
        body: JSON.stringify({ urls: [url] }),
      })

      if (response.ok) {
        if (Array.isArray(value)) {
          onChange?.(value.filter(item => item !== url))
        } else {
          onChange?.('')
        }
        message.success(t('common.deleteSuccess'))
      } else {
        message.error(t('common.deleteError'))
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      message.error(t('common.deleteError'))
    }
  }

  // 处理图片排序
  const handleSort = (index: number, direction: 'up' | 'down') => {
    if (!Array.isArray(value)) return
    const newValue = [...value]
    if (direction === 'up' && index > 0) {
      [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]]
    } else if (direction === 'down' && index < newValue.length - 1) {
      [newValue[index + 1], newValue[index]] = [newValue[index], newValue[index + 1]]
    }
    onChange?.(newValue)
  }

  // 处理预览
  const handlePreview = (url: string) => {
    setPreviewImage(url)
    setPreviewTitle(url.split('/').pop() || '')
    setPreviewVisible(true)
  }

  // 渲染单图上传
  const renderSingleUpload = () => {
    const imageUrl = value as string
    return (
      <div>
        <Upload
          name="file"
          listType={listType}
          showUploadList={false}
          beforeUpload={handleSingleUpload}
          maxCount={1}
          disabled={disabled}
        >
          {imageUrl ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={t('resources.imageTab')}
                  width={width}
                  height={height}
                  style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #eee', display: 'block', ...style }}
                  preview={false}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.5)',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0'
                }}
              >
                <Space>
                  {showPreview && (
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePreview(imageUrl)
                      }}
                      style={{ color: '#fff' }}
                    />
                  )}
                  {showDelete && !disabled && (
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(imageUrl)
                      }}
                      style={{ color: '#fff' }}
                    />
                  )}
                </Space>
              </div>
            </div>
          ) : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>{t('resources.uploadImage')}</div>
            </div>
          )}
        </Upload>
        {Object.entries(uploadProgress).map(([fileName, progress]) => (
          <div key={fileName} style={{ marginTop: 8 }}>
            <Progress percent={progress} size="small" />
          </div>
        ))}
      </div>
    )
  }

  // 渲染多图上传
  const renderMultipleUpload = () => {
    const imageUrls = Array.isArray(value) ? value : []
    return (
      <div>
        <Upload
          customRequest={handleMultipleUpload}
          listType={listType}
          showUploadList={false}
          multiple={multiple}
          disabled={disabled}
        >
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>{t('resources.uploadImage')}</div>
          </div>
        </Upload>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {imageUrls.map((url, idx) => (
            !!url && (
              <div key={url} style={{ position: 'relative', display: 'inline-block' }}>
                <Image
                  src={url}
                  alt={`${t('resources.image')}${idx + 1}`}
                  width={width}
                  height={height}
                  style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #eee', ...style }}
                  preview={false}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.5)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0'
                  }}
                >
                  <Space>
                    {showPreview && (
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePreview(url)
                        }}
                        style={{ color: '#fff' }}
                      />
                    )}
                    {showDelete && !disabled && (
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(url)
                        }}
                        style={{ color: '#fff' }}
                      />
                    )}
                    {showSort && !disabled && (
                      <>
                        <Button
                          type="text"
                          icon={<SortAscendingOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSort(idx, 'up')
                          }}
                          disabled={idx === 0}
                          style={{ color: '#fff' }}
                        />
                        <Button
                          type="text"
                          icon={<SortAscendingOutlined rotate={180} />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSort(idx, 'down')
                          }}
                          disabled={idx === imageUrls.length - 1}
                          style={{ color: '#fff' }}
                        />
                      </>
                    )}
                  </Space>
                </div>
              </div>
            )
          ))}
        </div>
        {Object.entries(uploadProgress).map(([fileName, progress]) => (
          <div key={fileName} style={{ marginTop: 8 }}>
            <Progress percent={progress} size="small" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {label && (
        <div style={{ marginBottom: 8 }}>
          {label}
          {required && <span style={{ color: '#f00', marginLeft: 4 }}>*</span>}
        </div>
      )}
      {maxCount === 1 ? renderSingleUpload() : renderMultipleUpload()}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt={t('resources.preview')} style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  )
}

export default ImageUpload
