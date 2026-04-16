import { API_BASE_URL, TRAINING_ENGINE_URL } from "./config";

const BASE_URL = API_BASE_URL;

/**
 * Enhanced fetch wrapper with timeout and better error messages.
 * Wraps every API call so network issues surface clearly.
 */
async function apiFetch(url, options = {}) {
  const timeout = options.timeout || 15000; // 15 second default timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Provide helpful error messages based on failure type
    if (error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${timeout / 1000}s. Is your backend running at ${BASE_URL}?`
      );
    }

    if (error.message === "Network request failed") {
      throw new Error(
        `Network request failed. Check that:\n` +
        `1. Your backend is running (node server.js)\n` +
        `2. Phone and PC are on the same Wi-Fi network\n` +
        `3. Backend URL is correct: ${BASE_URL}\n` +
        `4. Windows Firewall allows port 5000`
      );
    }

    throw error;
  }
}

export const registerUser = async (userData) => {
  try {
    console.log("[API] Calling register with:", JSON.stringify(userData, null, 2));

    const response = await apiFetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    console.log("[API] Register response status:", response.status);
    console.log("[API] Register response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("[API] Register failed:", data.message);
      throw new Error(data.message || "Registration failed");
    }

    return data;

  } catch (error) {
    console.error("[API] Register API error:", error.message);
    throw error;
  }
};

export const loginUser = async (loginData) => {
  try {
    console.log("[API] Calling login with:", JSON.stringify(loginData, null, 2));

    const response = await apiFetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();

    console.log("[API] Login response status:", response.status);
    console.log("[API] Login response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("[API] Login failed:", data.message);
      throw new Error(data.message || "Login failed");
    }

    return data;

  } catch (error) {
    console.error("[API] Login API error:", error.message);
    throw error;
  }
};

export const getProfile = async (token) => {
  try {
    console.log("[API] Calling GET /auth/me");

    const response = await apiFetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    console.log("[API] getProfile response status:", response.status);
    console.log("[API] getProfile response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("[API] getProfile failed:", data.message);
      throw new Error(data.message || "Failed to fetch profile");
    }

    return data;

  } catch (error) {
    console.error("[API] getProfile error:", error.message);
    throw error;
  }
};
export const updateProfile = async (token, profileData) => {
  try {
    console.log("[API] Calling PUT /auth/me");

    const response = await apiFetch(`${BASE_URL}/auth/me`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    console.log("[API] updateProfile response status:", response.status);
    console.log("[API] updateProfile response data:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("[API] updateProfile failed:", data.message);
      throw new Error(data.message || "Failed to update profile");
    }

    return data;

  } catch (error) {
    console.error("[API] updateProfile error:", error.message);
    throw error;
  }
};
export const saveTrainingSession = async (token, sessionData) => {
  try {
    console.log("[API] Calling POST /training/session");

    const response = await apiFetch(`${BASE_URL}/training/session`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionData)
    });

    const data = await response.json();

    console.log("[API] saveTrainingSession response status:", response.status);

    if (!response.ok) {
      console.error("[API] saveTrainingSession failed:", data.message);
      throw new Error(data.message || "Failed to save training session");
    }

    return data;
  } catch (error) {
    console.error("[API] saveTrainingSession error:", error.message);
    throw error;
  }
};

export const getTrainingByAthlete = async (token) => {
  try {
    console.log("[API] Calling GET /training/plans");

    const res = await apiFetch(`${BASE_URL}/training/plans`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    console.log("[API] getTrainingByAthlete response status:", res.status);
    console.log("[API] getTrainingByAthlete data:", data);

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[API] getTrainingByAthlete error:", error.message);
    return [];
  }
};

export const getActiveSessions = async (token) => {
  const data = await getTrainingByAthlete(token);
  return (Array.isArray(data) ? data : []).filter(item => item.status === "pending");
};

// This calls the REAL active sessions endpoint (ActiveSession collection) for live tracking
export const getLiveActiveSessions = async (token) => {
  try {
    const res = await apiFetch(`${BASE_URL}/training/active-sessions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    console.log("[API] getLiveActiveSessions:", data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[API] getLiveActiveSessions error:", error.message);
    return [];
  }
};

export const getTrainingSessions = async (token) => {
  return await getTrainingByAthlete(token);
};
export const getAthletes = async (token) => {
  try {
    console.log("[API] Calling GET /auth/athletes");

    const response = await apiFetch(`${BASE_URL}/auth/athletes`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    console.log("[API] getAthletes response status:", response.status);

    if (!response.ok) {
      console.error("[API] getAthletes failed:", data.message);
      throw new Error(data.message || "Failed to fetch athletes");
    }

    return data;
  } catch (error) {
    console.error("[API] getAthletes error:", error.message);
    throw error;
  }
};

export const getCoaches = async (token) => {
  try {
    console.log("[API] Calling GET /auth/coaches");

    const response = await apiFetch(`${BASE_URL}/auth/coaches`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    console.log("[API] getCoaches response status:", response.status);

    if (!response.ok) {
      console.error("[API] getCoaches failed:", data.message);
      throw new Error(data.message || "Failed to fetch coaches");
    }

    return data;
  } catch (error) {
    console.error("[API] getCoaches error:", error.message);
    throw error;
  }
};

export const createTrainingPlan = async (planData, token) => {
  const response = await apiFetch(`${BASE_URL}/training/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(planData)
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create training plan");
  }
  return data;
};

export const sendChatMessage = async (token, messageData) => {
  try {
    const response = await apiFetch(`${BASE_URL}/chat/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageData) // { receiverId, text }
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to send message");
    return data;
  } catch (error) {
    console.error("[API] sendChatMessage error:", error.message);
    throw error;
  }
};

export const getChatMessages = async (token, otherUserId) => {
  try {
    const response = await apiFetch(`${BASE_URL}/chat/${otherUserId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch messages");
    return data;
  } catch (error) {
    console.error("[API] getChatMessages error:", error.message);
    throw error;
  }
};
export const startActiveSession = async (sessionData, token) => {
  try {
    const res = await apiFetch(`${BASE_URL}/training/active-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(sessionData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to start session");
    return data;
  } catch (error) {
    console.error("[API] startActiveSession error:", error.message);
    throw error;
  }
};

export const endActiveSession = async (sessionId, token) => {
  try {
    const res = await apiFetch(`${BASE_URL}/training/active-session`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sessionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to end session");
    return data;
  } catch (error) {
    console.error("[API] endActiveSession error:", error.message);
    throw error;
  }
};



export const getAthleteSessionHistory = async (token, athleteId = null) => {
  try {
    const url = athleteId ? `${BASE_URL}/training/sessions?athleteId=${athleteId}` : `${BASE_URL}/training/sessions`;
    console.log(`[API] Calling GET ${url}`);

    const res = await apiFetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    console.log("[API] getAthleteSessionHistory response status:", res.status);

    if (!res.ok) {
      console.error("[API] getAthleteSessionHistory failed:", data.message);
      throw new Error(data.message || "Failed to fetch session history");
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[API] getAthleteSessionHistory error:", error.message);
    return [];
  }
};

export const deleteTrainingPlan = async (programId, token) => {
  try {
    const response = await apiFetch(`${BASE_URL}/training/delete/${programId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to delete training plan");
    return data;
  } catch (error) {
    console.error("[API] deleteTrainingPlan error:", error.message);
    throw error;
  }
};

export const getWeeklyAnalytics = async (token) => {
  try {
    console.log("[API] Calling GET /analytics/weekly");

    const res = await apiFetch(`${BASE_URL}/analytics/weekly`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    console.log("[API] getWeeklyAnalytics response status:", res.status);
    console.log("[API] getWeeklyAnalytics data:", data);

    if (!res.ok) {
      console.error("[API] getWeeklyAnalytics failed:", data.message);
      throw new Error(data.message || "Failed to fetch weekly analytics");
    }

    return data;
  } catch (error) {
    console.error("[API] getWeeklyAnalytics error:", error.message);
    return null;
  }
};

export const getCPIMetrics = async (token, athleteId = null, mode = "all") => {
  try {
    let url = athleteId ? `${BASE_URL}/analytics/cpi?athleteId=${athleteId}` : `${BASE_URL}/analytics/cpi`;
    if (mode !== "all") {
      url += (url.includes("?") ? "&" : "?") + `mode=${mode}`;
    }
    const res = await apiFetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return res.ok ? data : null;
  } catch (_) {
    return null;
  }
};

export const getCPITrendMetrics = async (token, athleteId = null, mode = "all") => {
  try {
    let url = athleteId ? `${BASE_URL}/analytics/cpi-trend?athleteId=${athleteId}` : `${BASE_URL}/analytics/cpi-trend`;
    if (mode !== "all") {
      url += (url.includes("?") ? "&" : "?") + `mode=${mode}`;
    }
    const res = await apiFetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return res.ok ? data : [];
  } catch (_) {
    return [];
  }
};

export const getSmartInsights = async (token, athleteId = null, mode = "all") => {
  try {
    let url = athleteId ? `${BASE_URL}/analytics/insights?athleteId=${athleteId}` : `${BASE_URL}/analytics/insights`;
    if (mode !== "all") {
      url += (url.includes("?") ? "&" : "?") + `mode=${mode}`;
    }
    const res = await apiFetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return res.ok ? data : null;
  } catch (_) {
    return null;
  }
};

export const getTrainingComparison = async (token, athleteId = null) => {
  try {
    const url = athleteId ? `${BASE_URL}/analytics/comparison?athleteId=${athleteId}` : `${BASE_URL}/analytics/comparison`;
    const res = await apiFetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return res.ok ? data : [];
  } catch (_) {
    return [];
  }
};

export const getActiveTrainingPlan = async (token, athleteId) => {
  try {
    const res = await apiFetch(`${BASE_URL}/training-program/${athleteId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return res.ok ? data : null;
  } catch (_) {
    return null;
  }
};


export const saveOnboardingMetrics = async (token, metricsData) => {
  try {
    const response = await apiFetch(`${BASE_URL}/analytics/onboarding`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(metricsData)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to save onboarding metrics");
    return data;
  } catch (error) {
    console.error("[API] saveOnboardingMetrics error:", error.message);
    throw error;
  }
};

export default BASE_URL;

// ─── FORGOT / RESET PASSWORD (New) ──────────────────────────────────────────

export const forgotPasswordApi = async (email) => {
  try {
    console.log("[API] Calling POST /auth/forgot-password for:", email);
    const response = await apiFetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  } catch (error) {
    console.error("[API] forgotPasswordApi error:", error.message);
    throw error;
  }
};

export const resetPasswordApi = async (email, code, newPassword) => {
  try {
    console.log("[API] Calling POST /auth/reset-password");
    const response = await apiFetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Reset failed");
    return data;
  } catch (error) {
    console.error("[API] resetPasswordApi error:", error.message);
    throw error;
  }
};

export const getDailyAIPlan = async (token, payload) => {
  try {
    const res = await fetch(`${TRAINING_ENGINE_URL}/daily-plan`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch AI plan');
    return data;
  } catch (err) { throw err; }
};
