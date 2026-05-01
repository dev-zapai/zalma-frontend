import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const publicApi = axios.create({
  baseURL: `${BACKEND_URL}/api/public`,
  headers: { 'Content-Type': 'application/json' },
});

export default publicApi;
