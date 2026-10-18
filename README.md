# Studioflow

Studioflow je portfolio projekt za online naručivanje u frizerskom salonu. Ideja je pomoći salonima da smanje broj poziva i klijentima olakšati rezervaciju termina.

## Trenutna verzija

Ovo je responzivni front-end prototip izrađen u običnom HTML-u, CSS-u i JavaScriptu — bez instalacije i dodatnih paketa.

- Odabir između frizerskih, brijačkih i kozmetičkih usluga, datuma i slobodnog termina
- Raspored dostupnosti po djelatnici koji uračunava 5 minuta za pospremanje te punih 8 minuta odmora nakon pospremanja
- Salonski pregled cjelodnevnog rasporeda i ručni upis internih rezervacija
- Sažetak rezervacije koji se ažurira tijekom odabira
- Unos kontaktnih podataka i prikaz potvrde
- Zasebni cjenici za ženske frizure, muška šišanja i kozmetičke tretmane
- Lokalne fotografije u mapi `images/`
- Prilagodba za mobitel, tablet i desktop
- Osnovna pristupačnost: skip link, vidljiv fokus, tipkovnički izbornik i oznake za dinamičke kontrole
- Jedinstveni naslovi/opisi stranica i Open Graph metapodaci
- Demo prijava s odvojenim klijentskim i salonskim dashboardom te pregledom rezervacija

Fotografije u `images/` preuzete su s Unsplasha; izvori su navedeni u `images/README.md`. Slike se učitavaju lokalno. Google Fonts koriste mrežnu vezu, a preglednik može prikazati zamjenske fontove ako nisu dostupni.

Stranice imaju jedinstvene naslove i meta opise na hrvatskom te `robots.txt`. Prije javne objave postavi stvarnu domenu, a zatim dodaj canonical URL-ove i `sitemap.xml` s apsolutnim URL-ovima. Nemoj objaviti demo podatke kao stvarne poslovne podatke.

Pristupačnost je poboljšana prema uobičajenim WCAG smjernicama, ali ovo nije formalna certifikacija. Prije stvarne upotrebe provjeri stranice i s čitačem ekrana, tipkovnicom i stvarnim korisnicima. Posebno potvrdi ima li salon fizički pristup bez stepenica i prilagođene sadržaje — web stranica to trenutno ne tvrdi.

### Pokretanje

Otvori `index.html` u pregledniku. Za ugodniji razvoj možeš koristiti VS Code ekstenziju Live Server.

> Rezervacije demo klijenta spremaju se u `localStorage` ovog preglednika kako bi bile vidljive na klijentskom i salonskom dashboardu u istom pregledniku/originu. Ne šalju se salonu i ne sinkroniziraju se s drugim uređajima, profilima preglednika ili privatnim prozorima. Brisanjem podataka web-mjesta brišu se i demo rezervacije.

Cjenici su orijentacijski demo iznosi za zagrebački salon, a ne potvrđeni komercijalni cjenik. Konačne cijene treba uskladiti sa stvarnim salonima i troškovima.

### Demo prijava

Pokreni stranicu preko Live Servera, zatim otvori `prijava.html` ili odaberi **Prijava** u navigaciji:

- Klijent: `ana@studioflow.hr` / `StudioflowUser26!`
- Admin salona: `admin@studioflow.hr` / `StudioflowAdmin26!`

Ovo je samo prototip. Računi su fiktivni i provjera lozinke se odvija u JavaScriptu; sesija se čuva u `sessionStorage`, a rezervacije u `localStorage`. Nema stvarne baze, sigurnog backend-a, registracije, oporavka lozinke ni stvarne kontrole pristupa. Admin i klijent mogu vidjeti rezervacije samo ako koriste isti preglednik i origin, uz odgovarajuću demo prijavu u svojoj kartici. Ne koristi stvarne lozinke ni osobne podatke i nemoj ovaj mock objaviti kao autentifikaciju ili rezervacijski sustav spreman za produkciju.

## Moguća nadogradnja

1. Doraditi izgled i sadržaj prema stvarnom salonu.
2. Dodati backend i bazu za termine, klijente i više salona.
3. Uvesti obavijesti e-mailom ili SMS-om i upravljanje rezervacijama za salon.
4. Kasnije dodati AI asistenta koji odgovara na česta pitanja i pomaže pri rezervaciji.
