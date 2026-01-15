# Supabase Database Setup

Detta dokument förklarar hur databasen är uppsatt och vad du behöver veta om profilhantering.

## Projektinformation

- **Projekt ID**: `qswvgfslsginwpqkbbki`
- **Projektnamn**: Paronsplit (current)
- **URL**: `https://qswvgfslsginwpqkbbki.supabase.co`

## Profiles Tabell

### Schema
Profiles-tabellen använder UUID för både `id` och `user_id`:
- `id` - UUID (Primary Key)
- `user_id` - UUID (References auth.users.id)
- `name` - TEXT
- `email` - TEXT
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

### Automatisk Profilskapande

När en ny användare registrerar sig skapas en profil automatiskt via en trigger (`on_auth_user_created`).

### RLS Policies (Row Level Security)

Profiles-tabellen har följande policies:
- **Users can view own profile** - Användare kan bara se sin egen profil
- **Users can insert own profile** - Användare kan bara skapa sin egen profil
- **Users can update own profile** - Användare kan bara uppdatera sin egen profil

## Felsökning

### "Kunde inte ladda profil" Fel

Om du ser detta fel, kan det bero på:

1. **Ingen profil finns för användaren**
   - För nya användare: Triggersn ska skapa profil automatiskt
   - För befintliga användare: Ett backfill-migration har skapats för att skapa profiler

2. **RLS Policy blockerar åtkomst**
   - Kontrollera att användaren är inloggad
   - Kontrollera att `auth.uid()` matchar `user_id` i profilen

3. **Schema mismatch**
   - Kontrollera att TypeScript-typer är uppdaterade
   - Kontrollera att alla UUID-fält hanteras korrekt som strings i TypeScript

### Verifiera Profiler

Kör följande SQL i Supabase SQL Editor för att kontrollera profiler:

```sql
-- Se alla profiler
SELECT id, user_id, name, email, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Se användare utan profiler
SELECT u.id, u.email 
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL;
```

## Backfill Migration

Om du har befintliga användare utan profiler, kör detta:

```sql
INSERT INTO public.profiles (user_id, email, name)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'name',
    SPLIT_PART(u.email, '@', 1),
    'Användare'
  ) as name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
```

## Migrationer

Alla migrationer finns i `supabase/migrations/`:
- `create_profiles_and_fix_groups_rls` - Skapar profiles-tabellen och fixar groups RLS
- `backfill_profiles_for_existing_users` - Skapar profiler för befintliga användare

## Anslutning

Kontrollera att `.env` innehåller korrekta värden:
```
VITE_SUPABASE_PROJECT_ID="qswvgfslsginwpqkbbki"
VITE_SUPABASE_URL="https://qswvgfslsginwpqkbbki.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_qNBQuKmlL4PNtwTnyn6wDQ__JdeVZGN"
```

## Ytterligare Hjälp

Om problemet kvarstår:
1. Kontrollera browser console för detaljerade felmeddelanden
2. Kontrollera Supabase Dashboard → Logs för server-side fel
3. Verifiera att RLS policies är aktiverade och korrekta
4. Kontrollera att triggersn `on_auth_user_created` finns och är aktiv
