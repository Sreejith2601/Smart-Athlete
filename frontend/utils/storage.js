import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_USER_KEY = "currentUser"; // Currently logged-in user

// Legacy methods removed to enforce MongoDB single source of truth.
export const saveUser = async (user) => { console.warn("saveUser is deprecated. Use MongoDB."); };
export const getUsers = async () => { console.warn("getUsers is deprecated. Use MongoDB."); return []; };
export const updateUser = async (updatedUser) => { console.warn("updateUser is deprecated. Use MongoDB."); };
export const saveSession = async (session) => { console.warn("saveSession is deprecated. Use MongoDB."); };
export const getSessions = async () => { console.warn("getSessions is deprecated. Use MongoDB."); return []; };

/**
 * Set current logged-in user
 */
export const setCurrentUser = async (user) => {
  try {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.log("Error setting current user:", error);
  }
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = async () => {
  try {
    const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.log("Error getting current user:", error);
    return null;
  }
};

/**
 * Get user object (alias for getCurrentUser for backward compatibility)
 */
export const getUser = async () => {
  return await getCurrentUser();
};

/**
 * Remove user (logout)
 */
export const removeUser = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.log("Error removing user:", error);
  }
};
