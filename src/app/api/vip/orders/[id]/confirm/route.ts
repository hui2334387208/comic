import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'

import { db } from '@/db'
import { vipOrders, vipPlans } from '@/db/schema'
import { authOptions } from '@/lib/authOptions'
import { sendPaymentReviewEmail } from '@/lib/email'
// import { sendAdminSms } from '@/lib/sms'; // 假设短信发送服务存在

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    })
  }

  const { id: orderId } = await context.params

  if (!orderId) {
    return new Response(JSON.stringify({ error: 'Invalid order ID' }), {
      status: 400,
    })
  }

  try {
    const { paymentMethod, userSubmittedTransactionId } = await request.json()
    if (!paymentMethod || !userSubmittedTransactionId) {
      return new Response(
        JSON.stringify({ error: 'Payment method and transaction ID are required' }),
        {
          status: 400,
        },
      )
    }

    // 首先，验证用户是否拥有此订单
    const order = await db.query.vipOrders.findFirst({
      where: eq(vipOrders.orderNo, orderId),
      with: {
        plan: true, // Assuming relation 'plan' exists on vipOrders
      },
    })

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
      })
    }

    if (order.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
      })
    }

    // 更新订单
    await db
      .update(vipOrders)
      .set({
        status: 'in_review',
        paymentMethod,
        userSubmittedTransactionId,
        paidAt: new Date(),
      })
      .where(eq(vipOrders.orderNo, orderId))

    // 发送邮件给管理员
    const adminEmail = process.env.ADMIN_EMAIL

    if (adminEmail) {
      await sendPaymentReviewEmail({
        adminEmail,
        orderNo: order.orderNo,
        userSubmittedTransactionId,
        amount: order.amount,
        planName: order.plan?.name || 'N/A',
      })
    } else {
      console.warn('ADMIN_EMAIL is not set and no fallback is provided. Cannot send payment review email.')
    }

    return new Response(
      JSON.stringify({ message: '提交成功，您的支付信息正在审核中。' }),
      {
        status: 200,
      },
    )
  } catch (error) {
    console.error('Failed to confirm payment:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    })
  }
}
