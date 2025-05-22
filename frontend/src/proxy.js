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
			if(component && response.status == 404){
				console.log('dispatchEvent')
				component.dispatchEvent(new CustomEvent('fetch-error', {
					detail: response,
					bubbles: true,
					composed: true 
				}))
			} 
			console.log('response', response.status)
			//.then(response => response.json())
		}
		catch(e){
			console.log('e', e)
		}
		
	}
}

function getQueryString(query={}){
	const entries = Object.entries(query)
	if(!entries.length) return ''
	return entries.reduce((queryStr, [key, value]) => queryStr + `${key}=${value}`, '?')
}
export const proxy = new Proxy() 