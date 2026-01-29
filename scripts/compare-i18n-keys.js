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

function compareKeys(keysA, keysB, labelA, labelB) {
  const setA = new Set(keysA)
  const setB = new Set(keysB)
  const onlyInA = keysA.filter(k => !setB.has(k))
  const onlyInB = keysB.filter(k => !setA.has(k))
  if (onlyInA.length > 0) {
    console.log(`\n[${labelA}] 存在但 [${labelB}] 缺失的 key:`)
    onlyInA.forEach(k => console.log('  ' + k))
  }
  if (onlyInB.length > 0) {
    console.log(`\n[${labelB}] 存在但 [${labelA}] 缺失的 key:`)
    onlyInB.forEach(k => console.log('  ' + k))
  }
  if (onlyInA.length === 0 && onlyInB.length === 0) {
    console.log('\n✅ 两个文件的 key 结构完全一致！')
  }
}

function main() {
  const zhPath = path.resolve(__dirname, '../messages/zh.json')
  const enPath = path.resolve(__dirname, '../messages/en.json')
  const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'))
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))

  const zhKeys = getAllKeyPaths(zh)
  const enKeys = getAllKeyPaths(en)

  compareKeys(zhKeys, enKeys, 'zh.json', 'en.json')
}

main() 