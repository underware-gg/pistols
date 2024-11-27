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

export async function elizaMessage(input: string, agentId?: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${ELIZA_SERVER_URL}:${ELIZA_SERVER_PORT}/${agentId || ELIZA_AGENT_ID}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          userId: "user",
          userName: "User",
        }),
      }
    );
    const data = await response.json();
    data.forEach((message: any) => console.log(`${"Agent"}: ${message.text}`))
    return data.map((message: any) => message.text as string)
  } catch (error) {
    console.error("Error fetching response:", error);
    return ['Agent is confused']
  }
}

export const useElizaMessage = (agentId?: string) => {
  const [responses, setResponses] = useState<string[]>([])

  const sendMessage = useCallback(async (input: string) => {
    setResponses(['...'])
    const result = await elizaMessage(input, agentId)
    setResponses(result)
  }, [agentId])

  return {
    sendMessage,
    responses,
  }
}
