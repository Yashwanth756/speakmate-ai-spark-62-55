
import React from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DailyChallenge: React.FC = () => {
  const navigate = useNavigate();

  const handleCompleteChallenge = () => {
    navigate("/grammar");
  };

  return (
    <Card className="mb-4 bg-gradient-to-br from-primary/20 to-accent/20">
      <CardHeader>
        <div className="flex items-center">
          <Award className="mr-2 text-primary" />
          <h3 className="font-semibold">Daily Challenge</h3>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="font-medium mb-2">Today's Challenge:</h4>
        <p className="mb-4">
          Use the word "ephemeral" in three different sentences today.
        </p>
        <div className="bg-white p-3 rounded-md shadow-sm">
          <p className="text-sm italic">
            "Write a short story (2-3 sentences) that includes at least 3 new words
            you've learned this week."
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline" onClick={handleCompleteChallenge}>
          Complete Challenge
        </Button>
      </CardFooter>
    </Card>
  );
};

