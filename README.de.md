# Dureń / Durak

**Das klassische Kartenspiel Durak – vollständig offline im Browser.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

Keine Installation, kein Server und kein Konto sind nötig. Das gesamte Spiel steckt in einer einzigen Datei: `durniak.html`. Datei herunterladen, in einem modernen Browser öffnen und spielen.

## Enthaltene Funktionen

- Klassisches Durak-Blatt mit **36 Karten von 6 bis Ass**
- Ein menschlicher Spieler und **1–3 Computergegner**
- Eigener Schwierigkeitsgrad für jeden Bot: **Leicht, Normal, Schwer, Experte**
- Optionale **Übergabe / Perevodnoy**-Regel
- Optionales Sechs-Karten-Limit im Angriff
- Wahlweise dürfen alle Spieler oder nur der Angreifer Karten dazulegen
- Anfängermodus mit Hervorhebung legaler Karten und kontextbezogenen Hinweisen
- Schritt-für-Schritt-Anleitung mit geführter Übungsrunde
- Rundenhistorie und Regelübersicht direkt im Spiel
- Kartenanimationen und einfache Tischgeräusche
- Drei Geschwindigkeiten für Bot-Züge
- Automatisches lokales Speichern und Fortsetzen einer Partie
- Responsive Oberfläche für kleinere Bildschirme
- Sprachen: **Polnisch, Englisch, Deutsch und Russisch**

## Spielen

1. [`durniak.html`](durniak.html) herunterladen.
2. Die Datei in einem modernen Webbrowser öffnen.
3. **Neues Spiel** wählen oder mit **Spielanleitung** beginnen, wenn du Durak noch nicht kennst.

Mehr ist nicht nötig. Nach dem Herunterladen funktioniert das Spiel ohne Internetverbindung und ohne externe Laufzeit-Abhängigkeiten.

## Regeln in Kurzform

Jeder Spieler beginnt mit sechs Karten. Eine offene Karte liegt quer unter dem Talon und bestimmt die Trumpffarbe für die gesamte Runde.

Der Angreifer spielt eine Karte. Der Verteidiger muss sie mit einer höheren Karte derselben Farbe oder mit einem Trumpf schlagen. Ein Trumpf kann nur von einem höheren Trumpf geschlagen werden. Weitere Angriffskarten dürfen einen Rang haben, der bereits auf dem Tisch liegt.

Kann oder will der Verteidiger nicht schlagen, nimmt er die Karten auf. Nach jedem Zug werden die Hände wieder auf sechs Karten aufgefüllt, solange der Talon noch Karten enthält. Ist der Talon leer, scheiden Spieler aus, sobald sie keine Karten mehr auf der Hand haben.

Der letzte Spieler mit Karten ist der **Durak – der Narr**.

## Bot-Schwierigkeit

Die Schwierigkeitsgrade unterscheiden sich nicht nur durch die Geschwindigkeit. Höhere Stufen verwenden zunehmend stärkere Entscheidungslogik.

- **Leicht** — spielt bewusst lockerer und teilweise zufällig.
- **Normal** — bevorzugt günstige Angriffe und vernünftige Verteidigung.
- **Schwer** — berücksichtigt Kartenwert, mehrfach vorhandene Ränge und den Zustand des Talons.
- **Experte** — schätzt zusätzlich unbekannte Karten, Verteidigungsrisiko und das Tempo im Endspiel ein.

Jeder Gegner kann in derselben Partie einen anderen Schwierigkeitsgrad verwenden.

## Optionale Regeln

Vor dem Spiel lassen sich mehrere verbreitete Durak-Varianten einstellen:

- **Alle dürfen dazulegen** — deaktiviert bedeutet, dass nur der ursprüngliche Angreifer weitere Karten spielen darf.
- **Übergabe (Perevodnoy)** — solange der Verteidiger noch keine Karte geschlagen hat, kann er den Angriff mit einer Karte desselben Ranges an den nächsten Spieler weitergeben.
- **Sechs-Karten-Limit** — kann für weniger eingeschränkte Angriffe deaktiviert werden.

## Speichern und Datenschutz

Einstellungen, Statistiken und – sofern aktiviert – die aktuelle Partie werden lokal im Browser über `localStorage` gespeichert.

Es müssen keine Daten an einen Server gesendet werden. Beim Löschen der Website-Daten im Browser kann auch der Spielstand entfernt werden.

## Technische Hinweise

Das Projekt ist bewusst einfach aufgebaut:

- eine einzige, selbstständige HTML-Datei
- reines HTML, CSS und JavaScript
- kein Build-Schritt
- kein Framework
- keine externen Ressourcen zur Laufzeit erforderlich

Dadurch lässt sich das Spiel problemlos auf einem Computer, USB-Stick oder an jedem anderen Ort speichern und vollständig offline starten.
