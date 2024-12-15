import axios from 'axios';
import { getData } from './storage'; // 저장된 데이터 불러오기

export const askChatGPTWithImage = async () => {
  try {
    //api 확인
    const CHATGPT_API_KEY = await getData('api');
    if (!CHATGPT_API_KEY) {
      console.error('저장된 api를 찾을 수 없습니다.');
      throw new Error('전송할 api가 없습니다.');
    } else {
      console.log('전송할 api 준비 확인');
    }

    //이미지 확인
    const base64Image = await getData('capturedImage');
    if (!base64Image) {
      console.error('저장된 이미지를 찾을 수 없습니다.');
      throw new Error('전송할 이미지가 없습니다.');
    } else {
      console.log('전송할 이미지 준비 확인');
    }

    //프롬프트 확인
    const prompt = await getData("prompt");
    if (!prompt) {
      console.error('저장된 프롬프트를 찾을 수 없습니다.');
      throw new Error('전송할 프롬프트가 없습니다.');
    } else {
      console.log('전송할 프롬프트 준비 확인');
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages:[
          {
            role: "system",
            content: "당신은 시각장애인을 위한 AI입니다.",
          },{
            role: "user",
            content: [
              { type: "text", text: `질문 : ${prompt}, 한국어로 응답하고 4-5줄로 응답해줘. 질문이 이상하거나 아무런 지시도 없다면 질문을 정확하게 하라고 지시해줘.` },
              {
                type: "image_url",
                image_url: {
                  "url": `data:image/jpeg;base64,${base64Image}`,
                },
              }
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHATGPT_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('ChatGPT API 요청 중 오류:', error);
    throw new Error('ChatGPT 응답을 받지 못했습니다. 오류가 발생했습니다.');
  }
};

export const askChatGPTWithText = async () => {
  try {
    //api 확인
    const CHATGPT_API_KEY = await getData('api');
    if (!CHATGPT_API_KEY) {
      console.error('저장된 api를 찾을 수 없습니다.');
      throw new Error('전송할 api가 없습니다.');
    } else {
      console.log('전송할 api 준비 확인');
    }

    //질문 확인
    const prompt = await getData("prompt");
    if (!prompt) {
      console.error('저장된 질문를 찾을 수 없습니다.');
      throw new Error('전송할 질문이 없습니다.');
    } else {
      console.log('전송할 질문 준비 확인');
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages:[
          {
            role: "system",
            content: '당신은 시각장애인을 위한 AI입니다.',
          },
          {
            role: "user",
            content: `질문 : ${prompt}, 한국어로 응답하고 8-10줄로 응답해줘. 질문이 이상하거나 아무런 지시도 없다면 질문을 정확하게 하라고 지시해줘.`,
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHATGPT_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('ChatGPT API 요청 중 오류:', error);
    throw new Error('ChatGPT 응답을 받지 못했습니다. 오류가 발생했습니다.');
  }
};