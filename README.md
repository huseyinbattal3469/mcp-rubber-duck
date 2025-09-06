# 🦆 MCP Rubber Duck

An MCP (Model Context Protocol) server that acts as a bridge to query multiple OpenAI-compatible LLMs. Just like rubber duck debugging, explain your problems to various AI "ducks" and get different perspectives!

```
     __
   <(o )___
    ( ._> /
     `---'  Quack! Ready to debug!
```

## Features

- 🔌 **Universal OpenAI Compatibility**: Works with any OpenAI-compatible API endpoint
- 🦆 **Multiple Ducks**: Configure and query multiple LLM providers simultaneously  
- 💬 **Conversation Management**: Maintain context across multiple messages
- 🏛️ **Duck Council**: Get responses from all your configured LLMs at once
- 💾 **Response Caching**: Avoid duplicate API calls with intelligent caching
- 🔄 **Automatic Failover**: Falls back to other providers if primary fails
- 📊 **Health Monitoring**: Real-time health checks for all providers
- 🎨 **Fun Duck Theme**: Rubber duck debugging with personality!

## Supported Providers

Any provider with an OpenAI-compatible API endpoint, including:

- **OpenAI** (GPT-4, GPT-3.5)
- **Google Gemini** (Gemini 2.5 Flash, Gemini 2.0 Flash)
- **Anthropic** (via OpenAI-compatible endpoints)
- **Groq** (Llama, Mixtral, Gemma)
- **Together AI** (Llama, Mixtral, and more)
- **Perplexity** (Online models with web search)
- **Anyscale** (Open source models)
- **Azure OpenAI** (Microsoft-hosted OpenAI)
- **Ollama** (Local models)
- **LM Studio** (Local models)
- **Custom** (Any OpenAI-compatible endpoint)

## Quick Start

### For Claude Desktop Users
👉 **Complete Claude Desktop setup instructions below in [Claude Desktop Configuration](#claude-desktop-configuration)**

## Installation

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- At least one API key for a supported provider

### Install from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-rubber-duck.git
cd mcp-rubber-duck

# Install dependencies
npm install

# Build the project
npm run build

# Run the server
npm start
```

## Agnostic Multi-Model Provider Architecture

### How It Works

MCP Rubber Duck uses an adapter/factory pattern to support any number of providers and models. Each provider is configured via ENV or `config/config.json`, and adapters handle API differences. You can select models per request, and add new providers by creating an adapter and updating the factory.

### Adding Providers & Models

1. **Configure providers** in `.env` or `config/config.json` with API keys, base URLs, and model lists.
2. **Adapters** for OpenAI, OpenRouter, and Ollama are included. To add more, create a new adapter in `src/providers/adapters/` and update the factory in `index.ts`.
3. **Model selection**: Pass the desired model in each chat/completion request. The system will use your chosen model if available.

### Example Usage

```js
const manager = new ProviderManager(configManager);
const response = await manager.askDuck('openai', 'Hello!', { model: 'gpt-4o' });
const ollamaResponse = await manager.askDuck('ollama', 'Hi!', { model: 'llama3.2' });
```

### Extending

- To add a new provider, implement the `ProviderAdapter` interface and add it to the factory.
- All adapters support custom headers, failover, and health checks.

---

### Method 1: Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-4o-mini  # Optional: defaults to gpt-4o-mini

# Google Gemini
GEMINI_API_KEY=...
GEMINI_DEFAULT_MODEL=gemini-2.5-flash  # Optional: defaults to gemini-2.5-flash

# Groq
GROQ_API_KEY=gsk_...
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile  # Optional: defaults to llama-3.3-70b-versatile

# Ollama (Local)
OLLAMA_BASE_URL=http://localhost:11434/v1  # Optional
OLLAMA_DEFAULT_MODEL=llama3.2  # Optional: defaults to llama3.2

# Together AI
TOGETHER_API_KEY=...

# Custom Provider
CUSTOM_API_KEY=...
CUSTOM_BASE_URL=https://api.example.com/v1
CUSTOM_DEFAULT_MODEL=custom-model  # Optional: defaults to custom-model

