const fs = require('fs')
const path = require('path')

function getAllKeyPaths(obj, prefix = '') {
  let paths = []
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    const currentPath = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths = paths.concat(getAllKeyPaths(value, currentPath))
    } else {
      paths.push(currentPath)
    }
  }
  return paths
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current)) {
      current[key] = {}
    }
    current = current[key]
  }
  current[keys[keys.length - 1]] = value
}

function getNestedValue(obj, path) {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }
  return current
}

function mergeStructures(zhObj, enObj) {
  const zhKeys = getAllKeyPaths(zhObj)
  const enKeys = getAllKeyPaths(enObj)
  const allKeys = new Set([...zhKeys, ...enKeys])
  
  const mergedZh = {}
  const mergedEn = {}
  
  // 按层级排序所有 key
  const sortedKeys = Array.from(allKeys).sort((a, b) => {
    const aDepth = a.split('.').length
    const bDepth = b.split('.').length
    if (aDepth !== bDepth) return aDepth - bDepth
    return a.localeCompare(b)
  })
  
  for (const key of sortedKeys) {
    const zhValue = getNestedValue(zhObj, key)
    const enValue = getNestedValue(enObj, key)
    
    // 如果 zh.json 中有值，使用它；否则使用 en.json 的值或默认值
    if (zhValue !== undefined) {
      setNestedValue(mergedZh, key, zhValue)
    } else {
      setNestedValue(mergedZh, key, enValue || `[${key}]`)
    }
    
    // 如果 en.json 中有值，使用它；否则使用 zh.json 的值或默认值
    if (enValue !== undefined) {
      setNestedValue(mergedEn, key, enValue)
    } else {
      setNestedValue(mergedEn, key, zhValue || `[${key}]`)
    }
  }
  
  return { mergedZh, mergedEn }
}

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2)
}

function main() {
  console.log('🔧 开始自动修复 i18n key 结构...')
  
  const zhPath = path.resolve(__dirname, '../messages/zh.json')
  const enPath = path.resolve(__dirname, '../messages/en.json')
  
  try {
    const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'))
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
    
    console.log('📊 分析现有结构...')
    const zhKeys = getAllKeyPaths(zh)
    const enKeys = getAllKeyPaths(en)
    
    console.log(`zh.json 共有 ${zhKeys.length} 个 key`)
    console.log(`en.json 共有 ${enKeys.length} 个 key`)
    
    const { mergedZh, mergedEn } = mergeStructures(zh, en)
    
    // 备份原文件
    const backupDir = path.resolve(__dirname, '../backup')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    fs.writeFileSync(path.join(backupDir, `zh.json.backup.${timestamp}`), fs.readFileSync(zhPath))
    fs.writeFileSync(path.join(backupDir, `en.json.backup.${timestamp}`), fs.readFileSync(enPath))
    
    console.log('💾 已备份原文件到 backup 目录')
    
    // 写入修复后的文件
    fs.writeFileSync(zhPath, formatJSON(mergedZh))
    fs.writeFileSync(enPath, formatJSON(mergedEn))
    
    console.log('✅ 修复完成！')
    console.log('📝 修复内容：')
    console.log('- 同步了所有缺失的 key')
    console.log('- 保持了原有的翻译内容')
    console.log('- 统一了 key 的层级结构')
    console.log('- 按字母顺序排序了同级 key')
    
    // 验证修复结果
    const finalZhKeys = getAllKeyPaths(mergedZh)
    const finalEnKeys = getAllKeyPaths(mergedEn)
    
    if (finalZhKeys.length === finalEnKeys.length) {
      console.log(`\n🎉 修复成功！两个文件现在都有 ${finalZhKeys.length} 个 key，结构完全一致。`)
    } else {
      console.log('\n⚠️  警告：修复后 key 数量仍不一致，请手动检查。')
    }
    
  } catch (error) {
    console.error('❌ 修复失败：', error.message)
    process.exit(1)
  }
}

main() 