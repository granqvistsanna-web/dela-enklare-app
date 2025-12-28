import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const Settings = () => {
  const navigate = useNavigate();
  const { profile, signOut, updatePassword, updateProfile } = useAuth();

  const [newName, setNewName] = useState("");
  const [isChangingName, setIsChangingName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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
      // Navigation will be handled automatically by the auth state listener
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Kunde inte radera kontot");
      // Force navigation if there's an error
      navigate("/auth");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled automatically by the auth state listener
      // and the ProtectedRoute/PublicRoute components
    } catch (error) {
      console.error("Error during sign out:", error);
      toast.error("Kunde inte logga ut");
      // Force navigation even if signOut fails
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 sm:py-12 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Tillbaka
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mt-4">Inställningar</h1>
        </div>

        <div className="space-y-8 sm:space-y-10">
          {/* Profile */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Profil</h2>
            {profile && (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                  {profile.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-base font-medium text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            )}
          </section>

          <hr className="border-border" />

          {/* Change Name */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Byt namn</h2>
            <form onSubmit={handleNameChange} className="space-y-4 max-w-full sm:max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="newName" className="text-sm text-muted-foreground">
                  Nytt namn
                </Label>
                <Input
                  id="newName"
                  type="text"
                  placeholder={profile?.name || "Ditt namn"}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" disabled={isChangingName} className="w-full sm:w-auto">
                {isChangingName ? "Sparar..." : "Uppdatera namn"}
              </Button>
              {groups.length === 0 && (
                <p className="text-xs text-muted-foreground">Skapa en grupp först för att kunna bjuda in andra</p>
              )}
            </form>
          </section>

          <hr className="border-border" />

          {/* Categories */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Kategorier</h2>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm"
                >
                  <span>{category.icon}</span>
                  <span className="text-foreground">{category.name}</span>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          {/* Change Password */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Byt lösenord</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-full sm:max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm text-muted-foreground">
                  Nytt lösenord
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">
                  Bekräfta
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" disabled={isChangingPassword} className="w-full sm:w-auto">
                {isChangingPassword ? "Sparar..." : "Uppdatera"}
              </Button>
            </form>
          </section>

          <hr className="border-border" />

          {/* Sign Out & Delete */}
          <section className="space-y-4">
            <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground w-full sm:w-auto justify-start sm:justify-center">
              Logga ut
            </Button>

            <div className="pt-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto justify-start sm:justify-center">
                    Radera konto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Radera konto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Detta raderar permanent ditt konto och all data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border">Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? "Raderar..." : "Radera"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>

          <hr className="border-border" />

          {/* About */}
          <section className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Päronsplit · v1.0
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
