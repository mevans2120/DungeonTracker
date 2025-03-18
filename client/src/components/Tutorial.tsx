import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Pencil } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Default tutorial steps that will be used if no content is stored
const DEFAULT_TUTORIAL_STEPS = [
  {
    stepId: 0,
    id:0, // Added id field for consistency.  This assumes the backend now provides an id.
    title: "Welcome to DungeonTracker!",
    description: "This quick tutorial will show you how to manage combat in your D&D game.",
    content: (
      <div className="space-y-4">
        <p>DungeonTracker helps you:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Track initiative order</li>
          <li>Manage character HP</li>
          <li>Keep combat flowing smoothly</li>
        </ul>
        <p>No account or setup required - just add your characters and start playing!</p>
      </div>
    )
  },
  {
    stepId: 1,
    id:1, // Added id field for consistency.  This assumes the backend now provides an id.
    title: "Adding Characters",
    description: "Start by adding your players and monsters to the combat.",
    content: (
      <div className="space-y-4">
        <p>Click the "Add to Combat" button to open the character form.</p>
        <p>For each character, enter:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li><strong>Name:</strong> Character's name</li>
          <li><strong>Initiative:</strong> Their initiative roll (1-30)</li>
          <li><strong>Current HP:</strong> Starting hit points</li>
          <li><strong>Max HP:</strong> Optional maximum HP</li>
          <li><strong>NPC:</strong> Toggle for non-player characters</li>
        </ul>
      </div>
    )
  },
  {
    stepId: 2,
    id:2, // Added id field for consistency.  This assumes the backend now provides an id.
    title: "Initiative Order",
    description: "Characters are automatically sorted by initiative.",
    content: (
      <div className="space-y-4">
        <p>The initiative list shows all characters in order:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Highest initiative goes first</li>
          <li>PCs and NPCs are grouped separately</li>
          <li>The current turn is highlighted</li>
          <li>Use "Next Turn" to advance combat</li>
        </ul>
      </div>
    )
  },
  {
    stepId: 3,
    id:3, // Added id field for consistency.  This assumes the backend now provides an id.
    title: "Managing HP",
    description: "Keep track of damage and healing.",
    content: (
      <div className="space-y-4">
        <p>For each character, you can:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Type in the HP value directly</li>
          <li>See current HP and max HP (if set)</li>
          <li>Remove characters when they leave combat</li>
        </ul>
      </div>
    )
  },
  {
    stepId: 4,
    id:4, // Added id field for consistency.  This assumes the backend now provides an id.
    title: "Ready to Play!",
    description: "You're all set to start tracking combat.",
    content: (
      <div className="space-y-4">
        <p>Quick tips:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Use "Reset Combat" to clear all characters</li>
          <li>Update initiative values anytime</li>
          <li>Remove individual characters as needed</li>
          <li>Click the help icon to reopen this tutorial</li>
        </ul>
      </div>
    )
  }
];

export function Tutorial() {
  const { toast } = useToast();
  const [open, setOpen] = useState(() => {
    return !localStorage.getItem("hasSeenTutorial");
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [editingStep, setEditingStep] = useState<typeof DEFAULT_TUTORIAL_STEPS[0] | null>(null);

  const { data: tutorialSteps = DEFAULT_TUTORIAL_STEPS, isLoading } = useQuery({
    queryKey: ["/api/tutorial"],
    queryFn: async () => {
      const response = await fetch("/api/tutorial");
      if (!response.ok) {
        return DEFAULT_TUTORIAL_STEPS;
      }
      const data = await response.json();
      return data.length > 0 ? data : DEFAULT_TUTORIAL_STEPS;
    }
  });

  const updateTutorial = useMutation({
    mutationFn: async (data: { id: number; title: string; description: string }) => {
      return apiRequest("PATCH", `/api/tutorial/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorial"] });
      toast({
        title: "Tutorial updated",
        description: "The tutorial content has been updated successfully.",
      });
      setEditingStep(null);
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

  const handleEdit = (step: typeof DEFAULT_TUTORIAL_STEPS[0]) => {
    setEditingStep(step);
  };

  const handleSave = () => {
    if (!editingStep) return;

    updateTutorial.mutate({
      id: editingStep.id, // Use the database ID
      title: editingStep.title,
      description: editingStep.description,
    }, {
      onError: (error) => {
        toast({
          title: "Error updating tutorial",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        });
      }
    });
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
            className="fixed bottom-4 right-4 rounded-full"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{tutorialSteps[currentStep].title}</CardTitle>
                <CardDescription>
                  {tutorialSteps[currentStep].description}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(tutorialSteps[currentStep])}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {tutorialSteps[currentStep].content}
            </CardContent>
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

      {/* Edit Dialog */}
      <Dialog open={editingStep !== null} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tutorial Step</DialogTitle>
            <DialogDescription>
              Edit the title and description for this tutorial step.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editingStep?.title || ""}
                onChange={(e) =>
                  setEditingStep(prev =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editingStep?.description || ""}
                onChange={(e) =>
                  setEditingStep(prev =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={updateTutorial.isPending}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}