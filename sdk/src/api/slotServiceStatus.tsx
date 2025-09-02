
export type SlotServiceStatusResponse = {
  service?: string,
  success?: boolean,
  version?: string,
  error?: string,
}

export const apiSlotServiceStatus = async (
  serviceUrl: string,
): Promise<SlotServiceStatusResponse> => {
  let result: SlotServiceStatusResponse;
  try {
    let params = {};
    console.log(`apiSlotServiceStatus() URL:`, serviceUrl, params)
    const resp = await fetch(serviceUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    result = await resp.json() as SlotServiceStatusResponse;
    if (result.error) {
      console.warn("apiSlotServiceStatus() ERROR:", result.error);
      if (typeof result.error !== 'string') {
        result.error = JSON.stringify(result.error);
      }
    }
  } catch (error) {
    console.error("apiSlotServiceStatus() EXCEPTION:", error);
    result = { error: error.toString() };
  }

  return result
}
