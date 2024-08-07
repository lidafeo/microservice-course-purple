import { CourseGetCourse, PaymentCheck, PaymentGenerateLink, PaymentStatus } from '@purple/contracts';
import { BuyCourseSagaState } from './buy-course.state';
import { UserEntity } from '../entities/user.entity';
import { PurchaseState } from '@purple/interfaces';

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {
  public async pay(): Promise<{ paymentLink: string, user: UserEntity }> {
    const { course } = await this.saga.rmqService.send<CourseGetCourse.Request, CourseGetCourse.Response>(CourseGetCourse.topic, {
      id: this.saga.courseId
    });
    if (!course) {
      throw new Error('Такого курса не существует');
    }
    if (course.price === 0) {
      this.saga.setState(PurchaseState.Purchased, course._id);
      return { paymentLink: null, user: this.saga.user };
    }
    const { paymentLink } = await this.saga.rmqService.send<PaymentGenerateLink.Request, PaymentGenerateLink.Response>(PaymentGenerateLink.topic, {
      courseId: course._id,
      userId: this.saga.user._id,
      sum: course.price
    });
    this.saga.setState(PurchaseState.WaitingForPayment, course._id);
    return { paymentLink, user: this.saga.user };
  }

  public checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Нельзя проверить платеж, который не начался');
  }

  public async cancel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Cancelled, this.saga.courseId);
    return { user: this.saga.user };
  }
}

export class BuyCourseSagaStateWaitingForPayment extends BuyCourseSagaState {
  public async pay(): Promise<{ paymentLink: string, user: UserEntity }> {
    throw new Error('Платеж уже в процессе оплаты');
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    const { status } = await this.saga.rmqService.send<PaymentCheck.Request, PaymentCheck.Response>(PaymentCheck.topic, {
      courseId: this.saga.courseId,
      userId: this.saga.user._id
    });
    if (status === 'success') {
      this.saga.setState(PurchaseState.Purchased, this.saga.courseId);
    }
    if (status === 'cancelled') {
      this.saga.setState(PurchaseState.Cancelled, this.saga.courseId);
    }
    return { user: this.saga.user, status: status };
  }

  public async cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Нельзя отменить платеж в процессе');
  }
}

export class BuyCourseSagaStatePurchased extends BuyCourseSagaState {
  public async pay(): Promise<{ paymentLink: string, user: UserEntity }> {
    throw new Error('Нельзя оплатить купленный курс');
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Нельзя проверить платеж по купленному курсу');
  }

  public async cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Нельзя отменить купленный курс');
  }
}

export class BuyCourseSagaStateCancelled extends BuyCourseSagaState {
  public async pay(): Promise<{ paymentLink: string, user: UserEntity }> {
    this.saga.setState(PurchaseState.Started, this.saga.courseId);
    return this.saga.getState().pay();
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Нельзя проверить платеж по отмененному курсу');
  }

  public async cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Нельзя отменить отмененный курс');
  }
}