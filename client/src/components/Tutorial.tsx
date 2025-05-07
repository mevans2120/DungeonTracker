import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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

// Create a lightweight global tutorial state manager
// This approach avoids issues with React's component lifecycle, hooks dependency arrays,
// and multiple re-renders by keeping the tutorial state outside of React's state management
const TutorialManager = {
  // State variables
  _isOpen: false,
  _currentStep: 0,
  _hasSeenTutorial: false,
  _subscribers: [] as Function[],
  
  // Initialize
  init() {
    this._hasSeenTutorial = localStorage.getItem("hasSeenTutorial") === "true";
    this._isOpen = !this._hasSeenTutorial;
    this._currentStep = 0;
  },
  
  // Check if tutorial should be shown
  shouldShowTutorial() {
    return this._isOpen;
  },
  
  // Get current step
  getCurrentStep() {
    return this._currentStep;
  },
  
  // Move to next step
  nextStep() {
    if (this._currentStep < DEFAULT_TUTORIAL_STEPS.length - 1) {
      this._currentStep++;
      this._notifySubscribers();
    } else {
      this.finishTutorial();
    }
  },
  
  // Move to previous step
  previousStep() {
    if (this._currentStep > 0) {
      this._currentStep--;
      this._notifySubscribers();
    }
  },
  
  // Open tutorial
  openTutorial() {
    this._isOpen = true;
    this._currentStep = 0;
    this._notifySubscribers();
  },
  
  // Close tutorial without marking as seen
  closeTutorial() {
    this._isOpen = false;
    this._notifySubscribers();
  },
  
  // Finish tutorial (close and mark as seen)
  finishTutorial() {
    localStorage.setItem("hasSeenTutorial", "true");
    this._hasSeenTutorial = true;
    this._isOpen = false;
    this._notifySubscribers();
  },
  
  // Clear storage for testing
  clearStorage() {
    localStorage.removeItem("hasSeenTutorial");
    this._hasSeenTutorial = false;
    this._isOpen = true;
    this._currentStep = 0;
    this._notifySubscribers();
  },
  
  // Subscribe to changes
  subscribe(callback: Function) {
    this._subscribers.push(callback);
    return () => {
      this._subscribers = this._subscribers.filter(cb => cb !== callback);
    };
  },
  
  // Notify all subscribers
  _notifySubscribers() {
    this._subscribers.forEach(callback => callback());
  }
};

// Initialize the tutorial manager
TutorialManager.init();

export function Tutorial() {
  // Use state to trigger re-renders when the tutorial state changes
  const [, setRenderKey] = useState(0);
  
  // Get tutorial data from API
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
  
  // Subscribe to tutorial state changes
  useState(() => {
    const unsubscribe = TutorialManager.subscribe(() => {
      setRenderKey(prev => prev + 1);
    });
    
    // Clean up subscription on unmount
    return unsubscribe;
  });
  
  if (isLoading) {
    return null;
  }
  
  // Get current tutorial state
  const isOpen = TutorialManager.shouldShowTutorial();
  const currentStep = TutorialManager.getCurrentStep();
  const isLastStep = currentStep === tutorialSteps.length - 1;
  
  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => TutorialManager.openTutorial()}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            TutorialManager.clearStorage();
            window.location.reload();
          }}
        >
          Clear Storage & Reload
        </Button>
      </div>
      
      {/* Render the dialog */}
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) TutorialManager.closeTutorial();
        }}
      >
        <DialogContent className="max-w-lg sm:pt-8 sm:px-8 sm:pb-6 border-0 sm:border-0 w-[500px] h-auto">
          {/* Hidden accessibility elements */}
          <DialogTitle className="sr-only">
            Tutorial Guide
          </DialogTitle>
          <DialogDescription className="sr-only">
            Step-by-step guide to using the Combat Tracker
          </DialogDescription>
          
          <Card className="p-6">
            <CardHeader>
              <CardTitle>{tutorialSteps[currentStep].title}</CardTitle>
              <CardDescription>
                {tutorialSteps[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px] max-h-[300px] overflow-y-auto">
              {tutorialSteps[currentStep].content}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => TutorialManager.previousStep()}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              {isLastStep ? (
                <Button onClick={() => TutorialManager.finishTutorial()}>
                  Done
                </Button>
              ) : (
                <Button onClick={() => TutorialManager.nextStep()}>Next</Button>
              )}
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}