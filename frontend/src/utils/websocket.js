import { API_CONFIG } from '../config/api';
import { ElMessage } from 'element-plus';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = 3000;
    this.messageHandlers = new Map();
  }

  // 连接WebSocket
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('token');
        const url = `${API_CONFIG.WS_URL}?token=${token}`;
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('WebSocket连接成功');
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onclose = () => {
          console.log('WebSocket连接关闭');
          this.reconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          reject(error);
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // 重新连接
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      ElMessage.error('WebSocket连接失败，请刷新页面重试');
      return;
    }

    this.reconnectAttempts++;
    console.log(`尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectTimeout);
  }

  // 发送消息
  send(type, data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      ElMessage.error('WebSocket未连接');
      return;
    }

    const message = JSON.stringify({
      type,
      data
    });

    this.ws.send(message);
  }

  // 注册消息处理器
  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  // 移除消息处理器
  off(type) {
    this.messageHandlers.delete(type);
  }

  // 处理接收到的消息
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      const handler = this.messageHandlers.get(message.type);
      
      if (handler) {
        handler(message.data);
      }
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  }

  // 关闭连接
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketClient(); 