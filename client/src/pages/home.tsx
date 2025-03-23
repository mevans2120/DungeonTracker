import { useState, useEffect } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trash2,
  ChevronRight,
  Heart,
  Shield,
  Users,
  Skull,
  Plus,
  SortAsc,
  Group,
  ChevronDown,
  Settings2,
  HelpCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Character, insertCharacterSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { D20Icon } from "@/components/icons/D20Icon";
import { CrossedSwordsIcon } from "@/components/icons/CrossedSwordsIcon";



export default function Home() {
  const { toast } = useToast();
  const [currentTurn, setCurrentTurn] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
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
    mutationFn: (data: any) => apiRequest("POST", "/api/characters", data),
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
    mutationFn: (id: number) => apiRequest("DELETE", `/api/characters/${id}`),
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

  const editForm = useForm({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: "",
      initiative: undefined,
      currentHp: undefined,
      maxHp: undefined,
      isNpc: false,
    },
  });

  // Add the editCharacter mutation
  const editCharacter = useMutation({
    mutationFn: (data: any & { id: number }) =>
      apiRequest("PATCH", `/api/characters/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      editForm.reset();
      setEditDialogOpen(false);
      setEditingCharacter(null);
      toast({
        title: "Character updated",
        description: "The character has been updated successfully",
      });
    },
  });

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    editForm.reset({
      name: character.name,
      initiative: character.initiative,
      currentHp: character.currentHp,
      maxHp: character.maxHp,
      isNpc: character.isNpc,
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = (data: any) => {
    if (!editingCharacter) return;
    editCharacter.mutate({ ...data, id: editingCharacter.id });
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sortedCharacters.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "Tab") {
        e.preventDefault();
        setCurrentTurn((prev) => (prev + 1) % sortedCharacters.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentTurn((prev) =>
          prev === 0 ? sortedCharacters.length - 1 : prev - 1,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sortedCharacters.length]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
      <div className="mb-8 flex items-end justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-3">
          <CrossedSwordsIcon className="h-8 w-8" />
          <h1 className="text-4xl font-bold">Combat Tracker</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground mb-8">
        A place to keep order and dole damage
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Players & NPCs</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex items-center gap-1"
                >
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

          <div className="flex items-center gap-4">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-black text-white">
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
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
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
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
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
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
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
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
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

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Character</DialogTitle>
                  <DialogDescription>
                    Edit the character's details
                  </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form
                    onSubmit={editForm.handleSubmit(onEditSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={editForm.control}
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
                      control={editForm.control}
                      name="initiative"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initiative</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Initiative roll"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="currentHp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current HP</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Current hit points"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
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
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
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
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={editCharacter.isPending}
                      >
                        Save Changes
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            className="w-full"
                          >
                            Delete Character
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Character?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the character from combat. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => {
                                if (editingCharacter) {
                                  removeCharacter.mutate(editingCharacter.id);
                                  setEditDialogOpen(false);
                                }
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Combat?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all characters from combat. This action
                    cannot be undone.
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
                      onSelect={() =>
                        setCurrentTurn(sortedCharacters.indexOf(char))
                      }
                      onEdit={handleEditCharacter}
                    />
                  ))}
                </div>
              ) : (
                // Group by PC/NPC with headers
                <>
                  {/* Player Characters Section */}
                  {sortedCharacters.some((char) => !char.isNpc) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Player Characters
                      </div>
                      <div className="space-y-2">
                        {sortedCharacters
                          .filter((char) => !char.isNpc)
                          .map((char) => (
                            <CharacterCard
                              key={char.id}
                              character={char}
                              isCurrentTurn={currentCharacter?.id === char.id}
                              onUpdateHp={updateHp.mutate}
                              onUpdateInitiative={updateInitiative.mutate}
                              onRemove={removeCharacter.mutate}
                              onSelect={() =>
                                setCurrentTurn(sortedCharacters.indexOf(char))
                              }
                              onEdit={handleEditCharacter}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Non-Player Characters Section */}
                  {sortedCharacters.some((char) => char.isNpc) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                        <Skull className="h-4 w-4" />
                        Non-Player Characters
                      </div>
                      <div className="space-y-2">
                        {sortedCharacters
                          .filter((char) => char.isNpc)
                          .map((char) => (
                            <CharacterCard
                              key={char.id}
                              character={char}
                              isCurrentTurn={currentCharacter?.id === char.id}
                              onUpdateHp={updateHp.mutate}
                              onUpdateInitiative={updateInitiative.mutate}
                              onRemove={removeCharacter.mutate}
                              onSelect={() =>
                                setCurrentTurn(sortedCharacters.indexOf(char))
                              }
                              onEdit={handleEditCharacter}
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

      {/* Add the sticky bottom navigation */}
      {sortedCharacters.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="container mx-auto max-w-4xl flex justify-between gap-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() =>
                setCurrentTurn(
                  currentTurn === 0
                    ? sortedCharacters.length - 1
                    : currentTurn - 1,
                )
              }
            >
              <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
              Previous Turn
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() =>
                setCurrentTurn((currentTurn + 1) % sortedCharacters.length)
              }
            >
              Next Turn
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CharacterCard({
  character,
  isCurrentTurn,
  onUpdateHp,
  onUpdateInitiative,
  onRemove,
  onSelect,
  onEdit,
}: {
  character: Character;
  isCurrentTurn: boolean;
  onUpdateHp: (data: { id: number; hp: number }) => void;
  onUpdateInitiative: (data: { id: number; initiative: number }) => void;
  onRemove: (id: number) => void;
  onSelect: () => void;
  onEdit: (character: Character) => void;
}) {
  return (
    <div
      className={`p-4 rounded-lg border group transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-[2px] ${
        isCurrentTurn
          ? "bg-primary/5 border-primary"
          : "bg-card hover:bg-card/80"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-3 h-3 rounded-full transition-colors duration-200 ${
            isCurrentTurn ? "bg-[#4ADE80]" : "bg-muted"
          }`}
          aria-label={
            isCurrentTurn ? `Current turn: ${character.name}` : undefined
          }
        />
        <div className="flex-1 grid grid-cols-[1fr,auto,auto] items-center gap-6">
          <span className="text-lg font-bold">{character.name}</span>
          <div className="flex items-center gap-2">
            <D20Icon className="h-5 w-5 text-muted-foreground" />
            <Input
              type="number"
              value={character.initiative}
              className="w-16"
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  onUpdateInitiative({ id: character.id, initiative: value });
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <Input
              type="number"
              value={character.currentHp}
              className="w-16"
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0) {
                  onUpdateHp({ id: character.id, hp: value });
                }
              }}
            />
            {character.maxHp && (
              <span className="text-sm text-muted-foreground">
                / {character.maxHp}
              </span>
            )}
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(character)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}