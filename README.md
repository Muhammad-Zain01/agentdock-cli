# AgentDock CLI

Local TypeScript playground for the `agentdock` harness.

## Setup

From this directory:

```bash
yarn install
yarn build
```

Create a `.env` file in this directory:

```env
OPENROUTER_API_KEY=your-key
```

The CLI loads this file automatically. Do not commit it.

## Usage

```bash
yarn start
yarn start -- --resume <session-id>
yarn start -- --latest
yarn start -- --allow-writes
yarn dev sessions
yarn dev inspect <session-id>
```

For the default AgentDock workspace, use:

```bash
yarn start
```

Once running, enter prompts continuously. Use `/help` for interactive commands.

Sessions are stored under `sessions/` and are ignored by git.
