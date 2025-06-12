const translations = {
	'#/overview': 'Übersicht',
	'#/status': 'Status',
	'#/calendar': 'Kalender',
	'#/users': 'Benutzer',
	'#/map': 'Karte',
	'#/config': 'Konfiguration',
	'#/inspection': 'Inspektion',
	'#/about': 'Über Upupua',
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
	"BAND_STATUS_PARENTS": "Beringung Altvögel",
	"BAND_STATUS_NESTLINGS": "Beringung Nestlinge",
	"BOXES": "Nistkästen",
	"LAST_INSPECTION": "Letzte Inspektion",
	"PERPETRATOR": "Eindringling",
	"PREDATION.PERPETRATOR": "Prädator",
	"NEST_OCCUPATION.PERPETRATOR": "Okkupator",
	"STATUS": "Status",
	"SPECIES": "Vogelart",
	"BOXES.NAME": "Beschriftung",
	"BOXES.LAT": "Breitengrad",
	"BOXES.LON": "Längengrad",
	"USERS.USERNAME": "Benutzername",
	"USERS.PASSWORD": "Passwort",
	"USERS.ROLE.USER": "USER",
	"USERS.ROLE.ADMIN": "ADMIN",
	"USERS.ROLE": "Funktion",
	"PREDATION": "Prädation",
	"NEST_OCCUPATION": "Nest-Okkupation",
	"PARENT_MISSING": "Nest aufgegeben",
	"UNKNOWN": "Unbekannt"
}

export function translate(str){
	if(str == null) return ''
	var translation
	var arr = str.split('.')
	while (arr.length && !translation) {
		translation = translations[arr.join('.')]
		arr.shift()
	}
	return translation || str
}