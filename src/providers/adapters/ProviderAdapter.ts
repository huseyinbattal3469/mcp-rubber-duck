import { ChatOptions, ChatResponse, StreamChunk, ModelInfo } from '../types.js';

export interface ProviderAdapter {
  chat(opts: ChatOptions): Promise<ChatResponse>;
  chatStream(opts: ChatOptions): AsyncGenerator<StreamChunk>;
  healthCheck(): Promise<boolean>;
  listModels(): Promise<ModelInfo[]>;
  getInfo?(): any;
}
