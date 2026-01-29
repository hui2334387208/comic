'use client'

import frontmatter from '@bytemd/plugin-frontmatter'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import mediumZoom from '@bytemd/plugin-medium-zoom'
import { Editor } from '@bytemd/react'
import { Form, Input, Tabs } from 'antd'
import { useState } from 'react'
import 'bytemd/dist/index.css'
import 'highlight.js/styles/vs.css'

const { TextArea } = Input

// 支持的语言列表
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
]

const plugins = [
  gfm(),
  highlight(),
  frontmatter(),
  mediumZoom(),
]

interface I18nField {
  name: string;
  label: string;
  type?: 'input' | 'textarea' | 'editor';
  required?: boolean;
  placeholder?: string;
  rules?: any[];
  rows?: number;
}

interface I18nFormProps {
  fields: I18nField[];
  value?: Record<string, Record<string, string>>;
  onChange?: (value: Record<string, Record<string, string>>) => void;
}

export default function I18nForm({ fields, value = {}, onChange }: I18nFormProps) {
  const [activeLang, setActiveLang] = useState(LANGUAGES[0]?.code || 'en')

  const handleChange = (fieldName: string, lang: string, newValue: string) => {
    if (!onChange) return

    const newValues = {
      ...value,
      [fieldName]: {
        ...(value[fieldName] || {}),
        [lang]: newValue,
      },
    }
    onChange(newValues)
  }

  const renderInput = (field: I18nField, lang: string) => {
    const fieldValue = value[field.name]?.[lang] ?? ''

    switch (field.type) {
      case 'textarea':
        return (
          <TextArea
            value={fieldValue}
            onChange={e => handleChange(field.name, lang, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
          />
        )
      case 'editor':
        return (
          <Editor
            value={fieldValue}
            plugins={plugins}
            onChange={v => handleChange(field.name, lang, v)}
            uploadImages={async (files) => {
              const formData = new FormData()
              formData.append('file', files[0])
              formData.append('type', 'article')
              const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
              })
              const data = await response.json()
              return [{
                url: data.url,
                title: files[0].name,
                alt: files[0].name,
              }]
            }}
          />
        )
      default:
        return (
          <Input
            value={fieldValue}
            onChange={e => handleChange(field.name, lang, e.target.value)}
            placeholder={field.placeholder}
          />
        )
    }
  }

  return (
    <div>
      <Tabs
        activeKey={activeLang}
        onChange={setActiveLang}
        items={LANGUAGES.map(lang => ({
          key: lang.code,
          label: lang.name,
          children: (
            <div key={lang.code} className="mt-4" style={{ display: activeLang === lang.code ? 'block' : 'none' }}>
              {fields.map(field => (
                <Form.Item
                  key={`${field.name}-${lang.code}`}
                  label={`${field.label}`}
                  required={field.required}
                  rules={field.rules?.map(rule => ({
                    ...rule,
                    validator: async (_, value) => {
                      if (field.required && !value) {
                        throw new Error(rule.message)
                      }
                      return Promise.resolve()
                    },
                  }))}
                  validateTrigger={['onChange', 'onBlur']}
                >
                  <div style={{ border: field.type === 'editor' ? '1px solid #d9d9d9' : 'none', borderRadius: '6px' }}>
                    {renderInput(field, lang.code)}
                  </div>
                </Form.Item>
              ))}
            </div>
          ),
        }))}
        className="mb-4"
      />
    </div>
  )
}
