'use client'
import { PlusOutlined, DeleteOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons'
import { Card, Table, Button, Space, Modal, Upload, message, Image, Popconfirm, Tabs, Progress } from 'antd'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'
import { withPagePermission } from '@/lib/withPagePermission'
import { uploadFile, UploadType } from '@/lib/upload'

interface ResourceItem {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  created_at: string;
}

function ResourcesPage() {
  const t = useTranslations('admin')
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [activeTab, setActiveTab] = useState('images')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // 获取资源列表
  const fetchResources = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/resources', {
        credentials: 'include',
      })
      const data = await res.json()
      setResources(Array.isArray(data) ? data : [])
    } catch (error) {
      message.error(t('common.error'))
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  // 删除资源
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        message.success(t('common.deleteSuccess'))
        fetchResources()
      } else {
        message.error(t('common.deleteError'))
      }
    } catch (error) {
      message.error(t('common.deleteError'))
    }
  }

  // 预览资源
  const handlePreview = (file: ResourceItem) => {
    setPreviewUrl(file.url)
    setPreviewTitle(file.name)
    setPreviewVisible(true)
  }

  // 上传资源 - 使用分片上传
  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      // 使用分片上传功能
      const uploadType: UploadType = activeTab === 'images' ? 'image' : 'video'
      const result = await uploadFile(file, uploadType, {
        onProgress: (percent) => {
          setUploadProgress(percent)
        }
      })

      if (result.success && result.url) {
        // 保存资源信息到数据库
        const resourceData = {
          name: file.name,
          url: result.url,
          size: `${(file.size / 1024).toFixed(2)} KB`,
          type: file.type,
        }

        const res = await fetch('/api/admin/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resourceData),
          credentials: 'include',
        })

        if (res.ok) {
          message.success(t('common.createSuccess'))
          fetchResources()
        } else {
          const data = await res.json()
          message.error(data.error || t('common.error'))
        }
      } else {
        message.error(result.error || t('common.error'))
      }
    } catch (error) {
      console.error('上传失败:', error)
      message.error(t('common.error'))
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success(t('resources.linkCopied'))
    }).catch(() => {
      message.error(t('common.error'))
    })
  }

  const columns = [
    {
      title: activeTab === 'images' ? t('resources.imageTab') : t('resources.videoTab'),
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        activeTab === 'images' ? (
          <Image
            src={url}
            alt={t('resources.preview')}
            width={100}
            height={100}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <video
            src={url}
            width={100}
            height={100}
            style={{ objectFit: 'cover' }}
          />
        )
      ),
    },
    {
      title: t('resources.fileName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('resources.fileSize'),
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: t('resources.fileType'),
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: t('resources.uploadTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: any) => {
        try {
          return date ? new Date(date).toLocaleString() : '-'
        } catch {
          return '-'
        }
      },
    },
    {
      title: t('common.actions'),
      key: 'action',
      render: (_: any, record: ResourceItem) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            {t('resources.preview')}
          </Button>
          <Button
            type="link"
            icon={<LinkOutlined />}
            onClick={() => handleCopyLink(record.url)}
          >
            {t('resources.copyLink')}
          </Button>
          <Popconfirm
            title={t('common.deleteConfirm')}
            description={t('resources.deleteWarning')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const items = [
    {
      key: 'images',
      label: t('resources.imageTab'),
      children: (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" />
          <div className="flex items-center gap-4">
            {uploading && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">上传中...</span>
                <Progress 
                  percent={uploadProgress} 
                  size="small" 
                  style={{ width: 200 }}
                  status={uploadProgress === 100 ? 'success' : 'active'}
                />
              </div>
            )}
            <Upload
              accept="image/*"
              showUploadList={false}
              disabled={uploading}
              beforeUpload={(file) => {
                // 检查文件大小 - 图片支持最大50MB
                const maxSize = 50 * 1024 * 1024 // 50MB
                if (file.size > maxSize) {
                  message.error('图片文件大小不能超过50MB')
                  return false
                }
                handleUpload(file)
                return false
              }}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                loading={uploading}
                disabled={uploading}
              >
                {uploading ? '上传中...' : t('resources.uploadImage')}
              </Button>
            </Upload>
          </div>
        </div>
      ),
    },
    {
      key: 'videos',
      label: t('resources.videoTab'),
      children: (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" />
          <div className="flex items-center gap-4">
            {uploading && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">上传中...</span>
                <Progress 
                  percent={uploadProgress} 
                  size="small" 
                  style={{ width: 200 }}
                  status={uploadProgress === 100 ? 'success' : 'active'}
                />
              </div>
            )}
            <Upload
              accept="video/*"
              showUploadList={false}
              disabled={uploading}
              beforeUpload={(file) => {
                // 检查文件大小 - 视频支持最大500MB
                const maxSize = 500 * 1024 * 1024 // 500MB
                if (file.size > maxSize) {
                  message.error('视频文件大小不能超过500MB')
                  return false
                }
                handleUpload(file)
                return false
              }}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                loading={uploading}
                disabled={uploading}
              >
                {uploading ? '上传中...' : t('resources.uploadVideo')}
              </Button>
            </Upload>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
        />

        <Table
          columns={columns}
          dataSource={resources.filter(resource =>
            activeTab === 'images'
              ? resource.type.startsWith('image/')
              : resource.type.startsWith('video/'),
          )}
          rowKey="id"
          loading={loading}
          pagination={{ showSizeChanger: true }}
        />
      </Card>

      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        {activeTab === 'images' ? (
          <img alt={previewTitle} style={{ width: '100%' }} src={previewUrl} />
        ) : (
          <video controls style={{ width: '100%' }} src={previewUrl} />
        )}
      </Modal>
    </div>
  )
}

// 使用页面级权限校验
export default withPagePermission(ResourcesPage, {
  permission: 'resource.read'
})
