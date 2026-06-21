import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { ManualPaymentDto, ReviewManualPaymentDto } from './dto.payment.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(private config: ConfigService, private prisma: PrismaService) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) this.stripe = new Stripe(key);
  }

  async createCheckout(userId: string, provider: 'STRIPE' | 'PAYPAL' | 'SSLCOMMERZ' = 'STRIPE') {
    if (provider !== 'STRIPE') {
      return { url: `mock-${provider.toLowerCase()}-checkout-url`, provider };
    }
    if (!this.stripe) return { url: 'mock-stripe-checkout-url', provider: 'STRIPE' };

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: 'price_premium_plan_id', quantity: 1 }],
      success_url: `${this.config.get<string>('FRONTEND_URL')}/dashboard/billing?success=1`,
      cancel_url: `${this.config.get<string>('FRONTEND_URL')}/pricing?canceled=1`,
      metadata: { userId },
    });

    return { url: session.url, provider: 'STRIPE' };
  }

  async webhook(eventType: string, userId: string) {
    if (eventType === 'checkout.session.completed') {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await this.prisma.user.update({ where: { id: userId }, data: { subscriptionPlan: 'PREMIUM' } });
      await this.prisma.subscription.create({
        data: {
          userId,
          paymentProvider: 'STRIPE',
          plan: 'PREMIUM',
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });
    }

    return { received: true };
  }

  async status(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { endDate: 'desc' },
    });
    const passActive = Boolean(user?.cvPassExpiresAt && user.cvPassExpiresAt > new Date() && user.cvPassExportsRemaining > 0);
    return {
      plan: user?.subscriptionPlan || 'FREE',
      subscription,
      cvPass: {
        active: passActive,
        expiresAt: user?.cvPassExpiresAt,
        exportsRemaining: user?.cvPassExportsRemaining || 0,
        price: 20,
      },
    };
  }

  async submitManualPayment(userId: string, dto: ManualPaymentDto) {
    const resume = await this.prisma.resume.findFirst({ where: { id: dto.resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');
    const existing = await this.prisma.manualPaymentRequest.findUnique({ where: { transactionId: dto.transactionId.trim() } });
    if (existing) throw new BadRequestException('This transaction ID has already been submitted');
    const openPayment = await this.prisma.manualPaymentRequest.findFirst({
      where: {
        resumeId: dto.resumeId,
        OR: [
          { status: 'PENDING' },
          { status: 'APPROVED', accessExpiresAt: { gt: new Date() } },
        ],
      },
    });
    if (openPayment) throw new BadRequestException('This resume already has a pending or active payment');
    return this.prisma.manualPaymentRequest.create({
      data: { userId, resumeId: dto.resumeId, provider: dto.provider, senderNumber: dto.senderNumber.trim(), transactionId: dto.transactionId.trim(), amount: 20 },
    });
  }

  manualPaymentStatus(userId: string) {
    return this.prisma.manualPaymentRequest.findMany({
      where: { userId },
      include: { resume: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listManualPayments() {
    return this.prisma.manualPaymentRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        resume: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewManualPayment(id: string, dto: ReviewManualPaymentDto) {
    const payment = await this.prisma.manualPaymentRequest.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment request not found');
    if (payment.status !== 'PENDING') throw new BadRequestException('Payment request has already been reviewed');

    if (!payment.resumeId) throw new BadRequestException('This legacy payment is not linked to a resume');
    const accessExpiresAt = new Date();
    accessExpiresAt.setDate(accessExpiresAt.getDate() + 7);
    return this.prisma.$transaction(async (tx) => {
      const reviewed = await tx.manualPaymentRequest.update({
        where: { id },
        data: {
          status: dto.status,
          rejectionNote: dto.status === 'REJECTED' ? dto.rejectionNote : null,
          reviewedAt: new Date(),
          accessExpiresAt: dto.status === 'APPROVED' ? accessExpiresAt : null,
        },
      });
      return reviewed;
    });
  }
}
