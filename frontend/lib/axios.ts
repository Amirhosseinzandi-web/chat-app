import axios from "axios";




export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CHAT_APP_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})