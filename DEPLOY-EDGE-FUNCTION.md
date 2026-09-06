# Déployer la fonction "delete-user" (suppression réelle de compte)

Ceci est différent des étapes précédentes — on ne peut pas juste coller du SQL
dans le dashboard. Il faut utiliser un outil en ligne de commande une seule fois.

## 1. Installer le CLI Supabase

Dans un terminal (celui où vous lancez `npm run dev`) :

```
npm install -g supabase
```

## 2. Se connecter

```
supabase login
```

Ça ouvre votre navigateur pour vous connecter à votre compte Supabase.

## 3. Lier ce projet à votre projet Supabase

Dans le dossier `teknikschool` (là où se trouve package.json) :

```
supabase link --project-ref rcxetjhiseuqqhkiaqvd
```

(C'est l'identifiant qu'on voit dans votre URL Supabase : `rcxetjhiseuqqhkiaqvd.supabase.co`)

## 4. Déployer la fonction

```
supabase functions deploy delete-user
```

Ça prend le fichier `supabase/functions/delete-user/index.ts` (déjà inclus dans
ce zip) et le publie sur Supabase.

## 5. Vérifier que ça marche

Dans le dashboard Supabase → **Edge Functions** (menu de gauche), vous devriez
voir "delete-user" listée comme déployée.

Ensuite dans l'app : Admin → Utilisateurs → cliquer "Retirer" sur un compte
élève ou professeur → confirmer → le compte est supprimé pour de vrai
(profil ET connexion), pas seulement caché.

## Si une étape échoue
Copiez-collez le message d'erreur exact et on le règle ensemble — les clés
API et permissions server-side sont plus délicates que le reste de l'app.
