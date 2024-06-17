import axios from 'axios';

const API_BASE_URL = 'https://56f7-196-203-109-214.ngrok-free.app/predict';

export const AiModel = {
  predict: async (data: FormData) => {
    try {
      const response = await axios.post(API_BASE_URL, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      return { error: 'Prediction failed' };
    }
  },
};
