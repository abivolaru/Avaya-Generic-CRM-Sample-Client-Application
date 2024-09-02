import axios from 'axios';

const token = btoa(`${process.env.REACT_APP_USER_EMAIL}/token:${process.env.REACT_APP_API_KEY}`);

var axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 2000,
  headers: {
    'Authorization' : `Basic ${token}`,
    'Content-Type': 'application/json',
  }
});

export default axiosInstance;
