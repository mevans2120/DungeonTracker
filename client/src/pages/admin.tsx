import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, AlertTriangle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const seedDatabase = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed database");
      }

      toast({
        title: "Database seeded successfully!",
        description: `Added ${data.stats.total} characters (${data.stats.heroes} heroes, ${data.stats.npcs} NPCs)`,
      });

      // Refresh the characters list
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    } catch (error: any) {
      toast({
        title: "Failed to seed database",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Management
          </CardTitle>
          <CardDescription>
            Admin tools for managing the DungeonTracker database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-semibold">Seed Database with Test Data</h3>
                <p className="text-sm text-muted-foreground">
                  This will <strong>delete all existing characters</strong> and populate the database
                  with 15 D&D-themed test characters including heroes, monsters, and NPCs.
                </p>
              </div>
            </div>
            
            <Button 
              onClick={seedDatabase} 
              disabled={isSeeding}
              variant="destructive"
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Database (Deletes All Current Data)
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>The test data includes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>5 Player Characters (various classes)</li>
              <li>8 Monsters (goblins, dragon, owlbear, etc.)</li>
              <li>2 Friendly NPCs (town guard, mysterious figure)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}