# Wokwi – Simulateur ESP32 pour BioGaz+ / SmartDigest

Ce dossier contient une maquette Wokwi permettant de simuler un ESP32 qui publie des mesures de température, méthane (CH4), sulfure d'hydrogène (H2S) et pression.

## Fichiers

- `diagram.json` : représentation de la carte et des composants virtuels
- `firmware/biogaz_monitor.ino` : firmware Arduino simulant les capteurs et envoyant les valeurs sur le port série

## Ouvrir dans Wokwi

1. Ouvrir le dossier `wokwi` dans Wokwi.
2. Vérifier que le fichier `diagram.json` est bien présent.
3. Charger le sketch `firmware/biogaz_monitor.ino`.
4. Lancer la simulation.

## Ce que simule le firmware

- Température du digesteur : 35–42 °C
- Taux de méthane : 45–70 %
- H2S : 80–500 ppm
- Pression : 14–30 mbar
- LED verte = système sain
- LED rouge = alerte ou danger

## Rôle pour le jury

Cette simulation permet de montrer une vraie logique d'IoT embarqué, sans avoir à acheter de composants physiques, tout en restant crédible pour une démonstration live.
