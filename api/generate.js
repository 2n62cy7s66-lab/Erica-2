import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { school, grade, currentGrade, targetSchool, targetMajor, extraInfo } = req.body;

  if (!school || !grade) {
    return res.status(400).json({ error: '학교와 학년 정보를 입력해 주세요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
[학생 정보]
- 현재 학교: ${school}
- 학년: ${grade}
- 현재 성적/수준: ${currentGrade || '미입력'}
- 희망 학교: ${targetSchool || '미입력'}
- 희망 학과: ${targetMajor || '미입력'}
- 추가 요청사항: ${extraInfo || '없음'}

당신은 최고의 입시/학습 컨설턴트입니다. 위 학생의 정보와 목표에 맞춰 최적화된 "하루 공부 시간표(07:00 ~ 23:00)" 및 "학습 전략 설명"을 작성해주세요.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.STRING },
                  end: { type: Type.STRING },
                  task: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ['start', 'end', 'task', 'category']
              }
            },
            description: { type: Type.STRING }
          },
          required: ['schedule', 'description']
        }
      }
    });

    const resultText = response.text;
    const data = JSON.parse(resultText);
    return res.status(200).json(data);

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: '시간표 생성 중 오류가 발생했습니다.' });
  }
}
