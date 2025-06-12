
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useAuth, MOCK_CLASSES, MOCK_SECTIONS } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TeacherRegister = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const handleClassChange = (className: string, checked: boolean) => {
    if (checked) {
      setSelectedClasses([...selectedClasses, className]);
    } else {
      setSelectedClasses(selectedClasses.filter(c => c !== className));
    }
  };

  const handleSectionChange = (section: string, checked: boolean) => {
    if (checked) {
      setSelectedSections([...selectedSections, section]);
    } else {
      setSelectedSections(selectedSections.filter(s => s !== section));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedClasses.length === 0 || selectedSections.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one class and one section.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await register({
        fullName,
        email,
        password,
        role: 'teacher',
        classes: selectedClasses,
        sections: selectedSections
      });

      if (success) {
        toast({
          title: "Account Created Successfully!",
          description: "Please log in to access your teacher dashboard.",
        });
        setTimeout(() => navigate('/teacher/login'), 1500);
      } else {
        toast({
          title: "Registration Failed",
          description: "Email already exists. Please try a different email.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 p-4">
      {/* Navigation back */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/teacher/login')}
          className="rounded-full hover:bg-primary/10 hover:scale-110 transition-all duration-300"
        >
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Button>
      </div>

      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <GraduationCap className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-playfair font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Echo.ai
          </h1>
        </div>
        <p className="text-muted-foreground mt-2">Create Your Teacher Account</p>
      </div>

      <Card className="w-full max-w-lg animate-fade-in shadow-xl border-primary/20 hover:border-primary/50 transition-all duration-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Teacher Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-primary">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-primary/20 focus:border-primary"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-primary">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-primary/20 focus:border-primary"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-primary/20 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-primary font-semibold">Classes (Select multiple)</Label>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_CLASSES.map((className) => (
                  <div key={className} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${className}`}
                      checked={selectedClasses.includes(className)}
                      onCheckedChange={(checked) => handleClassChange(className, checked as boolean)}
                    />
                    <Label htmlFor={`class-${className}`} className="text-sm">
                      {className}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-primary font-semibold">Sections (Select multiple)</Label>
              <div className="grid grid-cols-4 gap-2">
                {MOCK_SECTIONS.map((section) => (
                  <div key={section} className="flex items-center space-x-2">
                    <Checkbox
                      id={`section-${section}`}
                      checked={selectedSections.includes(section)}
                      onCheckedChange={(checked) => handleSectionChange(section, checked as boolean)}
                    />
                    <Label htmlFor={`section-${section}`} className="text-sm">
                      {section}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark hover:scale-105 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Teacher Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center w-full">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              to="/teacher/login"
              className="text-accent hover:text-accent-dark hover:underline transition-colors"
            >
              Log in
            </Link>
          </div>
          <div className="text-center w-full">
            <span className="text-muted-foreground">Are you a student? </span>
            <Link
              to="/register"
              className="text-primary hover:text-primary-dark hover:underline transition-colors"
            >
              Register as Student
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TeacherRegister;
