export const sendMessageToGemini = async (
  userMessage: string, 
  contextData: string,
  userEmail?: string
): Promise<string> => {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        contextData,
        userEmail: userEmail || 'anonymous',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `Server error ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return "SYSTEM FAILURE: Unable to connect to the strategy mainframe. Check your network connection.";
  }
};

export const getMemoryStats = async (email: string): Promise<{ total: number; first_conversation: string | null; last_conversation: string | null } | null> => {
  try {
    const res = await fetch(`/api/ai/memory/stats?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const clearMemory = async (email: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/ai/memory', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  } catch {
    return false;
  }
};
