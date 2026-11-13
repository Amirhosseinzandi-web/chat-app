import axios from "axios";
import { getAuthToken } from "./authToken";


const baseConfig = {
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
}



export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CHAT_APP_API_URL,
    ...baseConfig,
})


// send the JWT in the Authorization header (browser/cookie independent)
axiosInstance.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})




export const customInstance = axios.create({
    baseURL: "http://localhost:5000",
    ...baseConfig,
})
