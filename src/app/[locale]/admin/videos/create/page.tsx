'use client'

import { UploadOutlined } from '@ant-design/icons'
import { Form, Button, message, InputNumber, Select, Upload } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import I18nForm from '@/components/I18nForm'
import { withPagePermission } from '@/lib/withPagePermission'


const { Option } = Select

function CreateVideoPage() {
  const t = useTranslations('admin')
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [i18nValues, setI18nValues] = useState<Record<string, Record<string, string>>>({})
  const [videoFile, setVideoFile] = useState<UploadFile | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`
  }

  const handleVideoUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'video')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('common.error'))
      }

      const data = await response.json()

      // 计算视频时长
      const video = document.createElement('video')
      video.preload = 'metadata'

      // 使用 Promise 包装视频加载过程
      const duration = await new Promise<number>((resolve) => {
        video.onloadedmetadata = () => {
          const duration = Math.round(video.duration)
          URL.revokeObjectURL(video.src)
          resolve(duration)
        }
        video.src = URL.createObjectURL(file)
      })

      // 设置文件信息
      form.setFieldValue('url', typeof data.url === 'string' ? data.url : data.url?.url || '')
      form.setFieldValue('filename', file.name)
      form.setFieldValue('filesize', formatFileSize(file.size))
      form.setFieldValue('filetype', file.type)
      form.setFieldValue('duration', duration)

      setVideoFile({
        uid: '-1',
        name: file.name,
        status: 'done',
        url: typeof data.url === 'string' ? data.url : data.url?.url || '',
      })

      return false // 阻止默认上传行为
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('common.error'))
      return false
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const formData = {
        ...values,
        ...i18nValues,
        url: form.getFieldValue('url'),
        filename: form.getFieldValue('filename'),
        filesize: form.getFieldValue('filesize'),
        filetype: form.getFieldValue('filetype'),
        duration: form.getFieldValue('duration'),
        status: values.status || 'draft',
        views: values.views || 0,
        sort: values.sort || 0,
      }

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        message.success(t('common.createSuccess'))
        router.push('/admin/videos')
      } else {
        const error = await response.json()
        message.error(error.message || t('common.error'))
      }
    } catch (error) {
      message.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{t('videos.addVideo')}</h1>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="max-w-2xl"
      >
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('common.i18nFields')}</h2>
          <I18nForm
            fields={[
              {
                name: 'title',
                label: t('videos.form.title'),
                required: true,
                rules: [{ required: true, message: t('videos.enterTitle') }],
              },
              {
                name: 'description',
                label: t('videos.form.description'),
                type: 'textarea',
                rows: 4,
              },
            ]}
            value={i18nValues}
            onChange={setI18nValues}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">{t('common.basicFields')}</h2>

          <Form.Item
            label={t('videos.form.videoFile')}
            required
          >
            <Upload
              accept="video/*"
              maxCount={1}
              beforeUpload={handleVideoUpload}
              fileList={videoFile ? [videoFile] : []}
              onRemove={() => {
                setVideoFile(null)
                form.setFieldValue('url', '')
                form.setFieldValue('duration', undefined)
                form.setFieldValue('filename', '')
                form.setFieldValue('filesize', '')
                form.setFieldValue('filetype', '')
              }}
              showUploadList={{ showRemoveIcon: true }}
            >
              <Button icon={<UploadOutlined />}>{t('videos.uploadVideo')}</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="views"
            label={t('videos.form.views')}
            initialValue={0}
          >
            <InputNumber min={0} placeholder={t('videos.enterViews')} />
          </Form.Item>

          <Form.Item
            name="status"
            label={t('videos.form.status')}
            initialValue="draft"
          >
            <Select>
              <Option value="draft">{t('videos.statusDraft')}</Option>
              <Option value="published">{t('videos.statusPublished')}</Option>
              <Option value="archived">{t('videos.statusArchived')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="sort"
            label={t('videos.form.sort')}
            initialValue={0}
          >
            <InputNumber min={0} placeholder={t('videos.enterSort')} />
          </Form.Item>
        </div>

        <Form.Item name="url" initialValue="" noStyle><input type="hidden" /></Form.Item>
        <Form.Item name="filename" initialValue="" noStyle><input type="hidden" /></Form.Item>
        <Form.Item name="filesize" initialValue="" noStyle><input type="hidden" /></Form.Item>
        <Form.Item name="filetype" initialValue="" noStyle><input type="hidden" /></Form.Item>
        <Form.Item name="duration" initialValue={0} noStyle><input type="hidden" /></Form.Item>

        <Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => router.back()}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('common.save')}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

export default withPagePermission(CreateVideoPage, {
  permission: 'video.create'
})
