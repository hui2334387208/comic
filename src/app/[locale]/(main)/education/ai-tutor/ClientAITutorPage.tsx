'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TutorSession {
  id: string;
  sessionType: string;
  messages: Message[];
  learningGoals: string[];
  recommendations: any;
  isActive: boolean;
}

interface ClientAITutorPageProps {
  locale: string;
}

export default function ClientAITutorPage({ locale }: ClientAITutorPageProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionType, setSessionType] = useState<string>('guidance');
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始化AI导师会话
    initializeSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = () => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: `您好！我是您的AI对联导师。我可以帮助您：

🎯 **学习指导** - 制定个性化学习计划
📝 **作品点评** - 分析您的对联作品
💡 **创作建议** - 提供创作灵感和技巧
❓ **答疑解惑** - 解答对联相关问题

请告诉我您想要什么帮助，或者直接提出您的问题！`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  };

  const getSessionTypeText = (type: string) => {
    switch (type) {
      case 'guidance': return '学习指导';
      case 'feedback': return '作品点评';
      case 'recommendation': return '推荐建议';
      case 'qa': return '问答解惑';
      default: return type;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 模拟AI响应（实际应该调用AI API）
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse = generateAIResponse(inputMessage, sessionType);
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我暂时无法回应。请稍后再试。',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string, type: string): string => {
    // 简单的模拟AI响应逻辑
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('对联') && lowerInput.includes('规则')) {
      return `对联的基本规则包括：

📏 **字数相等** - 上下联字数必须相同
🎵 **平仄相对** - 声调要有起伏变化
🔄 **词性相当** - 名词对名词，动词对动词
💭 **意义相关** - 内容要有逻辑关联
🚫 **忌同字** - 避免上下联用相同的字

您想了解哪个方面的详细内容呢？`;
    }
    
    if (lowerInput.includes('创作') || lowerInput.includes('写')) {
      return `创作对联的步骤：

1️⃣ **确定主题** - 明确要表达的内容
2️⃣ **选择句式** - 决定字数和结构
3️⃣ **构思上联** - 先写出一句
4️⃣ **对仗下联** - 按规则对出下联
5️⃣ **检查修改** - 确保符合各项要求

您想创作什么主题的对联？我可以给您具体指导！`;
    }
    
    if (lowerInput.includes('平仄')) {
      return `平仄是对联的重要要素：

🔊 **平声** - 声调平缓（第一、二声）
📈 **仄声** - 声调有变化（第三、四声）

基本规律：
• 上联末字用仄声
• 下联末字用平声  
• 二四六字位要相对
• 一三五字位可灵活

需要我帮您分析具体对联的平仄吗？`;
    }
    
    return `感谢您的提问！这是一个很好的问题。

根据您的问题，我建议：
• 多读经典对联作品
• 练习基础对仗技巧
• 注意平仄声调搭配
• 培养文学素养

您还有其他想了解的吗？我很乐意为您详细解答！`;
  };

  const quickQuestions = [
    '对联的基本规则是什么？',
    '如何创作一副好对联？',
    '平仄怎么掌握？',
    '有什么经典对联推荐？',
    '对联创作有哪些技巧？'
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 relative overflow-hidden">
      {/* 传统装饰背景 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-red-600 rounded-full"></div>
        <div className="absolute top-20 right-20 w-24 h-24 border-2 border-red-500 rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 border-3 border-red-400 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-red-600 rotate-12"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <h1 className="text-5xl font-black text-red-700 mb-4 relative">
              AI导师
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full opacity-80"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-600 rounded-full opacity-60"></div>
            </h1>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-600 to-orange-600"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
          </div>
          <p className="text-red-600 text-lg font-bold mt-6">
            个性化学习指导，24/7 智能答疑
          </p>
        </div>

        {/* 返回按钮 */}
        <div className="mb-8">
          <Link 
            href="/education" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg"
          >
            ← 返回对联学院
          </Link>
        </div>

        {/* 会话类型选择 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {['guidance', 'feedback', 'recommendation', 'qa'].map((type) => (
              <button
                key={type}
                onClick={() => setSessionType(type)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  sessionType === type
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-red-600 border-2 border-red-200 hover:border-red-400'
                }`}
              >
                {getSessionTypeText(type)}
              </button>
            ))}
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="bg-white rounded-2xl shadow-xl border-4 border-red-200 overflow-hidden">
          {/* 聊天头部 */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <div className="font-bold">AI对联导师</div>
                <div className="text-red-200 text-sm">当前模式: {getSessionTypeText(sessionType)}</div>
              </div>
              <div className="ml-auto">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-line">{message.content}</div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-red-200' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* 加载指示器 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    <span className="ml-2 text-sm">AI导师正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-3 font-bold">💡 常见问题：</div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-colors border border-red-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="请输入您的问题..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-bold transition-colors"
              >
                {isLoading ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>

        {/* 功能介绍 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-red-700 mb-2">学习指导</h3>
            <p className="text-gray-600 text-sm">制定个性化学习计划，推荐适合的课程和练习</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-bold text-red-700 mb-2">作品点评</h3>
            <p className="text-gray-600 text-sm">分析您的对联作品，提供改进建议和技巧指导</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-bold text-red-700 mb-2">创作建议</h3>
            <p className="text-gray-600 text-sm">提供创作灵感，帮助您突破创作瓶颈</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
            <div className="text-3xl mb-3">❓</div>
            <h3 className="font-bold text-red-700 mb-2">答疑解惑</h3>
            <p className="text-gray-600 text-sm">解答对联相关的各种问题，随时为您答疑</p>
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-6 bg-red-600 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-2xl">🤖</span>
            <span className="font-bold text-lg">智能导师，贴心指导</span>
            <span className="text-2xl">🤖</span>
          </div>
        </div>
      </div>

      {/* 浮动装饰元素 */}
      <div className="absolute top-1/4 left-8 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 right-12 w-3 h-3 bg-orange-500 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-16 w-2 h-2 bg-red-600 rounded-full animate-pulse delay-2000"></div>
      <div className="absolute bottom-1/3 right-8 w-3 h-3 bg-red-400 rounded-full animate-pulse delay-3000"></div>
    </div>
  );
}