import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sword, Trash2, ChevronRight, Heart, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Character, insertCharacterSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [currentTurn, setCurrentTurn] = useState(0);

  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const form = useForm({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: "",
      initiative: undefined,
      currentHp: undefined,
      maxHp: undefined,
    },
  });

  const addCharacter = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/characters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      form.reset();
      toast({
        title: "Character added",
        description: "The character has been added to combat",
      });
    },
  });

  const updateHp = useMutation({
    mutationFn: ({ id, hp }: { id: number; hp: number }) =>
      apiRequest("PATCH", `/api/characters/${id}/hp`, { currentHp: hp }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    },
  });

  const removeCharacter = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/characters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "Character removed",
        description: "The character has been removed from combat",
      });
    },
  });

  const resetCombat = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/characters"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setCurrentTurn(0);
      toast({
        title: "Combat reset",
        description: "All characters have been removed",
      });
    },
  });

  const onSubmit = (data: any) => {
    addCharacter.mutate(data);
  };

  const adjustHp = (character: Character, adjustment: number) => {
    const newHp = Math.max(0, character.currentHp + adjustment);
    updateHp.mutate({ id: character.id, hp: newHp });
  };

  const nextTurn = () => {
    setCurrentTurn((prev) => (prev + 1) % characters.length);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
          <Sword className="h-8 w-8" />
          Combat Tracker
        </h1>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Reset Combat</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Combat?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all characters from combat. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetCombat.mutate()}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Character</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Character name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initiative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initiative</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Initiative roll"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentHp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current HP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Current hit points"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxHp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max HP (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Maximum hit points"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addCharacter.isPending}
                >
                  Add to Combat
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Initiative Order</CardTitle>
            <Button onClick={nextTurn} disabled={characters.length === 0}>
              Next Turn
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : characters.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No characters in combat
              </div>
            ) : (
              <div className="space-y-4">
                {characters.map((char, index) => (
                  <div
                    key={char.id}
                    className={`p-4 rounded-lg border ${
                      index === currentTurn
                        ? "bg-primary/5 border-primary"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{char.name}</span>
                        <span className="text-sm text-muted-foreground">
                          Initiative: {char.initiative}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCharacter.mutate(char.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>
                          {char.currentHp}
                          {char.maxHp ? `/${char.maxHp}` : ""}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustHp(char, -1)}
                        >
                          -1
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustHp(char, 1)}
                        >
                          +1
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
