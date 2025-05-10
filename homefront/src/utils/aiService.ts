import axios from 'axios';

// Proxy the OpenAI request through your backend to keep the API key secure
export const getAIAnalysis = async (data: any) => {
  try {
    const response = await axios.post('/ai/analyze', {
      data: JSON.stringify(data),
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data.analysis;
  } catch (err) {
    console.error('Error fetching AI analysis:', err);
    throw err;
  }
};