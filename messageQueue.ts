export class MessageQueue {
  messages: string[];
  size: number;
  pushHandler: ((message: string) => void) | undefined;

  constructor() {
    this.messages = [];
    this.size = 0;
    this.pushHandler = undefined;
  }

  pop(): string {
    if (this.size > 0) {
      this.size--;
      return this.messages.shift()!;
    } else {
      return "";
    }
  }

  push(message: string) {
    this.size++;
    this.messages.push(message);
    if (this.pushHandler) {
      this.pushHandler(message);
    }
  }

  onPush(handler: (message: string) => void) {
    this.pushHandler = handler;
  }
}
