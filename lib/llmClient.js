export async function askLLM(systemPrompt, userPrompt, { jsonMode = false } = {}) {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const groqPayload = {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
  };

  if (jsonMode) {
    groqPayload.response_format = { type: 'json_object' };
  }

  async function callGroq() {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(groqPayload)
    });
    if (!res.ok) throw new Error(`Groq API Error: ${res.statusText}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  async function callGemini() {
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY is missing for fallback');
    
    // Using Gemini 1.5 Flash via REST API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const geminiPayload = {
      contents: [{
        parts: [{ text: combinedPrompt }]
      }]
    };
    
    if (jsonMode) {
      geminiPayload.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });
    
    if (!res.ok) throw new Error(`Gemini API Error: ${res.statusText}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  async function fetchWithFallback() {
    try {
      return await callGroq();
    } catch (err) {
      console.warn('Groq call failed, trying Gemini fallback...', err.message);
      return await callGemini();
    }
  }

  let textResult = await fetchWithFallback();

  if (jsonMode) {
    try {
      return JSON.parse(textResult);
    } catch (err) {
      console.warn('JSON parse failed, retrying once with correction message...');
      
      // Retry once appending correction message
      userPrompt += '\n\nReturn ONLY valid JSON, no prose, no markdown fences.';
      groqPayload.messages[1].content = userPrompt;
      textResult = await fetchWithFallback();
      
      try {
        let cleaned = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      } catch (retryErr) {
        throw new Error('LLM returned malformed JSON after retry.');
      }
    }
  }

  return textResult;
}
