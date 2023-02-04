import EventEmitter from 'events';
import WebSocket from 'ws';

class WebSocketClient extends EventEmitter {
  constructor(uri, options = {}) {
    super();

    this.uri = uri;

    options.autoReconnect = options.autoReconnect
      ? options.autoReconnect
      : false;
    this.options = options;

    this.connection = null;
    this.opened = false;

    this.pingInterval = setInterval(() => {
      if (this.connection && this.opened) {
        this.connection.ping();
      }
    }, 1000 * 10);
  }

  async open() {
    if (this.opened) {
      return;
    }

    try {
      this.connection = new WebSocket(this.uri);
    } catch (error) {
      throw error;
    }

    this.connection.on('open', () => {
      this.opened = true;

      this.emit('open');
    });

    this.connection.on('message', (buffer) => {
      this.emit('message', buffer);

      const text = buffer.toString();

      try {
        const object = JSON.parse(text);
        this.emit('json', this, object.event, object.data, object.message);
        this.emit('text', this, text);
      } catch (error) {
        this.emit('text', this, text);
      }
    });

    this.connection.on('close', (code) => {
      this.opened = false;

      if (this.options.autoReconnect) {
        this.open();
      }

      this.emit('close', code);
    });

    this.connection.on('error', (error) => {
      this.emit('error', error);
    });
  }

  close() {
    this.connection ? this.connection.close() : null;
  }

  send(message) {
    if (!this.connection) {
      return;
    }
    if (!this.connected) {
      return;
    }
    if (typeof message == 'object') {
      message = JSON.stringify(message);
    }
    this.connection.send(message);
  }

  event(name, data, message = name) {
    this.send({
      event: name,
      message: message,
      data: data,
    });
  }
}

export default WebSocketClient;
