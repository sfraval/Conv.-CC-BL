# LA HUNE — Boîte à outils expert pêche

PWA d'aide à l'expertise maritime sur les sinistres pêche, regroupant quatre modules de calcul opérationnels.

> Cabinet d'expertise maritime indépendant · Landéda, Finistère

## Modules disponibles

### 1. Convention de Boulogne (W > 700 CV / 515,2 kW)
Calcul X (perte de pêche), Y (service rendu), Z (dommages assistant) avec la formule indemnité horaire `I = (W/100) × [(8,5W + 16475)/(W + 350)] × Kb × (1/6,55957)`.

### 2. Convention de Concarneau (W < 900 CV / 662 kW)
Barème complet : indemnité de base A (déroutement, remorquage avec tranches 0-5/6-50/51-400/401-600/>600 milles, météo A4), coefficients B (marée), C (retour lieux de pêche), D (immobilisation, attente), E (puissance), Kc, × 1,20 usure des câbles. Gestion de la dégressivité pannes propulsives (90 %, 25 %, 0 %) et de la prise en charge 9/10 + plafond 850 × Kc pour navires assistés ≤ 300 kW.

### 3. Pertes de pêche (méthode 4 étapes)
- **Étape 1** : Coefficient pondérateur sur 3 navires de référence
- **Étape 2** : CA brut perdu sur historique 3 ans
- **Étape 3** : Charges fixes à déduire (édition libre du tableau)
- **Étape 4** : Perte retenue = CA brut perdu − charges déductibles

### 4. Abordage RIPAM / COLREG
Partage de responsabilité par système de points sur les manquements aux règles du RIPAM. Catalogue intégré des règles 5 à 19, plus 35. Calcul automatique des soldes (qui doit combien à qui).

## Cas pratiques de validation

Les valeurs par défaut reproduisent les cas pédagogiques :

| Module | Hypothèses clés | Résultat attendu |
|---|---|---|
| Boulogne | W=700 CV, V=18 000 €, H=72 h, A=72 h, R=0, p=0,8, dr=12 h, m=1,3, avaries=6 000 €, immo=3 000 €, Kb=4,05 | **28 799,93 €** |
| Concarneau | N1=Nrem=260 milles, A4=1, B=1, dRefuge=180 milles, E=2,55 (450-499 CV), Kc=8,44, avaries=1 800 € | **17 689,69 €** |
| Pertes de pêche | 72 j d'arrêt, coeff pondérateur 0,8946, CA/j histo 21 522,60 €, charges 12 026,89 €/j | **520 440,25 €** |
| Abordage | A: 6 pts (1+2+3), B: 1 pt | A = 6/7 = 85,71 % · B = 1/7 = 14,29 % |

## Sauvegarde et partage

- **Stockage local** : tous les dossiers sont sauvegardés dans le navigateur (localStorage), pas de cloud, conforme RGPD pour usage interne LA HUNE
- **Export JSON** : sauvegarde complète de tous les dossiers pour backup ou transfert vers un autre appareil
- **Import JSON** : restauration d'un export antérieur

## Export PDF style LA HUNE

Chaque module génère un rapport PDF avec :
- Bandeau navy + signature `LA HUNE.`
- Tableaux structurés des hypothèses et du calcul détaillé
- Encart navy/coral pour le résultat final
- Pied de page LA HUNE

Le PDF est conçu pour être joint au rapport d'expertise final.

## Sources

- Document FFA de référence : *Assurance maritime sur corps de navires de pêche, modèles de polices et de clauses, version 2016*
- Avenants Boulogne et Concarneau aux polices Corps de pêche
- Code des transports, articles L5132-1 à L5132-9
- RIPAM 1972 (Convention COLREG)
- Cours DUEMTM, Module 9, séance du 12 mars 2026

## Stack

- React 18 + Vite 5
- Tailwind CSS
- jsPDF + jsPDF-autotable (génération PDF)
- vite-plugin-pwa (manifest + service worker offline)
- lucide-react (icônes)

## Démarrage local

```bash
npm install
npm run dev
```

## Build et déploiement GitHub Pages

```bash
npm run build
```

Le workflow `.github/workflows/deploy.yml` déploie automatiquement sur Pages à chaque push sur `main`. Activer GitHub Pages dans Settings → Pages → Source : "GitHub Actions".

URL finale : `https://<ton-user>.github.io/lahune-conventions-pwa/`

## Installation sur iPhone

1. Ouvrir l'URL dans Safari
2. Bouton Partager → "Sur l'écran d'accueil"
3. L'icône LA HUNE apparaît, l'app fonctionne offline

## Charte graphique LA HUNE

- Coral `#E85B3A`
- Navy `#1C2E5C`
- Sable `#FAF7F2`
- Encre `#0F1B33`
- Signature : `LA HUNE.` (avec point final)

## Avertissement

Outil interne d'aide à la décision. Toujours vérifier les calculs Conventions contre les conditions particulières de la police et la convention en vigueur. Pour le module Abordage, le partage de responsabilité par points est une méthode pédagogique : la décision finale appartient aux parties, à leurs assureurs ou à la juridiction compétente.
