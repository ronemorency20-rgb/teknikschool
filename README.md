# TeknikSchool

## Conformité Google Play — tout ajouté

### 1. Politique de confidentialité — teknikskool.com/privacy.html
### 2. Conditions d'utilisation — teknikskool.com/terms.html
### 3. Suppression de compte — dans l'app (Mon profil) + page web séparée
   teknikskool.com/#/delete-account

### 4. NOUVEAU : Signalement de messages (modération du contenu généré par les utilisateurs)
- **Élèves/professeurs** : bouton "drapeau" au survol d'un message d'un
  autre utilisateur dans la communauté → choisir un motif (Spam,
  Harcèlement, Contenu inapproprié, Autre) → envoyé
- **Admin** : nouvel onglet **"Signalements"** — voit tous les
  signalements en attente avec le message, l'auteur, qui a signalé et
  pourquoi → peut supprimer le message directement ou ignorer le
  signalement
- Répond à l'exigence de Google pour les apps avec contenu généré par les
  utilisateurs (avoir un système de signalement + modération)

## ⚠️ Deux choses à faire après avoir mis à jour le code

### A. Exécuter le nouveau SQL
`message-reports-schema.sql` — crée la table des signalements.

### B. Redéployer la fonction Edge (rappel de la mise à jour précédente)
```
supabase functions deploy delete-user
```

## Rappel des fonctionnalités précédentes
- App Android fonctionnelle, bundle signé déjà généré
- Thème blanc partout, système d'icônes complet
- Toutes les fonctionnalités admin/professeur/élève des mises à jour précédentes
