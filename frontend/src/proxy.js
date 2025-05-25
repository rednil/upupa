class Proxy {
	fetch(requests){
		return Promise.all(requests.map(async ({path, query={}}) => {
			const response = await fetch(`/api/${path}${getQueryString(query)}`)
			const json = await response.json()
			return json
		}))
	}
	async set( collection, item, component ){
		try{
			const response = await fetch(`/api/${collection}/${item._id || ''}`, {
				method: item._id ? 'PUT' : 'POST',
				headers:{
					'Content-Type':'application/json'
				},
				body: JSON.stringify(item)
			})
			this.checkForError(response)
			return await response.json()
		}
		catch(e){
			console.log('e', e)
		}
		
	}
	async delete(collection, item, component){
		try{
			const response = await fetch(`/api/${collection}`, {
				method: 'DELETE',
				headers:{
					'Content-Type':'application/json'
				},
				body: JSON.stringify(item)
			})
			this.checkForError(response)
			return await response.json()
		}
		catch(e){
			console.log('e', e)
		}
	}
	checkForError(response, component){
		if(component && response?.status > 400){
			component.dispatchEvent(new CustomEvent('fetch-error', {
				detail: response,
				bubbles: true,
				composed: true 
			}))
		} 
	}
}


function getQueryString(query={}){
	const entries = Object.entries(query)
	if(!entries.length) return ''
	return entries.reduce((queryStr, [key, value]) => queryStr + `${key}=${value}`, '?')
}
export const proxy = new Proxy() 