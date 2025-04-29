import axios, { AxiosInstance } from 'axios';
import { defaultBaseURL } from './util';

const httpClient: AxiosInstance = axios.create({
  baseURL: defaultBaseURL,
  headers: {
    'Content-Type': 'application/json',
    },
});

httpClient.interceptors.response.use(
  response => response,
  error => {
    console.error('HTTP Client error:', error);
    return Promise.reject(error);
  }
);

export default httpClient; 