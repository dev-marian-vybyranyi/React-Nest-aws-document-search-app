import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class SseService {
  private subjects = new Map<string, Subject<any>>();

  getOrCreateSubject(userEmail: string): Subject<any> {
    if (!this.subjects.has(userEmail)) {
      this.subjects.set(userEmail, new Subject());
    }
    return this.subjects.get(userEmail)!;
  }

  emit(userEmail: string, data: any) {
    const subject = this.subjects.get(userEmail);
    if (subject) {
      subject.next({ data });
    }
  }

  remove(userEmail: string) {
    this.subjects.delete(userEmail);
  }
}
