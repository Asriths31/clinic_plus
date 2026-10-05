import axios from 'axios';

const baseURL="https://clinic-plus-server.vercel.app/"
// const baseURL="http://localhost:2000/api"
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const err = new Error(error.response?.data?.message || 'Something went wrong');
    err.status = error.response?.status;
    err.data = error.response?.data;
    return Promise.reject(err);
  }
);

async function request(endpoint, options = {}) {
  const config = {
    url: endpoint,
    method: options.method || 'GET',
    data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined,
    ...options
  };
  delete config.body;
  return api(config);
}

export default request;