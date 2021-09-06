import EventEmitter from 'eventemitter3';
import { singleton } from 'tsyringe';

@singleton()
export class ExceptionService extends EventEmitter {
  report(e: Error) {
    this.emit('error', e.message);
  }
}
