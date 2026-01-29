import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/db';
import { mainMenus, mainMenuTranslations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const mainMenuData = [
  {
    path: '/',
    icon: 'home',
    order: 1,
    status: 'active',
    isTop: true,
    translations: {
      zh: {
        name: '首页',
        metaTitle: '文鳐 Couplet - AI智能对联创作平台',
        metaDescription: '文鳐Couplet是一个基于AI的智能对联创作平台，提供对联生成、学习和分享功能',
        metaKeywords: '对联,AI,智能创作,中国传统文化,诗词'
      },
      en: {
        name: 'Home',
        metaTitle: 'Xuanjing Couplet - AI Intelligent Couplet Creation Platform',
        metaDescription: 'Xuanjing Couplet is an AI-based intelligent couplet creation platform that provides couplet generation, learning and sharing functions',
        metaKeywords: 'couplet,AI,intelligent creation,Chinese traditional culture,poetry'
      }
    }
  },
  {
    path: '/education',
    icon: 'book',
    order: 2,
    status: 'active',
    isTop: true,
    translations: {
      zh: {
        name: '对联学院',
        metaTitle: '对联学院 - 系统性学习对联知识',
        metaDescription: '对联学院提供从基础到高级的完整学习路径，包括每日练习、AI导师指导和成就系统',
        metaKeywords: '对联学习,教育,每日练习,AI导师,成就系统,中国传统文化'
      },
      en: {
        name: 'Couplet Academy',
        metaTitle: 'Couplet Academy - Systematic Learning of Couplet Knowledge',
        metaDescription: 'Couplet Academy provides a complete learning path from basic to advanced, including daily practice, AI tutor guidance and achievement system',
        metaKeywords: 'couplet learning,education,daily practice,AI tutor,achievement system,Chinese traditional culture'
      }
    }
  },
  {
    path: '/couplet',
    icon: 'edit',
    order: 3,
    status: 'active',
    isTop: true,
    translations: {
      zh: {
        name: '对联创作',
        metaTitle: '对联创作 - AI智能对联生成',
        metaDescription: '使用AI技术智能生成对联，支持多种主题和风格，让对联创作变得简单有趣',
        metaKeywords: '对联创作,AI生成,智能创作,对联生成器'
      },
      en: {
        name: 'Couplet Creation',
        metaTitle: 'Couplet Creation - AI Intelligent Couplet Generation',
        metaDescription: 'Use AI technology to intelligently generate couplets, support multiple themes and styles, making couplet creation simple and interesting',
        metaKeywords: 'couplet creation,AI generation,intelligent creation,couplet generator'
      }
    }
  },
  {
    path: '/social',
    icon: 'team',
    order: 4,
    status: 'active',
    isTop: true,
    translations: {
      zh: {
        name: '社交互动',
        metaTitle: '社交互动 - 对联社区交流平台',
        metaDescription: '参与对联PK比赛、协作创作、接龙游戏，与其他对联爱好者交流学习',
        metaKeywords: '对联社区,PK比赛,协作创作,接龙游戏,社交互动'
      },
      en: {
        name: 'Social Interaction',
        metaTitle: 'Social Interaction - Couplet Community Exchange Platform',
        metaDescription: 'Participate in couplet PK competitions, collaborative creation, chain games, and communicate with other couplet enthusiasts',
        metaKeywords: 'couplet community,PK competition,collaborative creation,chain games,social interaction'
      }
    }
  },
  {
    path: '/game',
    icon: 'trophy',
    order: 5,
    status: 'active',
    isTop: true,
    translations: {
      zh: {
        name: '游戏挑战',
        metaTitle: '游戏挑战 - 对联游戏化学习',
        metaDescription: '通过游戏化的方式学习对联，包括关卡挑战、成就系统、排行榜等',
        metaKeywords: '对联游戏,挑战关卡,成就系统,排行榜,游戏化学习'
      },
      en: {
        name: 'Game Challenge',
        metaTitle: 'Game Challenge - Gamified Couplet Learning',
        metaDescription: 'Learn couplets through gamification, including level challenges, achievement systems, leaderboards, etc.',
        metaKeywords: 'couplet games,challenge levels,achievement system,leaderboard,gamified learning'
      }
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // TODO: 检查管理员权限

    console.log('开始初始化主导航菜单...');

    const results = [];

    for (const menuData of mainMenuData) {
      try {
        // 检查菜单是否已存在
        const [existingMenu] = await db.select()
          .from(mainMenus)
          .where(eq(mainMenus.path, menuData.path))
          .limit(1);

        let menu;
        if (existingMenu) {
          // 更新现有菜单
          [menu] = await db.update(mainMenus)
            .set({
              icon: menuData.icon,
              order: menuData.order,
              status: menuData.status,
              isTop: menuData.isTop,
              updatedAt: new Date()
            })
            .where(eq(mainMenus.id, existingMenu.id))
            .returning();
          
          console.log(`更新主导航菜单: ${menuData.path}`);
        } else {
          // 创建新菜单
          [menu] = await db.insert(mainMenus).values({
            path: menuData.path,
            icon: menuData.icon,
            order: menuData.order,
            status: menuData.status,
            isTop: menuData.isTop
          }).returning();
          
          console.log(`创建主导航菜单: ${menuData.path}`);
        }

        // 处理翻译
        for (const [lang, translation] of Object.entries(menuData.translations)) {
          // 检查翻译是否已存在
          const [existingTranslation] = await db.select()
            .from(mainMenuTranslations)
            .where(and(
              eq(mainMenuTranslations.menuId, menu.id),
              eq(mainMenuTranslations.lang, lang)
            ))
            .limit(1);

          if (existingTranslation) {
            // 更新现有翻译
            await db.update(mainMenuTranslations)
              .set({
                name: translation.name,
                metaTitle: translation.metaTitle,
                metaDescription: translation.metaDescription,
                metaKeywords: translation.metaKeywords
              })
              .where(eq(mainMenuTranslations.id, existingTranslation.id));
            
            console.log(`更新主导航菜单翻译: ${menuData.path} (${lang})`);
          } else {
            // 创建新翻译
            await db.insert(mainMenuTranslations).values({
              menuId: menu.id,
              lang: lang,
              name: translation.name,
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription,
              metaKeywords: translation.metaKeywords
            });
            
            console.log(`创建主导航菜单翻译: ${menuData.path} (${lang})`);
          }
        }

        results.push({
          id: menu.id,
          path: menu.path,
          name: menuData.translations.zh.name
        });

      } catch (error) {
        console.error(`处理主导航菜单失败: ${menuData.path}`, error);
      }
    }

    console.log('主导航菜单初始化完成');

    return NextResponse.json({
      success: true,
      message: '主导航菜单初始化成功',
      data: {
        menus: results.length,
        items: results
      }
    });

  } catch (error) {
    console.error('初始化主导航菜单失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '初始化主导航菜单失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 获取初始化状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 检查主导航菜单数量
    const menus = await db.select().from(mainMenus).where(eq(mainMenus.isTop, true));
    const translations = await db.select().from(mainMenuTranslations);

    return NextResponse.json({
      success: true,
      data: {
        menus: menus.length,
        translations: translations.length,
        isInitialized: menus.length > 0,
        items: menus.map(menu => ({
          id: menu.id,
          path: menu.path,
          icon: menu.icon,
          order: menu.order,
          status: menu.status
        }))
      }
    });

  } catch (error) {
    console.error('获取主导航菜单状态失败:', error);
    return NextResponse.json(
      { success: false, message: '获取主导航菜单状态失败' },
      { status: 500 }
    );
  }
}