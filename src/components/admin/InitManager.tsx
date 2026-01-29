'use client'

import { useState, useEffect } from 'react'
import { Card, Button, message, Progress, Typography, Steps } from 'antd'
import { 
  DatabaseOutlined, 
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

interface InitStep {
  key: string
  title: string
  description: string
  status: 'wait' | 'process' | 'finish' | 'error'
}

const InitManager = () => {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<InitStep[]>([
    {
      key: 'permissions',
      title: '初始化权限',
      description: '等待创建系统权限数据',
      status: 'wait'
    },
    {
      key: 'roles',
      title: '初始化角色',
      description: '等待创建角色并分配权限',
      status: 'wait'
    },
    {
      key: 'menus',
      title: '初始化菜单',
      description: '等待创建系统菜单结构',
      status: 'wait'
    },
    {
      key: 'admin',
      title: '创建超级管理员',
      description: '等待创建超级管理员账户',
      status: 'wait'
    }
  ])
  const [initResults, setInitResults] = useState<any>(null)

  // 检查系统是否已初始化
  useEffect(() => {
    const checkInitStatus = async () => {
      try {
        const response = await fetch('/api/admin/init-system', {
          method: 'HEAD'
        })
        if (response.status === 400) {
          // 系统已初始化
          setSteps(prev => prev.map(step => ({ ...step, status: 'finish' })))
          setInitResults({ message: '系统已初始化' })
        }
      } catch (error) {
        console.error('检查初始化状态失败:', error)
      }
    }
    checkInitStatus()
  }, [])

  // 执行系统初始化
  const handleInitSystem = async () => {
    setLoading(true)
    setCurrentStep(0)
    
    // 重置所有步骤状态，并立即开始第一个步骤
    setSteps(prev => prev.map((step, index) => 
      index === 0 
        ? { ...step, status: 'process', description: '正在创建系统权限数据...' }
        : { ...step, status: 'wait' }
    ))
    
    try {
      // 先调用初始化API
      const response = await fetch('/api/admin/init-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        // API成功后，依次显示步骤完成
        for (let i = 0; i < steps.length; i++) {
          // 如果不是第一个步骤，先更新为进行中状态
          if (i > 0) {
            const processingDescriptions = [
              '正在创建系统权限数据...',
              '正在创建角色并分配权限...',
              '正在创建系统菜单结构...',
              '正在创建超级管理员账户...'
            ]
            
            setSteps(prev => prev.map((step, index) => 
              index === i ? { 
                ...step, 
                status: 'process',
                description: processingDescriptions[i]
              } : step
            ))
            setCurrentStep(i)
          }
          
          // 模拟每个步骤的执行时间
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // 标记当前步骤为完成，并更新描述
          const stepDescriptions = [
            '权限数据创建完成',
            '角色创建并权限分配完成',
            '系统菜单结构创建完成',
            '超级管理员账户创建完成'
          ]
          
          setSteps(prev => prev.map((step, index) => 
            index === i ? { 
              ...step, 
              status: 'finish',
              description: stepDescriptions[i]
            } : step
          ))
        }
        
        setInitResults(result.data)
        message.success('系统初始化完成！')
      } else {
        // API失败，显示错误
        setSteps(prev => prev.map(step => ({ ...step, status: 'error' })))
        message.error(result.error || '系统初始化失败')
      }
    } catch (error) {
      console.error('系统初始化失败:', error)
      setSteps(prev => prev.map((step, index) => 
        index >= currentStep ? { ...step, status: 'error' } : step
      ))
      message.error('系统初始化失败')
    } finally {
      setLoading(false)
    }
  }

  const completedCount = steps.filter(step => step.status === 'finish').length
  const progress = (completedCount / steps.length) * 100
  const isCompleted = completedCount === steps.length

  return (
    <div className="max-w-4xl mx-auto">
      {/* 欢迎区域 */}
      <Card className="mb-6 text-center">
        <div className="py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <DatabaseOutlined className="text-2xl text-white" />
          </div>
          <Title level={2} className="mb-2">欢迎使用智豚管理系统</Title>
          <Text type="secondary" className="text-lg">
            请先完成系统初始化，然后开始使用各项功能
          </Text>
        </div>
      </Card>

      {/* 进度显示 */}
      <Card className="mb-6">
        <div className="mb-4">
          <Title level={4}>初始化进度</Title>
          <Progress 
            percent={progress} 
            status={isCompleted ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Text type="secondary" className="block mt-2">
            已完成 {completedCount} / {steps.length} 项
          </Text>
        </div>
      </Card>

      {/* 初始化步骤 */}
      <Card className="mb-6">
        <div className="mb-6">
          <Title level={4} className="mb-4">初始化步骤</Title>
          <Steps
            direction="vertical"
            current={currentStep}
            items={steps.map(step => ({
              title: step.title,
              description: step.description,
              status: step.status,
              icon: step.status === 'process' ? <LoadingOutlined /> : 
                    step.status === 'finish' ? <CheckCircleOutlined /> : undefined
            }))}
          />
        </div>
      </Card>

      {/* 初始化按钮 */}
      <Card className="mb-6">
        <div className="text-center">
          {!isCompleted ? (
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleInitSystem}
              className="px-8 py-2 h-auto text-lg"
            >
              {loading ? '正在初始化...' : '开始初始化系统'}
            </Button>
          ) : (
            <div className="text-center text-green-600">
              <CheckCircleOutlined className="text-2xl mr-2" />
              <Text className="text-lg">系统初始化完成！现在可以正常使用所有功能了。</Text>
            </div>
          )}
        </div>
      </Card>

      {/* 初始化结果 */}
      {initResults && (
        <Card>
          <Title level={4} className="mb-4">初始化结果</Title>
          {initResults.message ? (
            <Text>{initResults.message}</Text>
          ) : (
            <div className="space-y-4">
              {initResults.permissions && (
                <div>
                  <Text strong>权限初始化：</Text>
                  <Text className="ml-2">
                    成功 {initResults.permissions.success} / {initResults.permissions.total} 项
                    {initResults.permissions.failed > 0 && (
                      <span className="text-red-500 ml-2">
                        (失败 {initResults.permissions.failed} 项)
                      </span>
                    )}
                  </Text>
                </div>
              )}
              {initResults.roles && (
                <div>
                  <Text strong>角色初始化：</Text>
                  <Text className="ml-2">
                    成功 {initResults.roles.success} / {initResults.roles.total} 项
                    {initResults.roles.failed > 0 && (
                      <span className="text-red-500 ml-2">
                        (失败 {initResults.roles.failed} 项)
                      </span>
                    )}
                  </Text>
                </div>
              )}
              {initResults.menus && (
                <div>
                  <Text strong>菜单初始化：</Text>
                  <Text className="ml-2">
                    成功 {initResults.menus.success} / {initResults.menus.total} 项
                    {initResults.menus.failed > 0 && (
                      <span className="text-red-500 ml-2">
                        (失败 {initResults.menus.failed} 项)
                      </span>
                    )}
                  </Text>
                </div>
              )}
              {initResults.adminUser && (
                <div>
                  <Text strong>超级管理员账户：</Text>
                  <Text className={`ml-2 ${initResults.adminUser.success ? 'text-green-600' : 'text-red-500'}`}>
                    {initResults.adminUser.success ? '创建成功' : `创建失败: ${initResults.adminUser.error}`}
                  </Text>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default InitManager