# Global Settings
DEFAULT_PROVIDER=openai
DEFAULT_TEMPERATURE=0.7
LOG_LEVEL=info

# Optional: Custom Duck Nicknames (Have fun with these!)
OPENAI_NICKNAME="DUCK-4"              # Optional: defaults to "GPT Duck"
GEMINI_NICKNAME="Duckmini"            # Optional: defaults to "Gemini Duck"
GROQ_NICKNAME="Quackers"              # Optional: defaults to "Groq Duck"
OLLAMA_NICKNAME="Local Quacker"       # Optional: defaults to "Local Duck"
CUSTOM_NICKNAME="My Special Duck"     # Optional: defaults to "Custom Duck"
```

**Note:** Duck nicknames are completely optional! If you don't set them, you'll get the charming defaults (GPT Duck, Gemini Duck, etc.). If you use a `config.json` file, those nicknames take priority over environment variables.

### Method 2: Configuration File

Create a `config/config.json` file based on the example:

```bash
cp config/config.example.json config/config.json
# Edit config/config.json with your API keys and preferences
```

## Claude Desktop Configuration

This is the most common setup method for using MCP Rubber Duck with Claude Desktop.

### Step 1: Build the Project

First, ensure the project is built:

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-rubber-duck.git
cd mcp-rubber-duck

# Install dependencies and build
npm install
npm run build
```

### Step 2: Configure Claude Desktop

Edit your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Basic Configuration Example

