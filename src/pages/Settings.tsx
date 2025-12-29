import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock, Tag, LogOut, Trash2, ChevronLeft, Users, Plus, ExternalLink, Palette, Sun, Moon, Monitor, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { JoinGroupModal } from "@/components/JoinGroupModal";

const Settings = () => {
  const navigate = useNavigate();
  const { profile, signOut, updatePassword, updateProfile } = useAuth();
  const { groups, loading: groupsLoading, createGroup, updateGroup, refetch } = useGroups();
  const { theme, setTheme } = useTheme();

  const [newName, setNewName] = useState("");
  const [isChangingName, setIsChangingName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");

  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newName.trim().length < 2) {
      toast.error("Namn måste vara minst 2 tecken");
      return;
    }

    setIsChangingName(true);

    try {
      const { error } = await updateProfile(newName.trim());
      if (error) {
        toast.error("Kunde inte uppdatera namn");
      } else {
        toast.success("Namn uppdaterat");
        setNewName("");
      }
    } finally {
      setIsChangingName(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Lösenord måste vara minst 6 tecken");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Lösenorden matchar inte");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error("Kunde inte byta lösenord");
      } else {
        toast.success("Lösenord uppdaterat");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    try {
      if (profile) {
        const { error: deleteError } = await supabase
          .from("profiles")
          .delete()
          .eq("user_id", profile.user_id);

        if (deleteError) {
          toast.error("Kunde inte radera kontot");
          setIsDeletingAccount(false);
          return;
        }
      }

      await signOut();
      toast.success("Konto raderat");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Kunde inte radera kontot");
      navigate("/auth");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
      toast.error("Kunde inte logga ut");
      navigate("/auth");
    }
  };

  const handleCreateGroup = async (name: string, isTemporary: boolean, selectedUserIds: string[]) => {
    await createGroup(name, isTemporary, selectedUserIds);
    setIsCreateModalOpen(false);
  };

  const handleEditGroupName = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditingGroupName(currentName);
  };

  const handleSaveGroupName = async (groupId: string) => {
    if (editingGroupName.trim().length < 2) {
      toast.error("Gruppnamn måste vara minst 2 tecken");
      return;
    }

    await updateGroup(groupId, editingGroupName.trim());
    setEditingGroupId(null);
    setEditingGroupName("");
  };

  const handleCancelEditGroupName = () => {
    setEditingGroupId(null);
    setEditingGroupName("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 sm:py-12 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Tillbaka
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mt-4">Inställningar</h1>
        </div>

        <div className="space-y-6">
          {/* Groups Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Grupper</CardTitle>
              </div>
              <CardDescription>Hantera dina grupper och gruppmedlemskap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Group List */}
              {groupsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-secondary/50 animate-pulse" />
                  ))}
                </div>
              ) : groups.length > 0 ? (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        {editingGroupId === group.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              className="max-w-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveGroupName(group.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEditGroupName();
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveGroupName(group.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check size={14} className="text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEditGroupName}
                              className="h-8 w-8 p-0"
                            >
                              <X size={14} className="text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">{group.name}</p>
                            {group.is_temporary && (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
                                Tillfällig
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {group.members.length} {group.members.length === 1 ? "medlem" : "medlemmar"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {editingGroupId !== group.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditGroupName(group.id, group.name)}
                              className="gap-2"
                            >
                              <Edit2 size={14} />
                              <span className="hidden sm:inline">Ändra namn</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/grupp/${group.id}`)}
                              className="gap-2"
                            >
                              <span className="hidden sm:inline">Öppna</span>
                              <ExternalLink size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">Inga grupper ännu</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full sm:w-auto gap-2"
                >
                  <Plus size={14} />
                  Skapa ny grupp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsJoinModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Gå med i grupp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Utseende</CardTitle>
              </div>
              <CardDescription>Anpassa appens utseende och tema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Välj tema</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex-col h-auto py-4 gap-2 transition-all",
                      theme === "light" && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <Sun className="h-5 w-5" />
                    <span className="text-sm font-medium">Ljust</span>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex-col h-auto py-4 gap-2 transition-all",
                      theme === "dark" && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-sm font-medium">Mörkt</span>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex-col h-auto py-4 gap-2 transition-all",
                      theme === "system" && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="text-sm font-medium">System</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Systemläget matchar ditt operativsystems inställningar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Profil</CardTitle>
              </div>
              <CardDescription>Din personliga information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile && (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xl sm:text-2xl font-semibold text-primary">
                    {profile.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-foreground truncate">{profile.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <form onSubmit={handleNameChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newName" className="text-sm font-medium">
                      Ändra namn
                    </Label>
                    <Input
                      id="newName"
                      type="text"
                      placeholder={profile?.name || "Ditt namn"}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Button type="submit" disabled={isChangingName} className="w-full sm:w-auto">
                    {isChangingName ? "Sparar..." : "Uppdatera namn"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Säkerhet</CardTitle>
              </div>
              <CardDescription>Hantera ditt lösenord</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    Nytt lösenord
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Bekräfta lösenord
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Button type="submit" disabled={isChangingPassword} className="w-full sm:w-auto">
                  {isChangingPassword ? "Sparar..." : "Uppdatera lösenord"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Categories Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Kategorier</CardTitle>
              </div>
              <CardDescription>Tillgängliga utgiftskategorier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm"
                  >
                    <span>{category.icon}</span>
                    <span className="text-foreground font-medium">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Konto</CardTitle>
              </div>
              <CardDescription>Logga ut från ditt konto</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Riskzon</CardTitle>
              </div>
              <CardDescription>Permanenta åtgärder som inte kan ångras</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Radera konto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border border-border mx-4 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Radera konto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Detta raderar permanent ditt konto och all data. Denna åtgärd kan inte ångras.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="border-border m-0 w-full sm:w-auto">
                      Avbryt
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 m-0 w-full sm:w-auto"
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? "Raderar..." : "Radera permanent"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* About */}
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Päronsplit · v1.0
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />

      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Settings;
