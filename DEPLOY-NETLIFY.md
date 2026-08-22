# Mettre TeknikSchool en ligne sur Netlify

Supabase (base de données, connexion, stockage) est DÉJÀ en ligne — ça n'a
jamais tourné sur votre ordinateur. Seule l'app elle-même (ce qu'on lance avec
`npm run dev`) doit maintenant être hébergée quelque part accessible à tous.

## Étape 1 — Mettre le code sur GitHub

Si ce n'est pas déjà fait :
1. Créez un compte sur https://github.com si vous n'en avez pas
2. Créez un nouveau dépôt (repository), ex. "teknikschool"
3. Dans le dossier `teknikschool` sur votre ordinateur, terminal :
```
git init
git add .
git commit -m "Premier envoi"
git branch -M main
git remote add origin https://github.com/VOTRE-NOM/teknikschool.git
git push -u origin main
```
(Remplacez VOTRE-NOM par votre nom d'utilisateur GitHub)

**Important** : le fichier `.env` ne sera PAS envoyé sur GitHub (c'est voulu,
pour la sécurité — il contient vos clés). On les rentre manuellement dans
Netlify à l'étape 3.

## Étape 2 — Connecter Netlify

1. Allez sur https://netlify.com → connectez-vous (ou créez un compte, gratuit)
2. Cliquez **Add new site** → **Import an existing project**
3. Choisissez **GitHub** → autorisez Netlify → sélectionnez votre dépôt "teknikschool"
4. Netlify détecte automatiquement les réglages (grâce à `netlify.toml` inclus) :
   - Build command : `npm run build`
   - Publish directory : `dist`
5. **Ne cliquez pas encore sur Deploy** — d'abord l'étape 3.

## Étape 3 — Ajouter les variables d'environnement

Toujours sur la page de configuration du site (avant ou juste après le premier
déploiement) :
1. **Site settings** → **Environment variables** → **Add a variable**
2. Ajoutez ces deux variables (copiez les valeurs de votre fichier `.env` local) :
   - `VITE_SUPABASE_URL` = `https://rcxetjhiseuqqhkiaqvd.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (la longue clé qui commence par `eyJ...`)
3. Cliquez **Deploy site** (ou **Trigger deploy** si déjà déployé une fois)

## Étape 4 — C'est en ligne !

Netlify vous donne une URL du genre `https://teknikschool-xyz123.netlify.app`
— accessible depuis n'importe quel appareil, n'importe où. Vous pouvez aussi
configurer un nom de domaine personnalisé plus tard (Site settings → Domain
management).

## Après chaque changement de code
Si je vous donne un nouveau zip plus tard : remplacez les fichiers dans votre
dossier local, puis :
```
git add .
git commit -m "Mise à jour"
git push
```
Netlify redéploie automatiquement à chaque push — pas besoin de refaire les
étapes 2-3.

## Un rappel important
La fonction Edge (`delete-user`) est complètement séparée de ce déploiement —
elle vit sur Supabase, pas sur Netlify. Si vous ne l'avez pas encore
déployée (voir DEPLOY-EDGE-FUNCTION.md), faites-le à part, ça ne dépend pas
de Netlify.
