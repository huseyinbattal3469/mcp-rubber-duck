#!/usr/bin/env node

import 'dotenv/config';
import { spawn } from 'child_process';

class MCPClient {
  constructor() {
    this.messageId = 0;
    this.responses = new Map();
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.process = spawn('node', ['dist/index.js'], {
        env: {
          ...process.env,
          MCP_SERVER: 'true',
          LOG_LEVEL: 'info'
        }
      });

      this.process.stderr.on('data', (data) => {
        console.error(`Server stderr: ${data}`);
      });

      this.process.on('error', reject);
      this.process.on('exit', (code) => {
        console.log(`Server exited with code ${code}`);
      });

      let buffer = '';
      this.process.stdout.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const message = JSON.parse(line);
            this.handleMessage(message);
          } catch (e) {
            // Not JSON -> ignore
          }
        }
      });

      setTimeout(() => {
        this.sendRequest('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'run-list-ducks', version: '1.0.0' }
        }).then(resolve).catch(reject);
      }, 200);
    });
  }

  handleMessage(message) {
    if (message.id && this.responses.has(message.id)) {
      const { resolve, reject } = this.responses.get(message.id);
      this.responses.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = `msg_${++this.messageId}`;
      const request = { jsonrpc: '2.0', id, method, params };
      this.responses.set(id, { resolve, reject });
      this.process.stdin.write(JSON.stringify(request) + '\n');
      setTimeout(() => {
        if (this.responses.has(id)) {
          this.responses.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 15000);
    });
  }

  async listDucks(checkHealth = true) {
    return this.sendRequest('tools/call', { name: 'list_ducks', arguments: { check_health: checkHealth } });
  }

  stop() {
    if (this.process) this.process.kill();
  }
}

(async function main(){
  const client = new MCPClient();
  try {
    console.log('Starting server and requesting list_ducks with check_health: true');
    const init = await client.start();
    // wait a bit for server to finish initial health checks
    await new Promise(r => setTimeout(r, 500));
    const ducks = await client.listDucks(true);
    console.log('list_ducks result:\n', JSON.stringify(ducks, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.stop();
    process.exit(0);
  }
})();
