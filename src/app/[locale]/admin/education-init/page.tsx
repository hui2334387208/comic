'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Steps, Alert, Spin, message, Divider, Space, Tag } from 'antd';
import { 
  BookOutlined, 
  MenuOutlined, 
  CheckCircleOutlined, 
  LoadingOutlined,
  ExclamationCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { withPagePermission } from '@/lib/withPagePermission';

const { Step } = Steps;

interface InitStatus {
  education: {
    courses: number;
    exercises: number;
    learningPaths: number;
    badges: number;
    isInitialized: boolean;
  };
  mainMenus: {
    menus: number;
    translations: number;
    isInitialized: boolean;
  };
}

function EducationInitPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<InitStatus | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [initResults, setInitResults] = useState<any[]>([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const [educationRes, menuRes] = await Promise.all([
        fetch('/api/admin/init-education'),
        fetch('/api/admin/init-main-menus')
      ]);

      const [educationData, menuData] = await Promise.all([
        educationRes.json(),
        menuRes.json()
      ]);

      setStatus({
        education: educationData.data || {
          courses: 0,
          exercises: 0,
          learningPaths: 0,
          badges: 0,
          isInitialized: false
        },
        mainMenus: menuData.data || {
          menus: 0,
          translations: 0,
          isInitialized: false
        }
      });
    } catch (error) {
      message.error('获取初始化状态失败');
    }
  };

  const initializeEducation = async () => {
    try {
      setCurrentStep(1);
      const response = await fetch('/api/admin/init-education', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setInitResults(prev => [...prev, {
          type: 'education',
          success: true,
          message: '教育数据初始化成功',
          data: data.data
        }]);
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setInitResults(prev => [...prev, {
        type: 'education',
        success: false,
        message: error instanceof Error ? error.message : '教育数据初始化失败'
      }]);
      return false;
    }
  };

  const initializeMainMenus = async () => {
    try {
      setCurrentStep(2);
      const response = await fetch('/api/admin/init-main-menus', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setInitResults(prev => [...prev, {
          type: 'mainMenus',
          success: true,
          message: '主导航菜单初始化成功',
          data: data.data
        }]);
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setInitResults(prev => [...prev, {
        type: 'mainMenus',
        success: false,
        message: error instanceof Error ? error.message : '主导航菜单初始化失败'
      }]);
      return false;
    }
  };

  const handleFullInit = async () => {
    setLoading(true);
    setCurrentStep(0);
    setInitResults([]);

    try {
      // 步骤1: 初始化教育数据
      const educationSuccess = await initializeEducation();
      
      // 步骤2: 初始化主导航菜单
      const menuSuccess = await initializeMainMenus();
      
      // 步骤3: 完成
      setCurrentStep(3);
      
      if (educationSuccess && menuSuccess) {
        message.success('所有数据初始化完成！');
        // 重新获取状态
        await fetchStatus();
      } else {
        message.warning('部分数据初始化失败，请查看详细信息');
      }
    } catch (error) {
      message.error('初始化过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: '准备初始化',
      description: '检查系统状态',
      icon: <RocketOutlined />
    },
    {
      title: '教育数据',
      description: '初始化课程、练习题、学习路径等',
      icon: <BookOutlined />
    },
    {
      title: '主导航菜单',
      description: '初始化网站主导航菜单',
      icon: <MenuOutlined />
    },
    {
      title: '完成',
      description: '所有数据初始化完成',
      icon: <CheckCircleOutlined />
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">教育模块初始化</h1>
        <p className="text-gray-600">
          初始化教育学习模块的基础数据，包括课程、练习题、学习路径、徽章系统和主导航菜单
        </p>
      </div>

      {/* 当前状态 */}
      <Card title="当前状态" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <BookOutlined className="mr-2 text-blue-500" />
              教育数据
            </h3>
            {status ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>课程数量:</span>
                  <Tag color={status.education.courses > 0 ? 'green' : 'default'}>
                    {status.education.courses}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span>练习题数量:</span>
                  <Tag color={status.education.exercises > 0 ? 'green' : 'default'}>
                    {status.education.exercises}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span>学习路径:</span>
                  <Tag color={status.education.learningPaths > 0 ? 'green' : 'default'}>
                    {status.education.learningPaths}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span>徽章数量:</span>
                  <Tag color={status.education.badges > 0 ? 'green' : 'default'}>
                    {status.education.badges}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span>初始化状态:</span>
                  <Tag color={status.education.isInitialized ? 'green' : 'red'}>
                    {status.education.isInitialized ? '已初始化' : '未初始化'}
                  </Tag>
                </div>
              </div>
            ) : (
              <Spin />
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <MenuOutlined className="mr-2 text-green-500" />
              主导航菜单
            </h3>
            {status ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>菜单数量:</span>
                  <Tag color={status.mainMenus.menus > 0 ? 'green' : 'default'}>
                    {status.mainMenus.menus}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span>翻译数量:</span>
                  <Tag color={status.mainMenus.translations > 0 ? 'green' : 'default'}>
                    {status.mainMenus.translations}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span>初始化状态:</span>
                  <Tag color={status.mainMenus.isInitialized ? 'green' : 'red'}>
                    {status.mainMenus.isInitialized ? '已初始化' : '未初始化'}
                  </Tag>
                </div>
              </div>
            ) : (
              <Spin />
            )}
          </div>
        </div>
      </Card>

      {/* 初始化步骤 */}
      <Card title="初始化进度" className="mb-6">
        <Steps current={currentStep} className="mb-6">
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={loading && currentStep === index ? <LoadingOutlined /> : step.icon}
            />
          ))}
        </Steps>

        <div className="text-center">
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            loading={loading}
            onClick={handleFullInit}
            className="px-8"
          >
            {loading ? '正在初始化...' : '开始完整初始化'}
          </Button>
        </div>
      </Card>

      {/* 初始化结果 */}
      {initResults.length > 0 && (
        <Card title="初始化结果">
          <div className="space-y-4">
            {initResults.map((result, index) => (
              <Alert
                key={index}
                type={result.success ? 'success' : 'error'}
                message={result.message}
                description={
                  result.data && (
                    <div className="mt-2">
                      {result.type === 'education' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>课程: {result.data.courses}</div>
                          <div>练习题: {result.data.exercises}</div>
                          <div>学习路径: {result.data.learningPaths}</div>
                          <div>徽章: {result.data.badges}</div>
                        </div>
                      )}
                      {result.type === 'mainMenus' && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>菜单: {result.data.menus}</div>
                          <div>翻译: {result.data.translations || 0}</div>
                        </div>
                      )}
                    </div>
                  )
                }
                showIcon
              />
            ))}
          </div>
        </Card>
      )}

      {/* 注意事项 */}
      <Card title="注意事项" className="mt-6">
        <Alert
          type="info"
          icon={<ExclamationCircleOutlined />}
          message="初始化说明"
          description={
            <div className="space-y-2 mt-2">
              <p>• 初始化过程会创建教育模块的基础数据，包括示例课程、练习题等</p>
              <p>• 如果数据已存在，系统会跳过重复创建</p>
              <p>• 主导航菜单会添加"对联学院"等新菜单项</p>
              <p>• 初始化完成后，用户可以在前台访问教育学习功能</p>
              <p>• 建议在系统部署后首次运行此初始化</p>
            </div>
          }
        />
      </Card>
    </div>
  );
}

export default withPagePermission(EducationInitPage, {
  permission: 'education.init'
});