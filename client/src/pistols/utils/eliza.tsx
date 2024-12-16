import { useCallback, useState } from 'react'

//--------------------------------
// eliza agent interface
// 
// barkeep agent:
// https://github.com/underware-gg/eliza-starter
//
// eliza referemce:
// https://ai16z.github.io/eliza/docs/intro/
//
// Configuration (eliza .env file)
// SERVER_PORT=3001
//
//--------------------------------

export const ELIZA_SERVER_URL = 'http://localhost'
export const ELIZA_SERVER_PORT = 3001
export const ELIZA_AGENT_ID = 'barkeep'

export async function elizaMessage({
  userId,
  userName,
  agentId,
  input,
}: {
  userId: string,
  userName: string,
  agentId: string,
  input: string,
}): Promise<string[]> {
  try {
    const response = await fetch(
      `${ELIZA_SERVER_URL}:${ELIZA_SERVER_PORT}/${agentId}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          userId,
          userName,
        }),
      }
    );
    const data = await response.json();
    data.forEach((message: any) => console.log(`elizaMessage() Agent: [${message.text}]`))
    return data.map((message: any) => message.text as string)
  } catch (error) {
    console.error("elizaMessage() ERROR:", error);
    return ['Agent is confused.']
  }
}

export const useElizaMessage = (username: string, agentId?: string) => {
  const [responses, setResponses] = useState<string[]>([])

  const sendMessage = useCallback(async (input: string) => {
    setResponses(['...'])
    const result = await elizaMessage({
      input,
      userId: (username ? username : "localhost").toLowerCase(),
      userName: `${(username ? username : "localhost").toUpperCase().slice(0, 1)}${(username ? username : "localhost").toLowerCase().slice(1)}`,
      agentId: agentId || ELIZA_AGENT_ID,
    })
    setResponses(result)
  }, [username, agentId])

  return {
    sendMessage,
    responses,
  }
}
