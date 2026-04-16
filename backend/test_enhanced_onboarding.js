const axios = require('axios');

async function testEnhancedOnboarding() {
  const payload = {
    name: "Enhanced Athlete",
    email: `athlete_${Date.now()}@test.com`,
    password: "password123",
    role: "athlete",
    age: 25,
    gender: "male",
    sport: "marathon",
    profile: {
      bloodGroup: "O+",
      address: {
        city: "San Francisco",
        state: "CA",
        pinCode: "94105"
      },
      emergencyContact: {
        name: "Emergency Person",
        phone: "123-456-7890"
      },
      achievements: [
        { event: "State Marathon", position: "1st", year: "2023" },
        { event: "District 10K", position: "Gold", year: "2022" }
      ],
      goal: "Qualify for Boston"
    }
  };

  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', payload);
    console.log("Registration Success:", response.status);
    console.log("User Data snippet:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Registration Failed:", error.response?.data || error.message);
  }
}

testEnhancedOnboarding();
