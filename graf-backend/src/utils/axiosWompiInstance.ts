import axios, { AxiosInstance } from 'axios';

export const createAxiosInstance = () => {
  return axios.create({
    baseURL: process.env.WOMPI_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
    },
  });
};

const axiosWompi: AxiosInstance = createAxiosInstance();

export default axiosWompi;
