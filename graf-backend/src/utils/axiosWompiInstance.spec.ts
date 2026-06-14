jest.unmock('./axiosWompiInstance');
import axios from 'axios';
import { createAxiosInstance } from './axiosWompiInstance';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const originalEnvWompi = process.env;

describe('axiosWompiInstance', () => {
  beforeEach(() => {
    process.env = { ...originalEnvWompi };
    mockedAxios.create.mockClear();
  });

  afterEach(() => {
    process.env = originalEnvWompi;
  });

  it('creates axios instance with env configuration', () => {
    process.env.WOMPI_BASE_URL = 'https://wompi.example.com';
    process.env.WOMPI_PRIVATE_KEY = 'secret-key';

    const instance = { name: 'axiosInstance' };
    mockedAxios.create.mockReturnValue(instance as any);

    const result = createAxiosInstance();

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'https://wompi.example.com',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret-key',
      },
    });
    expect(result).toBe(instance);
  });
});