```json
{
  "mcpServers": {
    "rubber-duck": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-rubber-duck/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key-here",
        "OPENAI_DEFAULT_MODEL": "gpt-4o-mini",
        "GEMINI_API_KEY": "your-gemini-api-key-here", 
        "GEMINI_DEFAULT_MODEL": "gemini-2.5-flash",
        "DEFAULT_PROVIDER": "openai",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Advanced Multi-Provider Configuration

```json
{
  "mcpServers": {
    "rubber-duck": {
      "command": "node",
      "args": ["C:/Users/yourusername/Desktop/mcp-rubber-duck/dist/index.js"],
      "type": "stdio",
      "env": {
        // OpenAI Configuration
        "OPENAI_API_KEY": "sk-your-openai-api-key-here",
        "OPENAI_DEFAULT_MODEL": "gpt-4o-mini",
        "OPENAI_NICKNAME": "GPT Duck",

        // Gemini Configuration
        "GEMINI_API_KEY": "your-gemini-api-key-here",
        "GEMINI_DEFAULT_MODEL": "gemini-2.5-flash",
        "GEMINI_NICKNAME": "Gemini Duck",

        // Ollama (Local) Configuration
        "OLLAMA_BASE_URL": "http://localhost:11434/v1",
        "OLLAMA_MODELS": "deepscaler:1.5b,hermes3:3b,granite3.3:2b,smollm2:1.7b,exaone-deep:2.4b,llama3.2:3b,deepseek-r1:1.5b,qwen3:4b,gemma3:4b",
        "OLLAMA_DEFAULT_MODEL": "gemma3:4b",
        "OLLAMA_NICKNAME": "Local Quacker",

        // OpenRouter Configuration
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-api-key-here",
        "OPENROUTER_BASE_URL": "https://openrouter.ai/api/v1",
        "OPENROUTER_MODELS": "deepseek/deepseek-chat-v3.1:free,moonshotai/kimi-k2:free,z-ai/glm-4.5-air:free,meta-llama/llama-3.2-3b-instruct:free",
        "OPENROUTER_DEFAULT_MODEL": "deepseek/deepseek-chat-v3.1:free",
        "OPENROUTER_NICKNAME": "OpenRouter Duck",

        // Global Settings
        "DEFAULT_PROVIDER": "openrouter",
        "DEFAULT_TEMPERATURE": "0.7",
        "LOG_LEVEL": "info",
        
        // Performance Settings
        "CACHE_TTL": "300",
        "TIMEOUT": "30000",
        "MAX_RETRIES": "3"
      }
    }
  }
}
```

**Important**: Replace the placeholder API keys with your actual keys:
- `your-openai-api-key-here` → Your OpenAI API key (starts with `sk-`)
- `your-gemini-api-key-here` → Your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- `your-openrouter-api-key-here` → Your OpenRouter API key from [OpenRouter](https://openrouter.ai/keys)

## VS Code with MCP Extension Configuration

If you're using VS Code with an MCP extension, here's how to configure the Rubber Duck server:

### Step 1: Install MCP Extension

Install a compatible MCP extension from the VS Code marketplace.

### Step 2: Configure in VS Code Settings

Add to your VS Code `settings.json` or workspace settings:

```json
{
  "mcp.servers": {
    "rubber-duck": {
      "command": "node",
      "args": ["C:/absolute/path/to/mcp-rubber-duck/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key",
        "GEMINI_API_KEY": "your-gemini-api-key",
        "OLLAMA_BASE_URL": "http://localhost:11434/v1",
        "OLLAMA_DEFAULT_MODEL": "gemma3:4b",
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-key",
        "OPENROUTER_DEFAULT_MODEL": "deepseek/deepseek-chat-v3.1:free",
        "DEFAULT_PROVIDER": "openai",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Step 3: Create MCP Configuration File

Alternatively, create an `mcp.json` file in your VS Code user data directory:

**Windows**: `%APPDATA%\Code\User\mcp.json`
**macOS**: `~/Library/Application Support/Code/User/mcp.json`
**Linux**: `~/.config/Code/User/mcp.json`

```json
{
  "servers": {
    "rubber-duck": {
      "command": "node",
      "args": ["C:/Users/yourusername/Desktop/mcp-rubber-duck/dist/index.js"],
      "type": "stdio",
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434/v1",
        "OLLAMA_MODELS": "deepscaler:1.5b,hermes3:3b,granite3.3:2b,smollm2:1.7b,exaone-deep:2.4b,llama3.2:3b,deepseek-r1:1.5b,qwen3:4b,gemma3:4b",
        "OLLAMA_DEFAULT_MODEL": "gemma3:4b",
        "OPENROUTER_API_KEY": "sk-or-v1-your-openrouter-api-key-here",
        "OPENROUTER_BASE_URL": "https://openrouter.ai/api/v1",
        "OPENROUTER_MODELS": "deepseek/deepseek-chat-v3.1:free,moonshotai/kimi-k2:free,z-ai/glm-4.5-air:free",
        "OPENROUTER_DEFAULT_MODEL": "deepseek/deepseek-chat-v3.1:free",
        "DEFAULT_PROVIDER": "openrouter",
        "DEFAULT_TEMPERATURE": "0.7",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Complete Environment Variables Reference

### Provider Configuration

#### OpenAI Provider
```env
OPENAI_API_KEY=sk-...                    # Required: Your OpenAI API key
OPENAI_BASE_URL=https://api.openai.com/v1 # Optional: Custom endpoint URL
OPENAI_DEFAULT_MODEL=gpt-4o-mini         # Optional: Default model to use
OPENAI_MODELS=gpt-4o,gpt-4o-mini,gpt-3.5-turbo # Optional: Available models list
OPENAI_NICKNAME="GPT Duck"               # Optional: Custom provider nickname
```

#### Google Gemini Provider
```env
GEMINI_API_KEY=...                       # Required: Your Gemini API key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta # Optional: Custom endpoint
GEMINI_DEFAULT_MODEL=gemini-2.5-flash    # Optional: Default model to use
GEMINI_MODELS=gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-pro # Optional: Available models
GEMINI_NICKNAME="Gemini Duck"            # Optional: Custom provider nickname
```

#### Ollama Provider (Local)
```env
OLLAMA_BASE_URL=http://localhost:11434/v1 # Optional: Ollama server URL
OLLAMA_DEFAULT_MODEL=gemma3:4b           # Optional: Default local model
OLLAMA_MODELS=gemma3:4b,llama3.2:3b,qwen3:4b # Optional: Available local models (comma-separated)
OLLAMA_NICKNAME="Local Quacker"          # Optional: Custom provider nickname
```

#### OpenRouter Provider
```env
OPENROUTER_API_KEY=sk-or-v1-...          # Required: Your OpenRouter API key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1 # Optional: Custom endpoint URL
OPENROUTER_DEFAULT_MODEL=deepseek/deepseek-chat-v3.1:free # Optional: Default model
OPENROUTER_MODELS=deepseek/deepseek-chat-v3.1:free,moonshotai/kimi-k2:free # Optional: Available models
OPENROUTER_NICKNAME="OpenRouter Duck"    # Optional: Custom provider nickname
```

#### Groq Provider
```env
GROQ_API_KEY=gsk_...                     # Required: Your Groq API key
GROQ_BASE_URL=https://api.groq.com/openai/v1 # Optional: Custom endpoint URL
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile # Optional: Default model to use
GROQ_MODELS=llama-3.3-70b-versatile,mixtral-8x7b-32768 # Optional: Available models
GROQ_NICKNAME="Groq Duck"                # Optional: Custom provider nickname
```

#### Anthropic Provider (via OpenAI-compatible endpoint)
```env
ANTHROPIC_API_KEY=sk-ant-...             # Required: Your Anthropic API key
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1 # Optional: Custom endpoint URL
ANTHROPIC_DEFAULT_MODEL=claude-3-5-sonnet-20241022 # Optional: Default model
ANTHROPIC_MODELS=claude-3-5-sonnet-20241022,claude-3-haiku-20240307 # Optional: Available models
ANTHROPIC_NICKNAME="Claude Duck"         # Optional: Custom provider nickname
```

#### Custom Provider
```env
CUSTOM_API_KEY=...                       # Required: Your custom provider API key
CUSTOM_BASE_URL=https://api.example.com/v1 # Required: Custom provider endpoint URL
CUSTOM_DEFAULT_MODEL=custom-model        # Optional: Default model to use
CUSTOM_MODELS=model1,model2,model3       # Optional: Available models list
CUSTOM_NICKNAME="Custom Duck"            # Optional: Custom provider nickname
```

### Global Configuration

#### Core Settings
```env
DEFAULT_PROVIDER=openai                  # Optional: Default provider to use (openai, gemini, ollama, openrouter, etc.)
DEFAULT_TEMPERATURE=0.7                  # Optional: Default temperature for all requests (0.0-2.0)
LOG_LEVEL=info                          # Optional: Logging level (debug, info, warn, error)
```

#### Performance & Reliability
```env
CACHE_TTL=300                           # Optional: Cache time-to-live in seconds (default: 300)
TIMEOUT=30000                           # Optional: Request timeout in milliseconds (default: 30000)
MAX_RETRIES=3                           # Optional: Maximum retry attempts (default: 3)
```

#### Advanced Features
```env
# MCP Bridge Settings (for advanced integrations)
MCP_BRIDGE_ENABLED=true                 # Optional: Enable MCP bridge functionality
MCP_APPROVAL_MODE=trusted               # Optional: Approval mode (always, trusted, or never)
MCP_APPROVAL_TIMEOUT=300                # Optional: Approval timeout in seconds

# Context7 Documentation Server (example MCP server integration)
MCP_SERVER_CONTEXT7_TYPE=http           # Optional: MCP server type
MCP_SERVER_CONTEXT7_URL=https://mcp.context7.com/mcp # Optional: MCP server URL
MCP_SERVER_CONTEXT7_ENABLED=true       # Optional: Enable specific MCP server
MCP_TRUSTED_TOOLS_CONTEXT7=*           # Optional: Trust all tools from this server
```

### Environment Variable Priority

1. **Command-line environment variables** (highest priority)
2. **MCP client configuration** (Claude Desktop, VS Code)
3. **`.env` file** in project root
4. **`config/config.json`** file (lowest priority)

### Examples for Different Use Cases

#### Development Setup (Multiple Providers)
```env
# Local development with multiple providers
OPENAI_API_KEY=sk-your-dev-key
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_DEFAULT_MODEL=gemma3:4b
OPENROUTER_API_KEY=sk-or-v1-your-dev-key
OPENROUTER_DEFAULT_MODEL=deepseek/deepseek-chat-v3.1:free
DEFAULT_PROVIDER=ollama
LOG_LEVEL=debug
```

#### Production Setup (OpenAI + Fallback)
```env
# Production with primary and fallback providers
OPENAI_API_KEY=sk-your-prod-key
OPENAI_DEFAULT_MODEL=gpt-4o
OPENROUTER_API_KEY=sk-or-v1-your-backup-key
OPENROUTER_DEFAULT_MODEL=deepseek/deepseek-chat-v3.1:free
DEFAULT_PROVIDER=openai
LOG_LEVEL=info
CACHE_TTL=600
TIMEOUT=60000
```

#### Local-Only Setup (Ollama)
```env
# Local-only setup with Ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_DEFAULT_MODEL=gemma3:4b
OLLAMA_MODELS=gemma3:4b,llama3.2:3b,qwen3:4b,deepseek-r1:1.5b
OLLAMA_NICKNAME="Local AI Duck"
DEFAULT_PROVIDER=ollama
LOG_LEVEL=info
```

### Step 3: Restart Claude Desktop

1. Completely quit Claude Desktop (⌘+Q on Mac)
2. Launch Claude Desktop again
3. The MCP server should connect automatically

### Step 4: Test the Integration

Once restarted, test these commands in Claude:

#### Check Duck Health
```
Use the list_ducks tool with check_health: true
```
Should show:
- ✅ **GPT Duck** (openai) - Healthy
- ✅ **Gemini Duck** (gemini) - Healthy

#### List Available Models
```
Use the list_models tool
```

#### Ask a Specific Duck
```
Use the ask_duck tool with prompt: "What is rubber duck debugging?", provider: "openai"
```

#### Compare Multiple Ducks
```
Use the compare_ducks tool with prompt: "Explain async/await in JavaScript"
```

#### Test Specific Models
```
Use the ask_duck tool with prompt: "Hello", provider: "openai", model: "gpt-4"
```

### Troubleshooting Claude Desktop Setup

#### If Tools Don't Appear
1. **Check API Keys**: Ensure your API keys are correctly entered without typos
2. **Verify Build**: Run `ls -la dist/index.js` to confirm the project built successfully  
3. **Check Logs**: Look for errors in Claude Desktop's developer console
4. **Restart**: Fully quit and restart Claude Desktop after config changes

#### Connection Issues
1. **Config File Path**: Double-check you're editing the correct config file path
2. **JSON Syntax**: Validate your JSON syntax (no trailing commas, proper quotes)
3. **Absolute Paths**: Ensure you're using the full absolute path to `dist/index.js`
4. **File Permissions**: Verify Claude Desktop can read the dist directory

#### Health Check Failures
If ducks show as unhealthy:
1. **API Keys**: Verify keys are valid and have sufficient credits/quota
2. **Network**: Check internet connection and firewall settings
3. **Rate Limits**: Some providers have strict rate limits for new accounts

## Available Tools

### 🦆 ask_duck
Ask a single question to a specific LLM provider.

```typescript
{
  "prompt": "What is rubber duck debugging?",
  "provider": "openai",  // Optional, uses default if not specified
  "temperature": 0.7     // Optional
}
```

### 💬 chat_with_duck
Have a conversation with context maintained across messages.

```typescript
{
  "conversation_id": "debug-session-1",
  "message": "Can you help me debug this code?",
  "provider": "groq"  // Optional, can switch providers mid-conversation
}
```

### 📋 list_ducks
List all configured providers and their health status.

```typescript
{
  "check_health": true  // Optional, performs fresh health check
}
```

### 📊 list_models
List available models for LLM providers.

```typescript
{
  "provider": "openai",     // Optional, lists all if not specified
  "fetch_latest": false     // Optional, fetch latest from API vs cached
}
```

### 🔍 compare_ducks
Ask the same question to multiple providers simultaneously.

```typescript
{
  "prompt": "What's the best programming language?",
  "providers": ["openai", "groq", "ollama"]  // Optional, uses all if not specified
}
```

### 🏛️ duck_council
Get responses from all configured ducks - like a panel discussion!

```typescript
{
  "prompt": "How should I architect a microservices application?"
}
```

## Usage Examples

### Basic Query
```javascript
// Ask the default duck
await ask_duck({ 
  prompt: "Explain async/await in JavaScript" 
});
```

### Conversation
```javascript
// Start a conversation
await chat_with_duck({
  conversation_id: "learning-session",
  message: "What is TypeScript?"
});

// Continue the conversation
await chat_with_duck({
  conversation_id: "learning-session", 
  message: "How does it differ from JavaScript?"
});
```

### Compare Responses
```javascript
// Get different perspectives
await compare_ducks({
  prompt: "What's the best way to handle errors in Node.js?",
  providers: ["openai", "groq", "ollama"]
});
```

### Duck Council
```javascript
// Convene the council for important decisions
await duck_council({
  prompt: "Should I use REST or GraphQL for my API?"
});
```

## Provider-Specific Setup

### Ollama (Local)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Ollama automatically provides OpenAI-compatible endpoint at localhost:11434/v1
```

### LM Studio (Local)
1. Download LM Studio from https://lmstudio.ai/
2. Load a model in LM Studio
3. Start the local server (provides OpenAI-compatible endpoint at localhost:1234/v1)

### Google Gemini
1. Get API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add to environment: `GEMINI_API_KEY=...`
3. Uses OpenAI-compatible endpoint (beta)

### Groq
1. Get API key from https://console.groq.com/keys
2. Add to environment: `GROQ_API_KEY=gsk_...`

### Together AI
1. Get API key from https://api.together.xyz/
2. Add to environment: `TOGETHER_API_KEY=...`

## Verifying OpenAI Compatibility

To check if a provider is OpenAI-compatible:

1. Look for `/v1/chat/completions` endpoint in their API docs
2. Check if they support the OpenAI SDK
3. Test with curl:

```bash
curl -X POST "https://api.provider.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "model-name",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Development

### Run in Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

### Type Checking
```bash
npm run typecheck
```

## Docker Support

### Build Docker Image
```bash
docker build -t mcp-rubber-duck .
```

### Run with Docker
```bash
docker run -it \
  -e OPENAI_API_KEY=sk-... \
  -e GROQ_API_KEY=gsk_... \
  mcp-rubber-duck
```

## Architecture

```
mcp-rubber-duck/
├── src/
│   ├── server.ts           # MCP server implementation
│   ├── config/             # Configuration management
│   ├── providers/          # OpenAI client wrapper
│   ├── tools/              # MCP tool implementations
│   ├── services/           # Health, cache, conversations
│   └── utils/              # Logging, ASCII art
├── config/                 # Configuration examples
└── tests/                  # Test suites
```

## Troubleshooting

### Provider Not Working
1. Check API key is correctly set
2. Verify endpoint URL is correct
3. Run health check: `list_ducks({ check_health: true })`
4. Check logs for detailed error messages

### Connection Issues
- For local providers (Ollama, LM Studio), ensure they're running
- Check firewall settings for local endpoints
- Verify network connectivity to cloud providers

### Rate Limiting
- Enable caching to reduce API calls
- Configure failover to alternate providers
- Adjust `max_retries` and `timeout` settings

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by the rubber duck debugging method
- Built on the Model Context Protocol (MCP)
- Uses OpenAI SDK for universal compatibility

## Support

- Report issues: https://github.com/yourusername/mcp-rubber-duck/issues
- Documentation: https://github.com/yourusername/mcp-rubber-duck/wiki
- Discussions: https://github.com/yourusername/mcp-rubber-duck/discussions

---

🦆 **Happy Debugging with your AI Duck Panel!** 🦆