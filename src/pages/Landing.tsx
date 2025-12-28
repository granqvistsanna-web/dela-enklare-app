import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, Calculator, Receipt, Share2, Sparkles, Shield } from "lucide-react";
import logo from "@/assets/logo.png";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Dela med vänner",
      description: "Skapa grupper och bjud in dina vänner, familj eller kollegor för att dela utgifter tillsammans."
    },
    {
      icon: Calculator,
      title: "Automatiska beräkningar",
      description: "Slipp huvudvärken. Vi beräknar automatiskt vem som är skyldig vem och hur mycket."
    },
    {
      icon: Receipt,
      title: "Håll koll på allt",
      description: "Transparent historik över alla utgifter och avräkningar. Alltid uppdaterat i realtid."
    },
    {
      icon: Share2,
      title: "Enkel delning",
      description: "Dela utgifter lika eller anpassat. Perfekt för resor, fester och vardagliga utgifter."
    },
    {
      icon: Sparkles,
      title: "Ren design",
      description: "Modern och intuitiv design som gör det enkelt att hålla koll på ekonomin."
    },
    {
      icon: Shield,
      title: "Säker & privat",
      description: "Dina data är säkra och skyddade. Vi tar din integritet på allvar."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Päronsplit" className="h-10" />
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="font-medium"
          >
            Logga in
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container max-w-4xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="text-center space-y-6">
          <div className="inline-block">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-sm text-muted-foreground mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Dela utgifter enkelt</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground tracking-tight leading-[1.1]">
            Dela utgifter.<br />
            Utan krångel.
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Päronsplit gör det enkelt att dela utgifter med vänner, familj och kollegor.
            Transparent, snabbt och alltid rättvist.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-foreground text-background hover:bg-foreground/90 text-base font-medium px-8 h-12"
            >
              Kom igång gratis
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-base font-medium px-8 h-12"
            >
              Läs mer
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-2">
            <div className="text-4xl font-semibold text-foreground">100%</div>
            <div className="text-muted-foreground">Gratis att använda</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-semibold text-foreground">Realtid</div>
            <div className="text-muted-foreground">Synkronisering</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl font-semibold text-foreground">∞</div>
            <div className="text-muted-foreground">Obegränsat antal grupper</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            Allt du behöver
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kraftfulla funktioner i en enkel förpackning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border/50 bg-background hover:bg-secondary/30 transition-all duration-200 hover:shadow-md"
              >
                <div className="mb-4 inline-flex p-2.5 rounded-lg bg-secondary/50 text-foreground">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="container max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            Så fungerar det
          </h2>
        </div>

        <div className="space-y-12">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-lg">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Skapa en grupp</h3>
              <p className="text-muted-foreground leading-relaxed">
                Starta en ny grupp för din resa, fest eller vardagliga utgifter. Ge den ett namn och bjud in dina vänner.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-lg">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Lägg till utgifter</h3>
              <p className="text-muted-foreground leading-relaxed">
                Logga utgifter när de dyker upp. Välj vem som betalade och hur kostnad ska delas mellan gruppmedlemmarna.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-lg">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Reglera balansen</h3>
              <p className="text-muted-foreground leading-relaxed">
                Se direkt vem som är skyldig vem. Markera betalningar som avklarade när skulder regleras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container max-w-4xl mx-auto px-6 py-24">
        <div className="text-center bg-secondary/30 rounded-2xl p-12 md:p-16 border border-border/50">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            Redo att börja?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Skapa ditt konto och börja dela utgifter med dina vänner idag. Helt gratis.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-foreground text-background hover:bg-foreground/90 text-base font-medium px-8 h-12"
          >
            Kom igång nu
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-24">
        <div className="container max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground text-sm">
              © 2025 Päronsplit. Dela utgifter enkelt.
            </div>
            <div className="text-sm text-muted-foreground">
              Gjort med ❤️ i Sverige
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
