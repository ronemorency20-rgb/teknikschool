# Publicités — AdSense (web) + AdMob (Android)

## Ce qui est déjà fait
- Le composant `AdBanner` détecte automatiquement si l'app tourne sur le
  web (AdSense) ou dans l'app Android (AdMob) et affiche le bon type de pub
- Il est placé dans le Catalogue de cours (élève), sous la barre de recherche
- Tant que vous n'avez pas mis vos vrais identifiants, **aucune pub cassée
  ne s'affiche** — le composant reste simplement invisible

## Partie 1 — AdSense (le site web, teknikskool.com)

### Créer le compte
1. https://www.google.com/adsense → Commencer
2. Ajoutez votre site : `teknikskool.com`
3. Google va vérifier votre site — **il doit déjà être en ligne et
   accessible publiquement**, ce qui est déjà le cas
4. **Attendez l'approbation** — Google exige un minimum de contenu
   réel et de trafic avant d'approuver un site. Ça peut prendre de
   quelques jours à plusieurs semaines. Rien à faire de votre côté
   en attendant, juste patienter.

### Une fois approuvé
1. Dans votre compte AdSense → **Annonces** → **Par emplacement**
   → créez un bloc d'annonce → copiez le **Client ID** (commence par
   `ca-pub-...`) et le **Slot ID** (une suite de chiffres)
2. Dans Netlify → **Site settings** → **Environment variables**, ajoutez :
   - `VITE_ADSENSE_CLIENT_ID` = `ca-pub-XXXXXXXXXXXXXXXX`
   - `VITE_ADSENSE_SLOT_ID` = `XXXXXXXXXX`
3. Netlify → **Trigger deploy** pour reconstruire avec ces valeurs

Les pubs commenceront à s'afficher sur le site après ça.

## Partie 2 — AdMob (l'app Android)

### Créer le compte
1. https://admob.google.com → Commencer
2. Créez une application dans AdMob (ou liez celle du Play Store une fois
   publiée — vous pouvez aussi démarrer avec une app "non publiée")
3. Créez un **bloc d'annonces bannière** → copiez :
   - **App ID** (format `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)
   - **Ad Unit ID** (format `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`)

### Configurer le projet (2 fichiers à modifier)

**1. `src/AdBanner.jsx`** — remplacez cette ligne près du haut du fichier :
```js
const ADMOB_BANNER_ID_ANDROID = "ca-app-pub-3940256099942544/6300978111";
```
par votre vrai **Ad Unit ID**.

Plus bas dans le même fichier, changez aussi `isTesting: true` en
`isTesting: false` à deux endroits, une fois que vous êtes prêt à
afficher de vraies pubs (pas avant — Google peut bannir un compte qui
affiche de fausses pubs de test en production).

**2. Après avoir généré le dossier Android** (`npx cap add android`),
ouvrez `android/app/src/main/AndroidManifest.xml` et ajoutez, à
l'intérieur de la balise `<application>` :
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="VOTRE_APP_ID_ICI"/>
```

Puis relancez :
```
npm run build
npx cap sync
```

## Important à savoir
- **Ne cliquez jamais sur vos propres pubs** pour tester — Google bannit
  les comptes pour "clics invalides", même accidentels
- Les pubs de test (`isTesting: true`, ou le AdMob ID actuel qui est
  celui de test officiel de Google) sont sûres à afficher pendant le
  développement
- Un compte AdSense refusé peut être resoumis après avoir corrigé ce que
  Google signale dans son email de refus
