import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const { profile, signOut, updatePassword } = useAuth();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

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
        await supabase.from("profiles").delete().eq("user_id", profile.user_id);
      }
      
      await signOut();
      toast.success("Konto raderat");
      navigate("/auth");
    } catch (error) {
      toast.error("Kunde inte radera kontot");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleInvitePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Ange en giltig e-postadress");
      return;
    }
    
    setIsInviting(true);
    
    try {
      const { error } = await supabase.from("invitations").insert({
        inviter_id: profile?.user_id,
        email: inviteEmail,
        group_id: "hushalll",
        status: "pending"
      });
      
      if (error) {
        toast.error("Kunde inte skicka inbjudan");
      } else {
        toast.success(`Inbjudan skickad`);
        setInviteEmail("");
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        <div className="mb-10">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Tillbaka
          </Link>
          <h1 className="text-2xl font-semibold text-foreground mt-4">Inställningar</h1>
        </div>

        <div className="space-y-10">
          {/* Profile */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Profil</h2>
            {profile && (
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
                  {profile.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            )}
          </section>

          <hr className="border-border" />

          {/* Invite Partner */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Bjud in</h2>
            <form onSubmit={handleInvitePartner} className="flex gap-3 max-w-md">
              <Input
                type="email"
                placeholder="partner@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline" disabled={isInviting}>
                {isInviting ? "Skickar..." : "Bjud in"}
              </Button>
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
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
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
              <Button type="submit" variant="outline" disabled={isChangingPassword}>
                {isChangingPassword ? "Sparar..." : "Uppdatera"}
              </Button>
            </form>
          </section>

          <hr className="border-border" />

          {/* Sign Out & Delete */}
          <section className="space-y-4">
            <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground">
              Logga ut
            </Button>

            <div className="pt-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
              Delarätt · v1.0
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
