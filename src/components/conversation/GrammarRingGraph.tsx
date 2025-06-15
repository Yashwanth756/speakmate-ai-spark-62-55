
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts';

interface GrammarRingGraphProps {
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  userSentence?: string;
  correctedSentence?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#16a34a'; // green-600
  if (score >= 60) return '#f59e42'; // amber-500
  return '#ef4444'; // red-500
};

const GrammarRingGraph: React.FC<GrammarRingGraphProps> = ({
  fluencyScore,
  vocabularyScore,
  grammarScore
}) => {
  // Memoized/recomputed when scores change
  const roundedFluency = Math.round(fluencyScore);
  const roundedVocabulary = Math.round(vocabularyScore);
  const roundedGrammar = Math.round(grammarScore);
  const averageScore = Math.round((roundedFluency + roundedVocabulary + roundedGrammar) / 3);

  // Data for RadialBarChart (animated & auto-updates)
  const data = [
    { name: 'Fluency', value: roundedFluency, fill: '#3b82f6' }, // blue-500
    { name: 'Vocabulary', value: roundedVocabulary, fill: '#f59e42' }, // amber-500
    { name: 'Grammar', value: roundedGrammar, fill: '#10b981' } // green-500
  ];
  // Overall summary bar (for big central animation)
  const summaryData = [
    { name: 'Overall', value: averageScore, fill: getScoreColor(averageScore) }
  ];

  // For accessibility/legend display
  const legendData = useMemo(() => [
    { value: 'Fluency', type: 'square', color: '#3b82f6' },
    { value: 'Vocabulary', type: 'square', color: '#f59e42' },
    { value: 'Grammar', type: 'square', color: '#10b981' }
  ], []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Animated Overall Radial Bar */}
          <div className="relative flex flex-col items-center">
            <ResponsiveContainer width={180} height={180}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                barSize={18}
                data={summaryData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={14}
                  isAnimationActive={true}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className={`text-4xl font-bold`}
                style={{ color: getScoreColor(averageScore) }}
              >
                {averageScore}%
              </span>
              <span className="text-sm text-muted-foreground">Overall Score</span>
            </div>
          </div>
          {/* Breakdown Radial Bars */}
          <div className="grid grid-cols-3 gap-8 w-full max-w-md">
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <ResponsiveContainer width={50} height={50}>
                  <RadialBarChart
                    innerRadius="75%"
                    outerRadius="100%"
                    barSize={10}
                    data={[data[0]]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <span className="text-lg font-medium">Fluency</span>
              <span className="text-xl font-bold" style={{ color: data[0].fill }}>{roundedFluency}%</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <ResponsiveContainer width={50} height={50}>
                  <RadialBarChart
                    innerRadius="75%"
                    outerRadius="100%"
                    barSize={10}
                    data={[data[1]]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <span className="text-lg font-medium">Vocabulary</span>
              <span className="text-xl font-bold" style={{ color: data[1].fill }}>{roundedVocabulary}%</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2">
                <ResponsiveContainer width={50} height={50}>
                  <RadialBarChart
                    innerRadius="75%"
                    outerRadius="100%"
                    barSize={10}
                    data={[data[2]]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <span className="text-lg font-medium">Grammar</span>
              <span className="text-xl font-bold" style={{ color: data[2].fill }}>{roundedGrammar}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrammarRingGraph;
