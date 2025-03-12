import Cookies from 'js-cookie';

// Set cookie data with an expiration time
export const setCache = (key, value, expirationDays = 1) => {
  Cookies.set(key, JSON.stringify(value), { expires: expirationDays });
};

// Get cookie data, return null if not found
export const getCache = (key) => {
  const data = Cookies.get(key);
  return data ? JSON.parse(data) : null;
};

// Remove specific cached data
export const removeCache = (key) => {
  Cookies.remove(key);
};
