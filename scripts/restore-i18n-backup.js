const fs = require('fs')
const path = require('path')

function getLatestBackup(backupDir) {
  if (!fs.existsSync(backupDir)) {
    console.log('❌ 备份目录不存在')
    return null
  }
  
  const files = fs.readdirSync(backupDir)
  const zhBackups = files.filter(f => f.startsWith('zh.json.backup.'))
  const enBackups = files.filter(f => f.startsWith('en.json.backup.'))
  
  if (zhBackups.length === 0 || enBackups.length === 0) {
    console.log('❌ 没有找到备份文件')
    return null
  }
  
  // 按时间戳排序，获取最新的备份
  zhBackups.sort().reverse()
  enBackups.sort().reverse()
  
  return {
    zh: zhBackups[0],
    en: enBackups[0]
  }
}

function listBackups(backupDir) {
  if (!fs.existsSync(backupDir)) {
    console.log('❌ 备份目录不存在')
    return
  }
  
  const files = fs.readdirSync(backupDir)
  const zhBackups = files.filter(f => f.startsWith('zh.json.backup.'))
  const enBackups = files.filter(f => f.startsWith('en.json.backup.'))
  
  console.log('\n📁 可用的备份文件:')
  console.log('\nzh.json 备份:')
  zhBackups.sort().reverse().forEach((file, index) => {
    const timestamp = file.replace('zh.json.backup.', '')
    console.log(`  ${index + 1}. ${file} (${timestamp})`)
  })
  
  console.log('\nen.json 备份:')
  enBackups.sort().reverse().forEach((file, index) => {
    const timestamp = file.replace('en.json.backup.', '')
    console.log(`  ${index + 1}. ${file} (${timestamp})`)
  })
}

function restoreBackup(backupName = null) {
  const backupDir = path.resolve(__dirname, '../backup')
  const zhPath = path.resolve(__dirname, '../messages/zh.json')
  const enPath = path.resolve(__dirname, '../messages/en.json')
  
  console.log('🔄 开始恢复备份...')
  
  if (!backupName) {
    // 自动选择最新备份
    const latest = getLatestBackup(backupDir)
    if (!latest) {
      console.log('❌ 无法找到备份文件')
      return false
    }
    backupName = latest
  }
  
  const zhBackupPath = path.join(backupDir, backupName.zh)
  const enBackupPath = path.join(backupDir, backupName.en)
  
  if (!fs.existsSync(zhBackupPath) || !fs.existsSync(enBackupPath)) {
    console.log('❌ 备份文件不存在')
    return false
  }
  
  try {
    // 备份当前文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const currentBackupDir = path.resolve(__dirname, '../messages/current-backup')
    if (!fs.existsSync(currentBackupDir)) {
      fs.mkdirSync(currentBackupDir, { recursive: true })
    }
    
    if (fs.existsSync(zhPath)) {
      fs.writeFileSync(
        path.join(currentBackupDir, `zh.json.current.${timestamp}`),
        fs.readFileSync(zhPath)
      )
    }
    if (fs.existsSync(enPath)) {
      fs.writeFileSync(
        path.join(currentBackupDir, `en.json.current.${timestamp}`),
        fs.readFileSync(enPath)
      )
    }
    
    // 恢复备份文件
    fs.copyFileSync(zhBackupPath, zhPath)
    fs.copyFileSync(enBackupPath, enPath)
    
    console.log('✅ 恢复成功！')
    console.log(`📁 当前文件已备份到: ${currentBackupDir}`)
    console.log(`🔄 已恢复的备份: ${backupName.zh}, ${backupName.en}`)
    
    return true
  } catch (error) {
    console.error('❌ 恢复失败:', error.message)
    return false
  }
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'list':
      const backupDir = path.resolve(__dirname, '../backup')
      listBackups(backupDir)
      break
      
    case 'restore':
      const backupName = args[1] ? { zh: args[1], en: args[1].replace('zh.json.backup.', 'en.json.backup.') } : null
      restoreBackup(backupName)
      break
      
    case 'latest':
      restoreBackup()
      break
      
    default:
      console.log('📖 使用方法:')
      console.log('  node scripts/restore-i18n-backup.js list          # 列出所有备份')
      console.log('  node scripts/restore-i18n-backup.js latest        # 恢复最新备份')
      console.log('  node scripts/restore-i18n-backup.js restore <file> # 恢复指定备份')
      console.log('\n示例:')
      console.log('  node scripts/restore-i18n-backup.js list')
      console.log('  node scripts/restore-i18n-backup.js latest')
      console.log('  node scripts/restore-i18n-backup.js restore zh.json.backup.2024-01-15T10-30-00-000Z')
  }
}

main() 