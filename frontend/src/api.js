import axios from 'axios';
import { getMockResponse } from './mockResponse';

export const USE_MOCK = true;

function wait(duration) {
  return new Promise(resolve => {
    window.setTimeout(resolve, duration);
  });
}

export async function analyseCase(formData) {
  if (USE_MOCK) {
    await wait(1500);
    return getMockResponse(formData);
  }

  const response = await axios.post('http://localhost:5000/analyse', formData);
  return response.data;
}
