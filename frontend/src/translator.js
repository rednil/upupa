const translations = {
	"NAME": "Name",
	"STATE_EMPTY": "Leer",
	"STATE_NEST_BUILDING": "Nestbau",
	"STATE_NEST_READY": "Legebereit",
	"STATE_EGGS": "Eier",
	"STATE_BREEDING": "Brütend",
	"STATE_NESTLINGS": "Nestlinge",
	"BAND_STATUS_FEMALE": "Beringungsstatus Weibchen",
	"BAND_STATUS_NESTLINGS": "Beringungsstatus Nestlinge",
	"BOXES": "Nistkästen",
	"LAST_INSPECTION": "Letzte Inspektion",
	"STATUS": "Status"
}

export function translate(str){
	return translations[str] || str
}