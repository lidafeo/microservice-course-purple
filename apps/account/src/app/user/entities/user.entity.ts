import { IUser, IUserCourse, PurchaseState, UserRole } from '@purple/interfaces';
import { genSalt, hash, compare } from 'bcryptjs';

export class UserEntity implements IUser {
  _id?: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  courses?: IUserCourse[];

  constructor(user: IUser) {
    this._id = user._id;
    this.passwordHash = user.passwordHash;
    this.displayName = user.displayName;
    this.email = user.email;
    this.role = user.role;
    this.courses = user.courses;
  }

  public addCourse(courseId: string) {
    const exist = this.courses.find(c => c._id === courseId);
    if (exist) {
      throw new Error('Добавляемый курс уже существует');
    }
    this.courses.push({
      courseId,
      purchaseState: PurchaseState.Started,
    });
  }

  public deleteCourse(courseId: string) {
    this.courses = this.courses.filter(c => c._id !== courseId);
  }

  public updateCourseStatus(courseId: string, state: PurchaseState) {
    this.courses = this.courses.map(c => {
      if (c.courseId === courseId) {
        c.purchaseState = state;
      }
      return c;
    });
  }

  public getPublicProfile() {
    return {
      email: this.email,
      role: this.role,
      displayName: this.displayName,
    }
  }

  public async setPassword(password: string) {
    const salt = await genSalt(10);
    this.passwordHash = await hash(password, salt);
    return this;
  }

  public validatePassword(password: string) {
    return compare(password, this.passwordHash);
  }

  public updateProfile(data: Pick<IUser, 'displayName'>) {
    if (data.displayName) {
      this.displayName = data.displayName;
    }
    return this;
  }
}
