
// Enhanced progress data with daily tracking and analytics
// In a real app, this would come from a database
import {getWeeklyData, getRadarData, updateDailyData} from "./utils";

const getUserData = async () => {
  const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
  const email = userSession.email || "a@gmail.com";
  const response = await fetch("http://localhost:5000/getUserData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
  const data = await response.json();
  return data;
}
let data;
export const getData = async () => {
  data = await getUserData();
}
// data = await getData();
// await getData()
// console.log('Data fetched:', data);






export const overallProgress = {
  speaking: 65,
  pronunciation: 78,
  vocabulary: 62,
  grammar: 70,
  story: 55,
  reflex: 40,
};

export const generateDailyData = async() => {
  data = await getUserData();
  console.log('Daily data fetched:', data['dailyData']);
  return data['dailyData'];
};

export const dailyData =  await generateDailyData();
export const loadDailyData = ()=>{
  return data['dailyData'] || [];
}
export const weeklyData = () => {
  return getWeeklyData(data['dailyData'] || []);  
}

export let radarData =()=>( getRadarData(data['dailyData']));

export let moduleCompletionData =()=> ([
  { name: "Speaking", completion: data.speakingCompletion, color: "#9b87f5" },
  { name: "Pronunciation", completion: data.pronunciationCompletion, color: "#33C3F0" },
  { name: "Vocabulary", completion: data.vocabularyCompletion, color: "#F06292" },
  { name: "Grammar", completion: data.grammarCompletion, color: "#AED581" },
  { name: "Story", completion: data.storyCompletion, color: "#FFD54F" },
  { name: "Reflex", completion: data.reflexCompletion, color: "#FF7043" },
]);

export let activityLog =()=> (data['activityLog'])


// Performance analytics
export const getPerformanceAnalytics = () => {
  const recent7Days = data['dailyData'].slice(-7);
  const previous7Days = data['dailyData'].slice(-14, -7);
  
  const modules = ['speaking', 'pronunciation', 'vocabulary', 'grammar', 'story', 'reflex'];
  
  const analytics = modules.map(module => {
    const recentAvg = recent7Days.reduce((sum, day) => sum + day[module], 0) / 7;
    const previousAvg = previous7Days.reduce((sum, day) => sum + day[module], 0) / 7;
    const improvement = recentAvg - previousAvg;
    const trend = improvement > 2 ? 'improving' : improvement < -2 ? 'declining' : 'stable';
    
    return {
      module: module.charAt(0).toUpperCase() + module.slice(1),
      current: Math.round(recentAvg),
      previous: Math.round(previousAvg),
      improvement: Math.round(improvement * 10) / 10,
      trend,
      color: moduleCompletionData().find(m => m.name.toLowerCase() === module)?.color || '#gray'
    };
  });
  
  return analytics;
};

// Intelligent feedback system
export const generateIntelligentFeedback = () => {
  const analytics = getPerformanceAnalytics();
  const recentData = data['dailyData'].slice(-7);
  const totalStudyTime = recentData.reduce((sum, day) => sum + day.totalTime, 0);
  const avgDailyTime = totalStudyTime / 7;
  
  const strongestModule = analytics.reduce((max, module) => 
    module.current > max.current ? module : max
  );
  
  const weakestModule = analytics.reduce((min, module) => 
    module.current < min.current ? module : min
  );
  
  const improvingModules = analytics.filter(m => m.trend === 'improving');
  const decliningModules = analytics.filter(m => m.trend === 'declining');
  
  const feedback = {
    overall: {
      grade: calculateOverallGrade(analytics),
      message: generateOverallMessage(analytics, avgDailyTime),
      studyTime: Math.round(avgDailyTime),
      consistency: calculateConsistency(recentData)
    },
    strengths: [
      `Excellent progress in ${strongestModule.module} (${strongestModule.current}%)`,
      ...(improvingModules.length > 0 ? [`Improving trend in ${improvingModules.map(m => m.module).join(', ')}`] : [])
    ],
    improvements: [
      `Focus more on ${weakestModule.module} (${weakestModule.current}%)`,
      ...(decliningModules.length > 0 ? [`Address declining performance in ${decliningModules.map(m => m.module).join(', ')}`] : []),
      ...(avgDailyTime < 30 ? ['Increase daily study time for better results'] : [])
    ],
    recommendations: generateRecommendations(analytics, avgDailyTime)
  };
  
  return feedback;
};

const calculateOverallGrade = (analytics) => {
  const average = analytics.reduce((sum, m) => sum + m.current, 0) / analytics.length;
  if (average >= 85) return 'A';
  if (average >= 75) return 'B+';
  if (average >= 65) return 'B';
  if (average >= 55) return 'C+';
  if (average >= 45) return 'C';
  return 'D';
};

const generateOverallMessage = (analytics, avgDailyTime) => {
  const average = analytics.reduce((sum, m) => sum + m.current, 0) / analytics.length;
  
  if (average >= 80) {
    return "Outstanding performance! You're excelling across all modules.";
  } else if (average >= 70) {
    return "Great job! You're showing strong progress in your English learning journey.";
  } else if (average >= 60) {
    return "Good progress! Keep up the consistent practice to see even better results.";
  } else {
    return "You're on the right track! Focus on consistent practice to improve your skills.";
  }
};

const calculateConsistency = (recentData) => {
  const dailyTotals = recentData.map(day => 
    (day.speaking + day.pronunciation + day.vocabulary + day.grammar + day.story + day.reflex) / 6
  );
  
  const average = dailyTotals.reduce((sum, total) => sum + total, 0) / dailyTotals.length;
  const variance = dailyTotals.reduce((sum, total) => sum + Math.pow(total - average, 2), 0) / dailyTotals.length;
  const consistency = Math.max(0, 100 - Math.sqrt(variance));
  
  return Math.round(consistency);
};

const generateRecommendations = (analytics, avgDailyTime) => {
  const recommendations = [];
  
  // Time-based recommendations
  if (avgDailyTime < 20) {
    recommendations.push("Aim for at least 20-30 minutes of daily practice");
  } else if (avgDailyTime > 90) {
    recommendations.push("Great dedication! Consider shorter, more focused sessions");
  }
  
  // Module-specific recommendations
  const weakModules = analytics.filter(m => m.current < 60);
  if (weakModules.length > 0) {
    recommendations.push(`Prioritize practice in: ${weakModules.map(m => m.module).join(', ')}`);
  }
  
  // Trend-based recommendations
  const decliningModules = analytics.filter(m => m.trend === 'declining');
  if (decliningModules.length > 0) {
    recommendations.push("Review fundamentals in modules showing decline");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Maintain your excellent practice routine!");
  }
  
  return recommendations;
};
