const translations = {
	'#/START': 'Startseite',
	'#/OVERVIEW': 'Übersicht',
	'#/STATUS': 'Status',
	'#/CALENDAR': 'Kalender',
	'#/CONFIG': 'Konfiguration',
	'#/INSPECTION': 'NK-Kontrolle',
	'#/ABOUT': 'Über Upupua',
	"BANDINGWINDOWSTART": "Beringung ab",
	"BANDINGWINDOWEND": "Beringung bis",
	"BAND_STATUS_PARENTS": "Beringung Altvögel",
	"BAND_STATUS_NESTLINGS": "Beringung Nestlinge",
	"BOXES": "Nistkästen",
	"BOX.NAME": "Beschriftung",
	"BOX.LAT": "Breitengrad",
	"BOX.LON": "Längengrad",
	"BOX.VALIDFROM": "Aufgehängt am",
	"BOX.VALIDUNTIL": "Abgehängt am",
	"CLUTCHSIZE": "Gelegegröße",
	"DATE": "Datum",
	"EGGS": "Eier",
	"STATE_NESTLINGS.INSPECTION.NESTLINGS": "Lebende Nestlinge",
	"STATE_SUCCESS.INSPECTION.NESTLINGS": "Ausgeflogene Nestlinge",
	"INSPECTION.NESTLINGSBANDED": "Anzahl beringter Nestlinge",
	"INSPECTION.NESTLINGSAGE": "Alter der Nestlinge (Tage)",
	"NAME": "Name",
	"PREDATOR": "Prädator",
	"OCCUPATOR": "Eindringling",
	"STATE_EMPTY": "Leer",
	"STATE_NEST_BUILDING": "Nestbau",
	"STATE_NEST_READY": "Legebereit",
	"STATE_EGGS": "Eier",
	"STATE_BREEDING": "Brütend",
	"STATE_NESTLINGS": "Nestlinge",
	"STATE_FAILURE": "Misserfolg",
	"STATE_SUCCESS": "Erfolg",
	"STATE_OCCUPIED": "Okkupiert",
	"STATE_ABANDONED": "Verlassen",
	
	"LAST_INSPECTION": "Letzte Inspektion",
	"PERPETRATOR": "Eindringling",
	"PREDATION.PERPETRATOR": "Prädator",
	"NEST_OCCUPATION.PERPETRATOR": "Okkupator",
	"STATUS": "Status",
	"SPECIES": "Vogelart",
	
	"USERS.USERNAME": "Benutzername",
	"USERS.PASSWORD": "Passwort",
	"USERS.ROLE.USER": "USER",
	"USERS.ROLE.ADMIN": "ADMIN",
	"USERS.ROLE": "Funktion",
	"PREDATION": "Prädation",
	"NEST_OCCUPATION": "Nest-Okkupation",
	"PARENT_MISSING": "Nest aufgegeben",
	"UNKNOWN": "Unbekannt",
	"HATCHDATE": "Schlüpfdatum",
	"BREEDINGSTART": "Brutbeginn",
	"LAYINGSTART": "Legebeginn"
}

export function translate(str){
	if(str == null) return ''
	var translation
	var arr = str.toUpperCase().split('.')
	while (arr.length && !translation) {
		translation = translations[arr.join('.')]
		arr.shift()
	}
	return translation || str
}