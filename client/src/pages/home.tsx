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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sword, Trash2, ChevronRight, Heart, Shield, Users, Skull, Plus, SortAsc, Group, ChevronDown, Settings2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Character, insertCharacterSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [currentTurn, setCurrentTurn] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [sortByInitiative, setSortByInitiative] = useState(true);

  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  // Sort characters based on the current sorting preference
  const sortedCharacters = [...characters].sort((a, b) => {
    if (sortByInitiative) {
      return b.initiative - a.initiative;
    }
    // When not sorting by initiative, group by PC/NPC first
    if (a.isNpc !== b.isNpc) {
      return a.isNpc ? 1 : -1;
    }
    // Within each group, sort by initiative
    return b.initiative - a.initiative;
  });

  const currentCharacter = sortedCharacters[currentTurn];

  const form = useForm({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: "",
      initiative: undefined,
      currentHp: undefined,
      maxHp: undefined,
      isNpc: false,
    },
  });

  const addCharacter = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/characters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      form.reset();
      setAddDialogOpen(false);
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

  const updateInitiative = useMutation({
    mutationFn: ({ id, initiative }: { id: number; initiative: number }) =>
      apiRequest("PATCH", `/api/characters/${id}/initiative`, { initiative }),
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

  const nextTurn = () => {
    setCurrentTurn((prev) => (prev + 1) % sortedCharacters.length);
  };


  return (
    <div className="container mx-auto px-2 py-4 max-w-2xl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary flex items-center gap-2">
          <Sword className="h-6 w-6 sm:h-8 sm:w-8" />
          Combat Tracker
        </h1>

        <div className="flex gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add to Combat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Character</DialogTitle>
                <DialogDescription>
                  Add a new character to the combat tracker
                </DialogDescription>
              </DialogHeader>
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
                  <FormField
                    control={form.control}
                    name="isNpc"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>NPC</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
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
            </DialogContent>
          </Dialog>

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
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Initiative Order</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex items-center gap-1">
                  {sortByInitiative ? (
                    <Group className="h-4 w-4" />
                  ) : (
                    <SortAsc className="h-4 w-4" />
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSortByInitiative(false)}>
                  <SortAsc className="h-4 w-4 mr-2" />
                  Initiative Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortByInitiative(true)}>
                  <Group className="h-4 w-4 mr-2" />
                  Group by Type
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            <div className="space-y-6">
              {!sortByInitiative ? (
                // Show all characters in pure initiative order
                <div className="space-y-2">
                  {sortedCharacters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      isCurrentTurn={currentCharacter?.id === char.id}
                      onUpdateHp={updateHp.mutate}
                      onUpdateInitiative={updateInitiative.mutate}
                      onRemove={removeCharacter.mutate}
                    />
                  ))}
                </div>
              ) : (
                // Group by PC/NPC with headers
                <>
                  {/* Player Characters Section */}
                  {sortedCharacters.some(char => !char.isNpc) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Player Characters
                      </div>
                      <div className="space-y-2">
                        {sortedCharacters
                          .filter(char => !char.isNpc)
                          .map((char) => (
                            <CharacterCard
                              key={char.id}
                              character={char}
                              isCurrentTurn={currentCharacter?.id === char.id}
                              onUpdateHp={updateHp.mutate}
                              onUpdateInitiative={updateInitiative.mutate}
                              onRemove={removeCharacter.mutate}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Non-Player Characters Section */}
                  {sortedCharacters.some(char => char.isNpc) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                        <Skull className="h-4 w-4" />
                        Non-Player Characters
                      </div>
                      <div className="space-y-2">
                        {sortedCharacters
                          .filter(char => char.isNpc)
                          .map((char) => (
                            <CharacterCard
                              key={char.id}
                              character={char}
                              isCurrentTurn={currentCharacter?.id === char.id}
                              onUpdateHp={updateHp.mutate}
                              onUpdateInitiative={updateInitiative.mutate}
                              onRemove={removeCharacter.mutate}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CharacterCard({
  character,
  isCurrentTurn,
  onUpdateHp,
  onUpdateInitiative,
  onRemove,
}: {
  character: Character;
  isCurrentTurn: boolean;
  onUpdateHp: (data: { id: number; hp: number }) => void;
  onUpdateInitiative: (data: { id: number; initiative: number }) => void;
  onRemove: (id: number) => void;
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [maxHp, setMaxHp] = useState(character.maxHp);

  const handleMaxHpChange = (value: number | undefined) => {
    // Update local state
    setMaxHp(value || null);
    // Update HP in parent component
    if (character.currentHp > (value || 0)) {
      onUpdateHp({ id: character.id, hp: value || 0 });
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border group ${
        isCurrentTurn
          ? "bg-primary/5 border-primary"
          : "bg-card"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <span className="font-bold">{character.name}</span>
          <Input
            type="number"
            value={character.initiative}
            className="w-20"
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                onUpdateInitiative({ id: character.id, initiative: value });
              }
            }}
          />
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <Input
              type="number"
              value={character.currentHp}
              className="w-20"
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0) {
                  onUpdateHp({ id: character.id, hp: value });
                }
              }}
            />
            {maxHp && (
              <span className="text-sm text-muted-foreground">
                /{maxHp}
              </span>
            )}
          </div>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {character.name}</DialogTitle>
              <DialogDescription>
                Adjust maximum HP or remove this character from combat.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Maximum HP
                </label>
                <Input
                  type="number"
                  placeholder="Maximum hit points"
                  value={maxHp || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    handleMaxHpChange(value);
                  }}
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove from Combat
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {character.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove {character.name} from combat. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      onRemove(character.id);
                      setEditDialogOpen(false);
                    }}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}