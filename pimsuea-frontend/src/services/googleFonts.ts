import axios from 'axios';
import type { GoogleFont, GoogleFontsResponse } from '@/types/font';

const API_KEY = import.meta.env.VITE_PUBLIC_GOOGLE_FONTS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';

export const fetchGoogleFonts = async (): Promise<GoogleFont[]> => {
  if (!API_KEY) {
    console.warn("Google Fonts API Key is missing. Font picker will be empty.");
    return [];
  }

  try {
    const response = await axios.get<GoogleFontsResponse>(BASE_URL, {
      params: {
        key: API_KEY,
        sort: 'popularity', // Get most popular fonts first
      },
    });
    return response.data.items;
  } catch (error) {
    console.error("Failed to fetch Google Fonts:", error);
    return [];
  }
};
