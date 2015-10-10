# LVB Stats

Eine graphische Darstellung der Meldungen der Leipziger Verkehrsbetriebe.

Demo (mit Realdaten): http://maweki.de/lvbstats

## Webseite

Zur Installation der Abhängigkeiten um selbst zu entwickeln wird node/npm benötigt

    cd webpage
    npm install

## Grabber

Der Grabber hat mehrere Komponenten:

* __lvbstats-downloader.py__: Lädt alle tweets der letzten Zeit runter (zum Beispiel Nachts oder das Archiv).
* __lvbstats-streamwatch.py__: Beobachtet den Twitterstream und lädt (`--web`) den Volltext von abgekürzten Meldungen aus dem Internet runter
* __lvbstats-redownloader.py__: Lädt den Tweet mit einer gewissen id erneut runter
* __lvbstats-checkdeleted.py__: Checkt tweets aus der Datenbank, ob diese inzwischen gelöscht wurden
* __lvbstats-jsonout.py__: Generiert aus den Tweets der Datenbank eine gesamtdatei, die von der Webseite gelesen werden kann.

zum Ausführen werden die Anforderungen aus der `requirements.txt` benötigt. Installation mit `pip3 install --user -r requirements.txt`

## Entwicklung

Die Entwicklung passiert nach den Git Flow best practices. Pull request sollten also gegen den `develop`-Zweig entwickelt werden.

## Lizenz

Die Seite http://maweki.de/lvbstats, die gerenderten Grafiken, Daten und errechneten Statistiken sind Lizenziert unter http://creativecommons.org/licenses/by-nc-sa/4.0/ (Creative Common Attribution-NonCommercial-ShareAlike 4.0 International)

Der Quellcode des Projekts ist lizenziert unter GPL2.0.
