# Bookmark Manager

Un outil moderne de gestion des bookmarks inspiré de TabMe, construit avec React et react-flexlayout.

## Fonctionnalités

- 📚 **Gestion des bookmarks** : Ajout, modification, suppression
- 🗂️ **Organisation en groupes** : Créez des groupes avec des couleurs personnalisées
- 🔍 **Recherche avancée** : Recherche dans les titres, URLs, descriptions et tags
- 🏷️ **Système de tags** : Organisez vos bookmarks avec des tags
- 💾 **Sauvegarde locale** : Les données sont sauvegardées automatiquement
- 📤 **Export/Import** : Partagez votre configuration en JSON avec votre équipe
- 🎨 **Interface moderne** : Design sombre inspiré de TabMe
- ⚡ **Layout flexible** : Interface avec react-flexlayout

## Installation

1. **Cloner le projet** (déjà fait dans votre workspace)

2. **Installer les dépendances** :
```bash
npm install
```

3. **Lancer l'application** :
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## Utilisation

### Ajouter un bookmark
1. Cliquez sur le bouton "Bookmark" dans la toolbar
2. Remplissez le formulaire avec le titre, l'URL, la description (optionnelle)
3. Ajoutez des tags si nécessaire
4. Sélectionnez le groupe de destination
5. Cliquez sur "Ajouter"

### Créer un groupe
1. Cliquez sur le bouton "Groupe" dans la toolbar
2. Donnez un nom au groupe et choisissez une couleur
3. Cliquez sur "Ajouter"

### Rechercher des bookmarks
- Utilisez la barre de recherche en haut
- La recherche fonctionne sur les titres, URLs, descriptions et tags

### Exporter/Importer la configuration
- **Exporter** : Cliquez sur "Exporter" pour télécharger un fichier JSON
- **Importer** : Cliquez sur "Importer" et sélectionnez un fichier JSON

## Structure du projet

```
src/
├── components/          # Composants React
│   ├── BookmarkCard.tsx # Carte d'affichage d'un bookmark
│   ├── BookmarkForm.tsx # Formulaire d'ajout/modification
│   ├── BookmarkList.tsx # Liste des bookmarks
│   ├── BookmarkManager.tsx # Composant principal
│   ├── GroupForm.tsx    # Formulaire de groupe
│   ├── GroupHeader.tsx  # En-tête de groupe
│   └── Toolbar.tsx      # Barre d'outils
├── contexts/            # Contextes React
│   └── BookmarkContext.tsx # Gestion d'état global
├── types/              # Types TypeScript
│   └── bookmark.ts     # Définitions des types
├── App.tsx             # Composant racine
├── main.tsx           # Point d'entrée
└── index.css          # Styles globaux
```

## Technologies utilisées

- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool moderne
- **react-flexlayout** - Système de layout flexible
- **lucide-react** - Icônes modernes
- **UUID** - Génération d'identifiants uniques

## Personnalisation

### Couleurs des groupes
Les couleurs par défaut sont définies dans `GroupForm.tsx`. Vous pouvez ajouter ou modifier les couleurs :

```typescript
const DEFAULT_COLORS = [
  '#3b82f6', // bleu
  '#ef4444', // rouge
  '#10b981', // vert émeraude
  // ... ajoutez vos couleurs
];
```

### Styles CSS
Tous les styles sont dans `index.css`. Vous pouvez personnaliser :
- Les couleurs du thème
- Les tailles des éléments
- Les animations
- La disposition

## Commandes disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Aperçu du build de production
- `npm run lint` - Vérification du code avec ESLint

## Format des données exportées

Le fichier JSON exporté contient :
```json
{
  "version": "1.0.0",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "groups": [
    {
      "id": "uuid",
      "title": "Nom du groupe",
      "color": "#3b82f6",
      "bookmarks": [
        {
          "id": "uuid",
          "title": "Titre du bookmark",
          "url": "https://example.com",
          "description": "Description",
          "tags": ["tag1", "tag2"],
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z",
          "favicon": "https://..."
        }
      ]
    }
  ]
}
```

## Compatibilité

- Navigateurs modernes (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Support du drag & drop
- Responsive design pour mobile et desktop

## Licence

MIT - Vous êtes libre d'utiliser, modifier et distribuer ce code.
