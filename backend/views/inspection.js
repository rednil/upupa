export default function(doc) {
	if (doc.type == 'inspection') {
		const date = new Date(doc.date)
		emit([doc.box_id, date.getFullYear(), date.getMonth()+1, date.getDate()]); 
	} 
}