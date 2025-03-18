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
    title: "Welcome to DungeonTracker!",
    description: "This quick tutorial will show you how to manage combat in your D&D game.",
    content: {
      type: "basic",
      text: "DungeonTracker helps you:\n- Track initiative order\n- Manage character HP\n- Keep combat flowing smoothly\n\nNo account or setup required - just add your characters and start playing!"
    }
  },
  {
    stepId: 1,
    title: "Adding Characters",
    description: "Start by adding your players and monsters to the combat.",
    content: {
      type: "basic",
      text: "Click the 'Add to Combat' button to open the character form.\n\nFor each character, enter:\n- Name: Character's name\n- Initiative: Their initiative roll (1-30)\n- Current HP: Starting hit points\n- Max HP: Optional maximum HP\n- NPC: Toggle for non-player characters"
    }
  },
  {
    stepId: 2,
    title: "Initiative Order",
    description: "Characters are automatically sorted by initiative.",
    content: {
      type: "basic",
      text: "The initiative list shows all characters in order:\n- Highest initiative goes first\n- PCs and NPCs are grouped separately\n- The current turn is highlighted\n- Use 'Next Turn' to advance combat"
    }
  }
];

export function Tutorial() {
  const { toast } = useToast();
  const [open, setOpen] = useState(() => {
    return !localStorage.getItem("hasSeenTutorial");
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [editingStep, setEditingStep] = useState<null | {
    id: number;
    stepId: number;
    title: string;
    description: string;
    content: any;
  }>(null);

  const { data: tutorialSteps = DEFAULT_TUTORIAL_STEPS, isLoading } = useQuery({
    queryKey: ["/api/tutorial"],
    queryFn: async () => {
      const response = await fetch("/api/tutorial");
      if (!response.ok) {
        // Initialize if no content exists
        const initResponse = await fetch("/api/tutorial/init", { method: "POST" });
        if (initResponse.ok) {
          const retryResponse = await fetch("/api/tutorial");
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
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
    onError: (error) => {
      toast({
        title: "Error updating tutorial",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleEdit = (step: typeof tutorialSteps[0]) => {
    setEditingStep(step);
  };

  const handleSave = () => {
    if (!editingStep) return;

    updateTutorial.mutate({
      id: editingStep.id,
      title: editingStep.title,
      description: editingStep.description,
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
              {typeof tutorialSteps[currentStep].content === 'string' 
                ? tutorialSteps[currentStep].content
                : tutorialSteps[currentStep].content.text}
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