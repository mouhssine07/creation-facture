# Générateur de factures YES LINK SARLAU

Application web statique et déployable pour créer une facture A4 similaire au modèle fourni.

## Fonctions

- Numéro, date, client et ICE modifiables
- Tableau de lignes avec référence, désignation, quantité et prix unitaire
- Calcul automatique du total HT, de la TVA 20 % et du total TTC
- Conversion automatique du total TTC en lettres françaises
- Mode de règlement fixe : ESPÈCES
- Coordonnées de YES LINK SARLAU fixes dans le pied de page
- Sauvegarde automatique dans le navigateur
- Impression ou enregistrement PDF via le navigateur
- Installation possible comme application PWA après déploiement

## Utilisation locale

Ouvrez `index.html` dans un navigateur. Pour activer l'installation PWA et le mode hors-ligne, servez le dossier avec un petit serveur local :

```bash
python -m http.server 8080
```

Puis ouvrez `http://localhost:8080`.

## Déploiement

Le projet ne nécessite ni base de données ni serveur backend.

### Netlify

Glissez-déposez le dossier dans Netlify Drop.

### GitHub Pages

1. Créez un dépôt GitHub.
2. Ajoutez tous les fichiers du dossier à la racine.
3. Activez GitHub Pages depuis la branche principale.

### Vercel

Importez le dépôt comme projet statique, sans commande de build.

## PDF

Cliquez sur `Télécharger / Imprimer PDF`, puis sélectionnez `Enregistrer au format PDF` dans la fenêtre d'impression.
