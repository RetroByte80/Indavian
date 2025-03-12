import { setCache, getCache } from "../utils/CookiesUtils.js"; // Import cookie utilities

export const fetchDataWithCache = async (url, options = {}) => {
    const cachedData = getCache(url);
  
    if (cachedData) {
      console.log('Serving data from cache');
      return cachedData;
    }
  
    try {
      // Make an API call with provided options
      const response = await fetch(url, options);
  
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
  
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      let data;
  
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();  // Parse as JSON if the response is JSON
      } else {
        throw new Error('Received non-JSON response');
      }

      // Store the fetched data in cookies with a default expiration of 1 day
      setCache(url, data);

      console.log('Fetched new data from API');
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };  