# TeknikSchool → App Android → Play Store

## Ce qui est déjà fait pour vous
- Capacitor est configuré dans le projet (`capacitor.config.json`)
- Le nom de l'app : **TeknikSchool**
- L'identifiant technique : `com.teknikschool.app`

## Ce que VOUS devez installer sur votre ordinateur (une seule fois)

### 1. Android Studio
Téléchargez et installez depuis : https://developer.android.com/studio
(Gratuit. Prend un peu de place — comptez 15-20 minutes d'installation.)

### 2. Java (généralement inclus avec Android Studio, mais vérifiez)
Android Studio installe son propre JDK automatiquement dans la plupart des cas.

## Étapes pour générer l'app (dans le dossier teknikschool)

Ouvrez un terminal dans le dossier `teknikschool`, puis :

```
npm install
npm run build
npx cap add android
npx cap sync
npx cap open android
```

La dernière commande ouvre le projet directement dans Android Studio.

## Dans Android Studio

1. Attendez qu'Android Studio termine de synchroniser le projet (barre de
   progression en bas, peut prendre plusieurs minutes la première fois)
2. Menu **Build** → **Generate Signed Bundle / APK**
3. Choisissez **Android App Bundle** (format requis par le Play Store)
4. Créez une **nouvelle clé de signature** (keystore) si vous n'en avez pas :
   - **IMPORTANT** : notez le mot de passe et gardez le fichier `.jks` en
     lieu sûr — si vous le perdez, vous ne pourrez plus jamais mettre à
     jour votre app sur le Play Store, il faudra en créer une nouvelle
5. Suivez l'assistant jusqu'au bout → ça génère un fichier `.aab`

## Créer votre compte développeur Google Play

1. https://play.google.com/console/signup
2. Frais unique de **25 $US** (payé par vous, une seule fois, à vie)
3. Remplissez les informations demandées (identité, etc.)

## Publier l'app

1. Dans la Play Console → **Créer une application**
2. Remplissez la fiche : nom, description, catégorie (Éducation), icône,
   captures d'écran (obligatoires — prenez des photos de l'app en marche)
3. **Politique de confidentialité** — obligatoire même pour une app
   gratuite. Un document simple suffit, hébergé n'importe où (même une
   page web basique). Dites-moi si vous voulez que je vous en rédige une.
4. Uploadez le fichier `.aab` généré plus tôt
5. Soumettez pour examen — Google prend généralement **quelques jours à
   une semaine** pour approuver une nouvelle app

## Résumé honnête
Je peux préparer tout le code et vous guider précisément à chaque étape,
mais la partie "build + signer + publier" doit se faire sur VOTRE
ordinateur avec Android Studio, et le compte développeur + soumission
passent par VOUS sur le site de Google — aucune de ces étapes ne peut se
faire depuis notre conversation ici.
