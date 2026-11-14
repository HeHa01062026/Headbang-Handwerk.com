# Startseite: offene Textänderungen im CMS

Stand: 14.11.2026

Ergebnis einer Prüfung der Startseite auf doppelte und dreifache Texte. Was im Code lag, ist umgesetzt
(Branch `startseite-layout`). Die Punkte hier sind CMS-Texte. Sie müssen auf der Live-Seite im Admin
geändert werden.

**So geht's:** Unter `/admin-login` anmelden und die Startseite öffnen. Die Panels stehen oben auf der
Seite. Die Buttontexte der Veranstaltungen pflegt man auf `/veranstaltungen`.

> **Achtung, leere Felder:** „Einleitung optional“ ist derzeit nicht wirklich optional. Ein geleertes
> Feld wird beim Anzeigen durch den Standardtext ersetzt (`normalizeMultilineText` in `lib/home.ts`).
> Dann erscheint wieder genau der Text, den man loswerden wollte. Bis das im Code behoben ist, das Feld
> mit einem neuen Text füllen statt es zu leeren.

## 1. News: dreimal „Aktuell…“ hintereinander

Panel **„News“**

| Feld | Jetzt | Vorschlag |
|---|---|---|
| Überschrift | Aktuelles aus dem Verein | Neues aus dem Verein |
| Einleitung optional | Aktuelle Neuigkeiten, Einblicke und Hinweise aus dem Verein. | leer *(geht erst nach Code-Fix, siehe oben)*, bis dahin z. B. „Was gerade bei uns passiert.“ |

Grund: Die Mini-Überschrift „Aktuelles“ ist fest im Code. Überschrift und Einleitung wiederholen dasselbe
Wort in den beiden Zeilen darunter, „aus dem Verein“ steht zusätzlich doppelt.

## 2. Veranstaltungen: Einleitung

Panel **„Veranstaltungen-Vorschau“**

| Feld | Jetzt | Vorschlag |
|---|---|---|
| Einleitung optional | Drei kommende Termine aus unserer Veranstaltungsverwaltung. Für mehr Details geht es direkt zur Übersicht. | Hier triffst du uns als Nächstes. |

Grund:
- **Inhaltlich falsch:** Mobil wird nur ein Termin gezeigt. Gibt es weniger als drei kommende Termine,
  stimmt „Drei“ auch auf dem Desktop nicht.
- **Admin-Sicht:** „Veranstaltungsverwaltung“ ist ein Begriff aus der Verwaltung, nicht aus Sicht der
  Besucher.
- **Doppelt:** Der Hinweis auf die Übersicht wiederholt den Button „Alle Veranstaltungen“ direkt unter
  den Karten.

## 3. Hero

Panel **„Hero“**

| Feld | Jetzt | Vorschlag |
|---|---|---|
| Button 2 Text / Ziel | Mitglied werden → `/formular` | Über uns → `/ueber-uns` |
| Beschreibung optional | … „Unsere Mitglieder bekommen exclusiv einen Zugang zur Appschmiede!“ | diesen Satz streichen |

Grund:
- **Button 2:** „Mitglied werden“ steht direkt unter dem gleichnamigen Menüpunkt. Die Mitgliedschaft ist
  außerdem im Bereich „Mitmachen“ verlinkt. Ganz entfernen lässt sich der Button nicht, das Formular
  verlangt ihn als Pflichtfeld. Deshalb hier ein anderes Ziel.
- **AppSchmiede-Satz:** Die AppSchmiede steht schon als News-Beitrag und im „Mehr“-Menü. Falls der Satz
  bleibt: „exklusiv“ statt „exclusiv“ und „AppSchmiede“ wie in der News.

## 4. Buttontexte der Karten

| Wo | Feld | Jetzt | Vorschlag |
|---|---|---|---|
| `/veranstaltungen`, je Veranstaltung | Button Text | Mehr erfahren | Zur Festival-Website |
| Startseite, Panel „News“, Beitrag AppSchmiede | Linktext optional | mehr erfahren | Mehr erfahren |

Grund:
- **Veranstaltungen:** Alle drei Buttons führen auf externe Seiten. „Zur Festival-Website“ sagt das
  vorher. Für Screenreader ergänzt der Code bereits den Veranstaltungsnamen.
- **News:** Einheitliche Großschreibung wie auf den anderen Buttons.

## Nicht mehr nötig

Der Vorschlag zum Footer (Link „Kontaktseite“ und Mail-Icon doppelt) ist durch den Umbau erledigt. Der
Footer zeigt jetzt Instagram, E-Mail und „Nachricht senden“ je einmal.
