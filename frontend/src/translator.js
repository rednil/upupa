const translations = {
	'#/overview': 'Übersicht',
	'#/status': 'Status',
	'#/calendar': 'Kalender',
	'#/users': 'Benutzer',
	'#/map': 'Karte',
	'#/config': 'Konfiguration',
	'#/inspection': 'Inspektion',
	"NAME": "Name",
	"STATE_EMPTY": "Leer",
	"STATE_NEST_BUILDING": "Nestbau",
	"STATE_NEST_READY": "Legebereit",
	"STATE_EGGS": "Eier",
	"STATE_BREEDING": "Brütend",
	"STATE_NESTLINGS": "Nestlinge",
	"STATE_FAILURE": "Misserfolg",
	"STATE_SUCCESS": "Erfolg",
	"BAND_STATUS_FEMALE": "Beringung Altvögel",
	"BAND_STATUS_NESTLINGS": "Beringung Nestlinge",
	"BOXES": "Nistkästen",
	"LAST_INSPECTION": "Letzte Inspektion",
	"STATUS": "Status",
	"SPECIES": "Vogelart",
	"BOXES.NAME": "Beschriftung",
	"BOXES.LAT": "Breitengrad",
	"BOXES.LON": "Längengrad",
	"USERS.USERNAME": "Benutzername",
	"USERS.PASSWORD": "Passwort",
	"USERS.ROLE.USER": "USER",
	"USERS.ROLE.ADMIN": "ADMIN",
	"USERS.ROLE": "Funktion"
}

export function translate(str){
	return translations[str] || str
}