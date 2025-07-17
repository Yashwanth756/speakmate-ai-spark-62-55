const backend_url = import.meta.env.VITE_backend_url

export function getWeeklyData(dailyData) {
  // Initialize map for each day of week
  
  return dailyData.slice(0, 7).reverse();
}

export function getRadarData(dailyData) {
  const skillKeys = ["speaking", "pronunciation", "vocabulary", "grammar", "story", "reflex"];
  const radarData = [];

  skillKeys.forEach(skill => {
    const total = dailyData.reduce((sum, day) => sum + (day[skill] || 0), 0);
    const average = total / dailyData.length;
    radarData.push({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1), // Capitalize
      value: Math.round(average),
      fullMark: 100
    });
  });

  return radarData;
}

export const updateDailyData = async(dailyData, currDayObj) => {
  // console.log("Updating daily data:", dailyData);
  const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
  const username = userSession.email || "Guest";
  console.log(username)
  const response = await fetch(backend_url + "updateDailyData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, dailyData, currDayObj })
      });
 
  const data = await response.json();
  return data;
}