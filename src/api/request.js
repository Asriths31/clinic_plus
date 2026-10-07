import axios from 'axios';

const baseURL="https://clinic-plus-server.onrender.com/api"
// const baseURL="http://localhost:2000/api"

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const err = new Error(error.response?.data?.message || 'Something went wrong');
    err.status = error.response?.status;
    err.data = error.response?.data;
    return Promise.reject(err);
  }
);

export default axiosInstance;