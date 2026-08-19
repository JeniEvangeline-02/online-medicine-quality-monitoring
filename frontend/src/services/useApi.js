import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost, apiPut, apiDel } from './api';

export const useApi = () => {
  const { accessToken } = useAuth();
  return {
    get:    (path) => apiGet(path, accessToken),
    post:   (path, body) => apiPost(path, body, accessToken),
    put:    (path, body) => apiPut(path, body, accessToken),
    delete: (path) => apiDel(path, accessToken),
  };
};
