export const map = doc =>  {
	if (doc.type == 'box') {
		const validFrom = new Date(doc.validFrom)
		const validUntil = doc.validUntil ? new Date(doc.validUntil) : new Date()
		let startYear = validFrom.getFullYear()
		if(validFrom.getMonth()>5) startYear++
		let endYear = validUntil.getFullYear()
		for(let year = startYear; year <= endYear; year ++){
			emit([year, doc.name], null)
		} 
	}
}

export const view = {
	map: map.toString(),
}

export default view