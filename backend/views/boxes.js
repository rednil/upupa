export const map = doc =>  {
	if (doc.type == 'box') {
		const validFrom = new Date(doc.validFrom)
		const validUntil = doc.validUntil ? new Date(doc.validUntil) : new Date()
		let startYear = validFrom.getFullYear()
		if(validFrom.getMonth()>5) startYear++
		let endYear = validUntil.getFullYear()
		for(let year = startYear; year <= endYear; year ++){
			let name = doc.name
			if(doc.validUntil) {
				const fromYear = validFrom.getFullYear()
				if(fromYear == endYear) name += ` (${fromYear})`
				else {
					const from = `${fromYear.toString().slice(-2)}/${validFrom.getMonth()+1}`
					const to = `${endYear.toString().slice(-2)}/${validUntil.getMonth()+1}`
					name += ` (${from}-${to})`
				}
			}
			emit([year, name], null)
		} 
	}
}

export const view = {
	map: map.toString(),
}

export default view