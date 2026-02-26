# 邀请好友系统完整文档

## 📋 目录
- [系统概述](#系统概述)
- [用户使用流程](#用户使用流程)
- [技术实现](#技术实现)
- [数据库设计](#数据库设计)
- [API接口](#api接口)
- [配置说明](#配置说明)
- [开发指南](#开发指南)

---

## 系统概述

邀请好友系统是一个完整的用户推荐奖励机制，允许用户通过分享邀请码邀请新用户注册，双方都能获得免费创作次数奖励。

### 核心特性
- ✅ 每个用户拥有唯一的8位邀请码
- ✅ 邀请码自动生成，无需手动创建
- ✅ 双向奖励机制（邀请人和被邀请人都获得奖励）
- ✅ 支持多种用户注册方式
- ✅ 完整的统计和追踪功能

### 奖励规则（三级裂变限制）

| 层级 | 邀请人奖励 | 被邀请人奖励 | 说明 |
|------|-----------|-------------|------|
| 一级邀请 | 10次 | 5次 | A邀请B，A获得10次，B获得5次 |
| 二级邀请 | 5次（减半） | 5次 | B邀请C，B获得5次，C获得5次 |
| 三级邀请 | 0次 | 5次 | C邀请D，C不获得奖励，D获得5次 |
| 超过三级 | 0次 | 0次 | 不再发放任何奖励 |

**限制说明：**
- 每人最多邀请 3 人（严格控制成本）
- 邀请层级最多追溯 3 级
- 二级邀请奖励减半
- 三级及以上不发放邀请人奖励

---

## 用户使用流程

### 场景1：普通邮箱注册（使用邀请码）

**流程图：**
```
新用户访问注册页
    ↓
填写注册信息（邮箱、用户名、密码）
    ↓
填写邀请码（可选）
    ↓
提交注册
    ↓
收到验证邮件
    ↓
点击验证链接
    ↓
邮箱验证成功
    ├─→ 系统生成用户的邀请码
    └─→ 如果使用了邀请码，发放双方奖励
        ├─→ 邀请人 +10次
        └─→ 被邀请人 +5次
```

**详细步骤：**

1. **新用户注册**
   - 访问注册页面 `/sign-up`
   - 填写邮箱、用户名、密码
   - （可选）填写朋友分享的邀请码
   - 提交注册

2. **邮箱验证**
   - 收到验证邮件
   - 点击邮件中的验证链接
   - 系统自动完成：
     - ✅ 验证邮箱
     - ✅ 生成用户的邀请码
     - ✅ 如果使用了邀请码，发放奖励

3. **查看邀请码**
   - 登录后访问 `/referral` 页面
   - 查看自己的邀请码
   - 查看邀请统计（邀请人数、获得奖励等）

4. **分享邀请码**
   - 复制邀请码分享给朋友
   - 朋友注册时填写邀请码
   - 朋友验证邮箱后，双方获得奖励

### 场景2：OAuth登录（Google/GitHub）

**流程图：**
```
用户点击OAuth登录
    ↓
授权成功
    ↓
系统创建用户
    ↓
自动生成邀请码
    ↓
用户登录成功
```

**特点：**
- ✅ 无需邮箱验证
- ✅ 首次登录自动生成邀请码
- ✅ 可以分享邀请码邀请其他人
- ❌ 无法在注册时使用别人的邀请码（因为跳过注册流程）

**说明：**
- OAuth用户可以作为**邀请人**，分享邀请码给朋友
- OAuth用户无法作为**被邀请人**，因为他们没有注册流程

### 场景3：管理员创建用户

**流程图：**
```
管理员后台
    ↓
创建新用户
    ↓
填写用户信息
    ↓
提交创建
    ↓
系统生成邀请码
```

**特点：**
- ✅ 管理员在后台创建用户
- ✅ 自动生成邀请码
- ✅ 用户可以直接使用

---

## 技术实现

### 邀请码生成规则

```typescript
// 邀请码格式：8位大写字母和数字
// 去除易混淆字符：I, O, 0, 1, L
// 示例：ABC23456, XYZ89KLM

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
```

### 邀请关系状态

| 状态 | 说明 |
|------|------|
| `pending` | 待完成（被邀请人已注册，未验证邮箱） |
| `completed` | 已完成（被邀请人已验证邮箱，奖励已发放） |
| `expired` | 已过期（预留状态，暂未使用） |

### 核心流程

#### 1. 注册时建立邀请关系

```typescript
// src/app/api/auth/sign-up/route.ts

// 验证邀请码
if (referralCode) {
  const validation = await validateReferralCode(referralCode)
  if (!validation.valid) {
    return error('邀请码无效')
  }
}

// 创建用户
const user = await createUser(...)

// 建立邀请关系（pending状态）
if (referralCode) {
  await createReferralRelation(user.id, referralCode)
}
```

#### 2. 验证邮箱时发放奖励

```typescript
// src/app/api/auth/verify-email/route.ts

// 验证邮箱
await verifyEmail(token)

// 生成邀请码
await createReferralCode(user.id)

// 完成邀请任务并发放奖励
await completeReferralTask(user.id, 'verified_email')
```

#### 3. 邀请码自动生成时机

| 场景 | 触发时机 | 代码位置 |
|------|----------|----------|
| 普通注册 | 验证邮箱后 | `src/app/api/auth/verify-email/route.ts` |
| OAuth登录 | 首次登录创建用户时 | `src/lib/authOptions.ts` |
| 系统初始化 | 创建超级管理员时 | `src/app/api/admin/init-system/route.ts` |
| 管理员创建 | 后台创建用户时 | `src/app/api/admin/users/route.ts` |

---

## 数据库设计

### 1. user_referral_codes（用户邀请码表）

```sql
CREATE TABLE user_referral_codes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,           -- 用户ID
  referral_code VARCHAR(20) NOT NULL UNIQUE, -- 邀请码（唯一）
  total_invites INT DEFAULT 0,            -- 总邀请人数
  successful_invites INT DEFAULT 0,       -- 成功邀请人数
  total_rewards INT DEFAULT 0,            -- 累计获得奖励次数
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. referral_relations（邀请关系表）

```sql
CREATE TABLE referral_relations (
  id SERIAL PRIMARY KEY,
  inviter_id TEXT NOT NULL,               -- 邀请人ID
  invitee_id TEXT NOT NULL UNIQUE,        -- 被邀请人ID（唯一）
  referral_code VARCHAR(20) NOT NULL,     -- 使用的邀请码
  status VARCHAR(20) DEFAULT 'pending',   -- pending/completed/expired
  inviter_rewarded BOOLEAN DEFAULT FALSE, -- 邀请人是否已获得奖励
  invitee_rewarded BOOLEAN DEFAULT FALSE, -- 被邀请人是否已获得奖励
  inviter_reward_amount INT DEFAULT 0,    -- 邀请人奖励次数
  invitee_reward_amount INT DEFAULT 0,    -- 被邀请人奖励次数
  completed_at TIMESTAMP,                 -- 完成时间
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. referral_rewards（奖励记录表）

```sql
CREATE TABLE referral_rewards (
  id SERIAL PRIMARY KEY,
  relation_id INT NOT NULL,               -- 关联的邀请关系ID
  user_id TEXT NOT NULL,                  -- 获得奖励的用户ID
  reward_type VARCHAR(20) NOT NULL,       -- inviter/invitee
  reward_amount INT NOT NULL,             -- 奖励次数
  status VARCHAR(20) DEFAULT 'pending',   -- pending/issued/failed
  issued_at TIMESTAMP,                    -- 发放时间
  fail_reason TEXT,                       -- 失败原因
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. referral_campaigns（活动配置表）

```sql
CREATE TABLE referral_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,             -- 活动名称
  description TEXT,                       -- 活动描述
  inviter_reward INT DEFAULT 10,          -- 邀请人奖励次数
  invitee_reward INT DEFAULT 5,           -- 被邀请人奖励次数
  requirement_type VARCHAR(50) DEFAULT 'verified_email', -- 触发条件
  is_active BOOLEAN DEFAULT TRUE,         -- 是否激活
  start_date TIMESTAMP,                   -- 开始时间
  end_date TIMESTAMP,                     -- 结束时间
  max_invites_per_user INT,               -- 每人最多邀请数
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API接口

### 1. 验证邀请码

**请求：**
```http
POST /api/referral/validate
Content-Type: application/json

{
  "code": "ABC12345"
}
```

**响应：**
```json
{
  "success": true,
  "message": "邀请码有效"
}
```

### 2. 获取我的邀请码

**请求：**
```http
GET /api/referral/my-code
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "referralCode": "ABC12345",
    "totalInvites": 5,
    "successfulInvites": 3,
    "totalRewards": 30
  }
}
```

### 3. 获取邀请统计

**请求：**
```http
GET /api/referral/stats
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "referralCode": "ABC12345",
    "totalInvites": 5,
    "successfulInvites": 3,
    "totalRewards": 30,
    "invitees": [
      {
        "id": 1,
        "inviteeId": "user-123",
        "status": "completed",
        "completedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

## 配置说明

### 默认配置
- 邀请人奖励：10 次（一级），5次（二级），0次（三级+）
- 被邀请人奖励：5 次（所有层级）
- 触发条件：验证邮箱（`verified_email`）
- 每人最多邀请：3 人（严格控制）
- 最大层级：3 级

### 三级裂变示例

```
用户A（源头）
  └─ 邀请 用户B（一级）
      ├─ A获得: 10次
      └─ B获得: 5次
      
      └─ B邀请 用户C（二级）
          ├─ B获得: 5次（减半）
          └─ C获得: 5次
          
          └─ C邀请 用户D（三级）
              ├─ C获得: 0次（不发放）
              └─ D获得: 5次
              
              └─ D邀请 用户E（超过三级）
                  ├─ D获得: 0次
                  └─ E获得: 0次
```

### 修改奖励金额

**方式1：修改代码（默认配置）**

编辑 `src/lib/referral-utils.ts`：

```typescript
// 如果没有活动，返回默认配置
if (!campaign) {
  return {
    id: 0,
    name: '默认邀请活动',
    inviterReward: 10,      // 修改这里：邀请人奖励
    inviteeReward: 5,       // 修改这里：被邀请人奖励
    requirementType: 'verified_email',
    isActive: true,
  }
}
```

**方式2：数据库配置（推荐）**

在 `referral_campaigns` 表中插入活动记录：

```sql
INSERT INTO referral_campaigns (
  name,
  description,
  inviter_reward,
  invitee_reward,
  requirement_type,
  is_active
) VALUES (
  '春节邀请活动',
  '春节期间邀请好友，奖励翻倍',
  20,  -- 邀请人奖励
  10,  -- 被邀请人奖励
  'verified_email',
  true
);
```

### 修改触发条件

支持的触发条件：
- `register`：注册即可
- `verified_email`：验证邮箱（默认）
- `first_comic`：首次创作

---

## 开发指南

### 涉及的文件

| 文件 | 说明 |
|------|------|
| `src/app/[locale]/(auth)/sign-up/page.tsx` | 注册页面，添加邀请码输入框 |
| `src/app/api/auth/sign-up/route.ts` | 注册API，验证邀请码并建立关系 |
| `src/app/api/auth/verify-email/route.ts` | 邮箱验证API，生成邀请码并发放奖励 |
| `src/lib/authOptions.ts` | OAuth认证配置，为OAuth用户生成邀请码 |
| `src/app/api/admin/init-system/route.ts` | 系统初始化，为超级管理员生成邀请码 |
| `src/app/api/admin/users/route.ts` | 管理员创建用户，生成邀请码 |
| `src/lib/referral-utils.ts` | 邀请码核心工具函数 |
| `src/db/schema/referral.ts` | 数据库表结构定义 |
| `src/app/[locale]/(main)/referral/page.tsx` | 邀请页面 |
| `src/components/referral/ReferralCard.tsx` | 邀请卡片组件 |

### 关键函数

```typescript
// 生成邀请码
createReferralCode(userId: string)

// 验证邀请码
validateReferralCode(code: string)

// 建立邀请关系
createReferralRelation(inviteeId: string, referralCode: string)

// 完成邀请任务并发放奖励
completeReferralTask(inviteeId: string, taskType: 'register' | 'verified_email' | 'first_comic')

// 获取用户邀请统计
getUserReferralStats(userId: string)
```

### 测试流程

1. **测试邀请码生成**
   - 注册新用户
   - 验证邮箱
   - 检查是否生成邀请码

2. **测试邀请关系**
   - 用户A获取邀请码
   - 用户B注册时填写邀请码
   - 用户B验证邮箱
   - 检查双方是否获得奖励

3. **测试OAuth登录**
   - 使用Google/GitHub登录
   - 检查是否自动生成邀请码

---

## 常见问题

### Q1: 用户没有收到奖励？
**A:** 检查以下几点：
1. 被邀请人是否已验证邮箱
2. 邀请关系状态是否为 `completed`
3. 查看 `referral_rewards` 表确认奖励记录

### Q2: 邀请码无效？
**A:** 可能原因：
1. 邀请码输入错误（区分大小写会自动转换）
2. 邀请人账户不存在
3. 邀请码已达到使用上限

### Q3: 如何修改奖励金额？
**A:** 参考[配置说明](#配置说明)部分

### Q4: OAuth用户可以使用邀请码吗？
**A:** 
- **作为邀请人**：✅ 可以。OAuth用户会自动获得邀请码，可以分享给朋友邀请其他人注册。
- **作为被邀请人**：❌ 不可以。OAuth用户跳过注册流程，直接登录，无法在注册时填写别人的邀请码。

---

## 注意事项

⚠️ **重要限制：**
1. 每个用户只能使用一次邀请码
2. 不能使用自己的邀请码
3. 邀请码不区分大小写（自动转大写）
4. 奖励在验证邮箱后自动发放
5. 邀请关系一旦建立不可修改

✅ **最佳实践：**
1. 定期检查 `referral_rewards` 表确认奖励发放
2. 监控异常邀请行为（如短时间大量邀请）
3. 定期清理过期的验证令牌
4. 为活动设置开始和结束时间

---

## 更新日志

### v1.0.0 (2024-02-26)
- ✅ 实现基础邀请码系统
- ✅ 支持邮箱注册使用邀请码
- ✅ 支持OAuth登录自动生成邀请码
- ✅ 实现双向奖励机制
- ✅ 添加邀请统计功能
- ✅ 完善管理员创建用户流程
