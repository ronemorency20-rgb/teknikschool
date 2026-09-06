# iOS (iPhone) — comment publier sans Mac

## La contrainte réelle (pas une limite de Claude — une limite d'Apple)
Compiler une vraie app iOS nécessite **Xcode**, qui ne fonctionne QUE sur
macOS. Il n'existe aucune façon de contourner ça, peu importe l'outil
utilisé. C'est une règle d'Apple, pas une restriction technique qu'on
peut éviter avec du code.

## Ce qui est déjà prêt dans ce projet
- Le dossier `ios/` peut être généré (Capacitor le fait très bien même
  sans Mac) — mais il ne peut être **compilé** que sur macOS
- Les icônes et écran de démarrage iOS sont déjà générés à partir de
  votre logo (dans `resources/`), prêts à être utilisés dès que vous
  aurez accès à un Mac

## Vos 3 options réalistes, sans acheter de Mac

### Option A — Un service de build dans le cloud (recommandé)
Des services en ligne compilent votre app iOS pour vous sur de vrais Macs
distants, sans que vous ayez besoin d'en posséder un.

**Codemagic** (codemagic.io) — le plus simple pour un projet Capacitor :
1. Créez un compte (offre gratuite disponible, limitée en minutes de build)
2. Connectez votre dépôt GitHub `teknikschool`
3. Codemagic détecte automatiquement que c'est un projet Capacitor
4. Vous configurez vos identifiants Apple Developer (voir ci-dessous)
5. Codemagic compile et peut même soumettre directement à l'App Store

C'est un service tiers, distinct de tout ce qu'on a fait jusqu'ici — je
peux vous guider dedans si vous voulez vous lancer.

### Option B — Louer un Mac à distance
Des services comme **MacInCloud** ou **MacStadium** louent l'accès à un
vrai Mac par heure ou par mois. Vous vous connectez dessus comme si
c'était votre propre ordinateur (bureau à distance) et utilisez Xcode
normalement, exactement comme sur les captures qu'on a faites pour
Android Studio.

### Option C — Emprunter/acheter un Mac
Un Mac Mini d'occasion suffit largement pour ça — pas besoin de matériel
récent ou puissant.

## Le compte développeur Apple — différent de Google
- **99 $US PAR AN** (pas un paiement unique comme les 25$ de Google Play)
- S'inscrit sur developer.apple.com
- Nécessaire quelle que soit l'option choisie ci-dessus

## Ma recommandation
Commencez par **Codemagic** (Option A) — c'est le chemin le plus simple
et le moins cher pour tester avant de s'engager dans quoi que ce soit de
plus coûteux. Dites-moi si vous voulez qu'on s'y attaque ensemble.
