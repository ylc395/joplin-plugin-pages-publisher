import EventEmitter from 'eventemitter3';
import { singleton } from 'tsyringe';

@singleton()
export class ExceptionService extends EventEmitter {
  throwError(message: string) {
    this.emit('error', message);
  }
}
