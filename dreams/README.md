# Pistols at Dawn Daydreams Agents

## Usage

* Get your preferred LLM provider API Key, from [OpenAI](https://openai.com/index/openai-api/), [DeepSeek](https://api-docs.deepseek.com/) or wherever.

* Get an **OpenRouter** [API Key](https://openrouter.ai/settings/keys) and setup yout [integrations](https://openrouter.ai/settings/integrations).

* [Install](https://docs.trychroma.com/docs/overview/getting-started) and [start](https://docs.trychroma.com/docs/run-chroma/client-server?lang=typescript) **ChromaDB**, or setup [Chroma Cloud](https://trychroma.com/signup)

```bash
pip install chromadb
pnpm run chromadb
```

* Edit `.env`

```bash
cp .env.example .env
```

| Variable                 | Defaults                     |
|--------------------------|------------------------------|
| OPENROUTER_API_KEY       | <required>                   |
| GRAPHQL_URL              | http://0.0.0.0:8080/graphql  |
| STARKNET_RPC_URL         | http://127.0.0.1:5050        |
| STARKNET_ADDRESS         | 0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819 |
| STARKNET_PRIVATE_KEY     | 0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4 |
| CHROMA_URL               | http://localhost:8000        |

* Build

```bash
cd dreams
pnpm install
pnpm build
npx hello
```

* Run agents

```bash
npx scarecrow
```
