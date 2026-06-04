# 🏠 Room Overview Card

Eine Lovelace-Karte für Home Assistant im Glasmorphism-Stil. Zeigt eine kompakte Zimmerübersicht mit automatischen Status-Badges und öffnet bei Tippen ein Popup mit allen Geräten – übersichtlich in sortierbaren Abschnitten mit Überschriften.

## ✨ Features

- **Automatische Badges** – Temperatur, Luftfeuchte, Lichter (z. B. 2/4 an) und offene Türen/Fenster werden automatisch gezählt und angezeigt
- **Sortierbares Popup** – Abschnitte mit Überschriften, Entitäten per ▲▼ frei sortierbar
- **Alle Entitätstypen** – Schalter, Dimmer, Thermostate, Rollläden, Mediaplayer, Staubsauger, Timer u.v.m. werden automatisch erkannt
- **Visueller Editor** – alles per Maske einstellbar, kein YAML nötig
- **Glasmorphism-Design** – passend zu den anderen Widgets

## 📦 Installation

### Über HACS (empfohlen)

1. HACS → Frontend → ⋮ → **Custom Repositories**
2. URL: `https://github.com/pquandel2-alt/pq_room_overview_card` → Typ: **Lovelace**
3. Installieren und Seite neu laden

### Manuell

1. `room-overview-card.js` nach `/config/www/` kopieren
2. In `configuration.yaml` unter `lovelace → resources` eintragen:
   ```yaml
   resources:
     - url: /local/room-overview-card.js
       type: module
   ```

## ⚙️ Konfiguration

### Über den visuellen Editor (empfohlen)

1. Karte hinzufügen → **Room Overview Card** auswählen
2. **Raumname** und **Icon** eintragen
3. Optional: **Temperatur-** und **Luftfeuchte-Sensor** wählen
4. **Abschnitte** anlegen (z. B. „Beleuchtung", „Geräte", „Fenster")
5. Entitäten per Picker hinzufügen und mit ▲▼ sortieren

### Per YAML

#### Minimal

```yaml
type: custom:room-overview-card
name: Wohnzimmer
icon: mdi:sofa
sections:
  - title: Beleuchtung
    entities:
      - light.wohnzimmer_decke
      - light.stehlampe
```

#### Mit Sensor-Badges

```yaml
type: custom:room-overview-card
name: Wohnzimmer
icon: mdi:sofa
temperature_entity: sensor.wohnzimmer_temperatur
humidity_entity: sensor.wohnzimmer_luftfeuchte
sections:
  - title: Beleuchtung
    entities:
      - light.wohnzimmer_decke
      - light.stehlampe
  - title: Geräte
    entities:
      - media_player.wohnzimmer_tv
      - switch.spielekonsole
  - title: Geräte
    entities:
      - switch.spielekonsole
door_window_entities:
  - binary_sensor.fenster_links
  - binary_sensor.balkontuer
```

#### Vollständig

```yaml
type: custom:room-overview-card
name: Schlafzimmer
icon: mdi:bed
temperature_entity: sensor.schlafzimmer_temperatur
humidity_entity: sensor.schlafzimmer_luftfeuchte
border_radius: 16
sections:
  - title: Beleuchtung
    entities:
      - entity: light.schlafzimmer_decke
        name: Deckenlampe
      - entity: light.nachttisch_links
        name: Nachttisch Links
      - entity: light.nachttisch_rechts
        name: Nachttisch Rechts
  - title: Klima
    entities:
      - climate.schlafzimmer_thermostat
      - fan.schlafzimmer_luefter
  - title: Rollläden
    entities:
      - cover.rollo_fenster
      - cover.rollo_balkontuer
  - title: Sensoren
    entities:
      - binary_sensor.fenster_schlafzimmer
      - binary_sensor.tuer_schlafzimmer
```

## 🔧 Optionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `name` | string | `Zimmer` | Raumname |
| `icon` | string | `mdi:home` | Icon der Karte |
| `temperature_entity` | string | – | Temperatursensor für Badge |
| `humidity_entity` | string | – | Luftfeuchte-Sensor für Badge |
| `door_window_entities` | liste | `[]` | Tür-/Fensterkontakte als Icon-Badges (rot = offen, grau = geschlossen) |
| `sections` | liste | `[]` | Abschnitte im Popup (siehe unten) |
| `border_radius` | number | `16` | Eckenradius in px |

### Abschnitt-Optionen

| Option | Typ | Beschreibung |
|---|---|---|
| `title` | string | Überschrift des Abschnitts (optional) |
| `entities` | liste | Entitäten als einfache ID-Strings oder Objekte mit `entity` und `name` |

### Entitäts-Format

```yaml
# Einfach (Friendly Name aus HA)
- light.wohnzimmer_decke

# Mit eigenem Anzeigenamen
- entity: light.wohnzimmer_decke
  name: Deckenlampe
```

## 🏷️ Automatische Badges

Die Badges auf der Hauptkarte werden automatisch berechnet:

| Badge | Quelle |
|---|---|
| 🌡 Temperatur | `temperature_entity` |
| 💧 Luftfeuchte | `humidity_entity` |
| 💡 Lichter | Zählt alle `light.*`-Entitäten aus den Abschnitten |
| 🚪/🪟 Tür/Fenster | `door_window_entities` – Icon rot wenn offen, grau wenn geschlossen |

## 🎛️ Erkannte Entitätstypen im Popup

| Entität | Anzeige |
|---|---|
| `switch`, `light`, `input_boolean`, `fan` | Toggle-Schalter |
| `input_number`, `number` | Slider |
| `input_select`, `select` | Dropdown |
| `cover` | Auf / Stop / Zu |
| `climate` | Modus-Dropdown + Temperatur-Slider |
| `media_player` | Play/Pause + Lautstärke |
| `lock` | Verriegelt/Offen Toggle |
| `vacuum` | Start / Pause / Dock |
| `timer` | Start / Pause / Stop + Restzeit |
| `fan` | Toggle + Geschwindigkeit |
| `automation` | Toggle + Auslösen-Button |
| `button`, `scene`, `script` | Aktivieren/Ausführen-Button |
| `input_text` | Texteingabe |
| Alles mit `options`-Attribut | Dropdown |
| Alles mit `min`/`max`-Attribut | Slider |
| Alles mit `on`/`off`-Zustand | Toggle |
| Alles andere | Anzeige + Info-Button |

## 🔗 Verwandte Projekte

- [Glass Button Card](https://github.com/pquandel2-alt/pq_glass-button-card) – Konfigurierbarer Button mit Popup im gleichen Glasstil
- [Energy Card](https://github.com/pquandel2-alt/pq_energy_card) – Stromverbrauch aller Geräte im gleichen Glasstil
- [Battery Card](https://github.com/pquandel2-alt/pq_battery_card) – Batteriestände im gleichen Glasstil
- [Washer Card](https://github.com/pquandel2-alt/pq_washer_card) – Waschmaschine/Trockner im gleichen Glasstil
- [Trash Widget Card](https://github.com/pquandel2-alt/pq_trash_widget_card) – Müllabholtermin im gleichen Glasstil
- [Weather Widget Card](https://github.com/pquandel2-alt/pq_weather_widget_card) – Wetter im gleichen Glasstil
