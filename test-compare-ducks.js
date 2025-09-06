import { ConfigManager } from './dist/config/config.js';
import { ProviderManager } from './dist/providers/manager.js';

const cfg = new ConfigManager();
const pm = new ProviderManager(cfg);
const prompt = "What's the best way to handle errors in Node.js?";
  const providers = ["openrouter", "ollama"];
  const options = {
    model: {
      openrouter: "moonshotai/kimi-k2:free",
      ollama: "gemma3:4b"
    }
  };
  const results = await Promise.all(providers.map(name => pm.askDuck(name, prompt, { model: options.model[name] })));
results.forEach(r => {
  console.log(`\nProvider: ${r.provider} (${r.nickname})`);
  console.log(`Model: ${r.model}`);
  console.log(`Response: ${r.content}`);
  if (r.usage) {
    console.log(`Tokens: ${JSON.stringify(r.usage)}`);
  }
  console.log(`Latency: ${r.latency}ms`);
  console.log('---');
});