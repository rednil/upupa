export const map = doc => {
	if (doc.type == 'inspection') {
		const date = new Date(doc.date)
		emit([doc.box_id, date.getFullYear(), date.getMonth()+1, date.getDate()]); 
	} 
}
export const view = {
	map: map.toString(),
}

export default view