import axios from 'axios';

const axiosServer = axios.create({
  baseURL: typeof window === 'undefined' ? process.env.API_URL : process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export default axiosServer;
