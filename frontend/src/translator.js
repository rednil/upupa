const translations = {
	'#/OVERVIEW': 'Übersicht',
	'#/STATUS': 'Status',
	'#/CALENDAR': 'Kalender',
	'#/CONFIG': 'Konfiguration',
	'#/INSPECTION': 'NK-Kontrolle',
	'#/ABOUT': 'Über Upupua',
	"BANDINGWINDOWSTART": "Beringung möglich ab",
	"BANDINGWINDOWEND": "Beringung möglich bis",
	"BAND_STATUS_PARENTS": "Beringung Altvögel",
	"BAND_STATUS_NESTLINGS": "Beringung Nestlinge",
	"BOXES": "Nistkästen",
	"BOXES.NAME": "Beschriftung",
	"BOXES.LAT": "Breitengrad",
	"BOXES.LON": "Längengrad",
	"CLUTCHSIZE": "Gelegegröße",
	"DATE": "Datum",
	"INSPECTION.EGGS": "Anzahl Eier",
	"INSPECTION.NESTLINGS": "Anzahl lebender Nestlinge",
	"INSPECTION.NESTLINGSBANDED": "Anzahl beringter Nestlinge",
	"NAME": "Name",
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