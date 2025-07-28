export function parseValue([clutchSize, nestlings, nestlingsBanded, layingStart, breedingStart, hatchDate]){
	return {clutchSize, nestlings, nestlingsBanded, layingStart, breedingStart, hatchDate}
}
export function parseKey([species_id, year, state, occupancy]) {
	return { species_id, year, state, occupancy }
}