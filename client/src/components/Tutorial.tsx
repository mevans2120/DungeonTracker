import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Default tutorial steps that will be used if no content is stored
const DEFAULT_TUTORIAL_STEPS = [
  {
    stepId: 0,
    title: "Welcome to CombatTracker!",
    description: "This is a tool for MEvans D&D sessions.",
    content: (
      <div className="space-y-4">
        <p>Combat Tracker helps you:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Track initiative order</li>
          <li>Manage character HP</li>
          <li>Keep combat flowing smoothly</li>
        </ul>
        <p>But this is still a prototype, meant for desktop!</p>
      </div>
    ),
  },
  {
    stepId: 1,
    title: "Adding Characters",
    description: "Start by adding your players and monsters to the combat.",
    content: (
      <div className="space-y-4">
        <p>Click the "Add to Combat" button to open the character form.</p>
        <p>For each character, enter:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>
            <strong>Name:</strong> Character's name
          </li>
          <li>
            <strong>Initiative:</strong> Their initiative roll (1-30)
          </li>
          <li>
            <strong>Current HP:</strong> Starting hit points
          </li>
          <li>
            <strong>Max HP:</strong> Optional maximum HP
          </li>
          <li>
            <strong>NPC:</strong> Toggle for non-player characters
          </li>
        </ul>
      </div>
    ),
  },
  {
    stepId: 2,
    title: "Initiative Order",
    description: "Characters are automatically sorted by initiative.",
    content: (
      <div className="space-y-4">
        <p>The initiative list shows all characters in order:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Highest initiative goes first</li>
          <li>PCs and NPCs are grouped separately</li>
          <li>The current turn is highlighted</li>
          <li>Use the up down arrow buttons</li>
        </ul>
      </div>
    ),
  },
  {
    stepId: 3,
    title: "Ready to Play!",
    description: "You're all set to start tracking combat.",
    content: (
      <div className="space-y-4">
        <p>Quick tips:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Sort by order or by NPC / PC</li>
          <li>Remove individual characters as needed</li>
          <li>Click the help icon to reopen this tutorial</li>
        </ul>
      </div>
    ),
  },
];

export function Tutorial() {
  const [open, setOpen] = useState(() => {
    // Only show tutorial on first visit
    return !localStorage.getItem("hasSeenTutorial");
  });
  const [currentStep, setCurrentStep] = useState(0);

  const { data: tutorialSteps = DEFAULT_TUTORIAL_STEPS, isLoading } = useQuery({
    queryKey: ["/api/tutorial"],
    queryFn: async () => {
      const response = await fetch("/api/tutorial");
      if (!response.ok) {
        return DEFAULT_TUTORIAL_STEPS;
      }
      const data = await response.json();
      return data.length > 0 ? data : DEFAULT_TUTORIAL_STEPS;
    },
  });

  const handleFinish = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setOpen(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>{tutorialSteps[currentStep].title}</CardTitle>
              <CardDescription>
                {tutorialSteps[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent>{tutorialSteps[currentStep].content}</CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button onClick={handleNext}>
                {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
              </Button>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}