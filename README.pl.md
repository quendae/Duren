# Dureń / Durak

**Klasyczny Dureń działający całkowicie offline w przeglądarce.**

[English](README.md) · [Polski](README.pl.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

Nie trzeba nic instalować, uruchamiać serwera ani zakładać konta. Cała gra mieści się w jednym pliku `durniak.html` — pobierz go, otwórz w nowoczesnej przeglądarce i graj.

## Co znajduje się w grze

- Klasyczna talia Duraka: **36 kart od 6 do Asa**
- Jeden gracz i **1–3 przeciwników komputerowych**
- Osobny poziom trudności dla każdego bota: **Łatwy, Normalny, Trudny, Ekspert**
- Opcjonalne **przerzucanie / perewod**
- Opcjonalny limit sześciu kart w ataku
- Możliwość wyboru, czy dorzucają wszyscy, czy tylko atakujący
- Tryb początkującego z podświetlaniem legalnych kart i podpowiedziami
- Samouczek krok po kroku z prowadzoną rozgrywką próbną
- Historia rozdania i zasady dostępne podczas gry
- Animacje kart i proste dźwięki stołu
- Trzy prędkości ruchów botów
- Automatyczny zapis lokalny i możliwość kontynuowania partii
- Interfejs dopasowujący się do mniejszych ekranów
- Języki: **polski, angielski, niemiecki i rosyjski**

## Jak uruchomić

1. Pobierz [`durniak.html`](durniak.html).
2. Otwórz plik w nowoczesnej przeglądarce internetowej.
3. Wybierz **Nowa gra** albo zacznij od **Jak grać**, jeśli dopiero poznajesz Duraka.

I tyle. Po pobraniu pliku gra nie wymaga internetu ani żadnych zewnętrznych zależności.

## Zasady w skrócie

Każdy zaczyna z sześcioma kartami. Jedna odkryta karta leży pod talonem i wyznacza atut na całe rozdanie.

Atakujący wykłada kartę. Obrońca musi przebić ją wyższą kartą w tym samym kolorze albo atutem. Atut można przebić tylko wyższym atutem. Kolejne karty ataku można dorzucać, jeśli ich ranga znajduje się już na stole.

Jeśli obrońca nie może albo nie chce bić, bierze karty. Po zakończeniu tury gracze uzupełniają ręce do sześciu kart, dopóki w talonie są karty. Po wyczerpaniu talonu gracz, który pozbędzie się całej ręki, wychodzi z gry.

Ostatni gracz, któremu zostały karty, zostaje **Durniem**.

## Poziomy botów

Poziomy trudności nie różnią się wyłącznie szybkością ruchów. Wyższe poziomy korzystają z coraz mocniejszych heurystyk.

- **Łatwy** — gra celowo luźniej i częściowo losowo.
- **Normalny** — preferuje tanie ataki i rozsądną obronę.
- **Trudny** — bierze pod uwagę wartość kart, powtarzające się rangi i stan talonu.
- **Ekspert** — dodatkowo szacuje niewidoczne karty, ryzyko obrony i tempo końcówki.

Każdy bot przy stole może mieć inny poziom.

## Zasady dodatkowe

Przed rozpoczęciem gry można dostosować kilka popularnych wariantów Duraka:

- **Dorzucają wszyscy** — po wyłączeniu kolejne karty może dokładać tylko gracz, który rozpoczął atak.
- **Przerzucanie (perewod)** — obrońca, który jeszcze niczego nie przebił, może przekazać atak następnemu graczowi kartą tej samej rangi.
- **Limit sześciu kart** — można go wyłączyć, aby ataki były mniej ograniczone.

## Zapis i prywatność

Ustawienia, statystyki i — jeśli zapis jest włączony — aktualna partia są przechowywane lokalnie w przeglądarce przez `localStorage`.

Gra nie musi wysyłać niczego na serwer. Wyczyszczenie danych witryny w przeglądarce może również usunąć zapis partii.

## Technicznie

Projekt celowo pozostaje prosty do uruchomienia i przenoszenia:

- jeden samowystarczalny plik HTML
- zwykły HTML, CSS i JavaScript
- bez procesu budowania
- bez frameworka
- bez zewnętrznych zasobów wymaganych podczas gry

Dzięki temu można trzymać grę na komputerze, pendrivie albo w dowolnym innym miejscu i uruchamiać ją całkowicie offline.
