
import { LitElement, html, css } from 'lit'
import './view-object'
import { translate } from '../translator'
const formatter = (key, value) => {
	let result = value
	switch(key){
		case 'instance_start_time':
			result = new Date(Number(value+'000')).toLocaleString()
			break
	}
	if(result.toString().length > 20) result = result.toString().slice(0, 20) + ' ...' 
	return result
}

export class ViewDb extends LitElement {
	static get properties() {
		return {
			db: { type: Object },
			label: { type: String },
			deletable: { type: Boolean }
		}
	}
	static get styles() {
		return css`
			:host > div {
				display: flex;
				justify-content: space-between;
			}
			label {
				//display: flex;
        //justify-content: center;
        font-weight: bold;
      }
			
		`
	}
	constructor(){
		super()
		this.info = {}
		this.deletable = false
	}
	render() {
		if(!this.info) return
		return [
			html`
				<div>
					<label>${this.label}</label>
					${
						this.info.adapter == 'indexeddb'
						? html`<button @click=${this.deleteCb}>Delete</button>` 
						: html`<button @click=${this.logoutCb}>Logout</button>` 
					}
				</div>
			`,
			this.renderEntry('db_name', this.info.db_name),
			this.renderEntry('hostname', this.info.host?.name),
			this.renderEntry('doc_count', this.info.doc_count),
			this.renderDetails()
		]
	}
	renderEntry(key, value){
		return value ? html`
			<div>
				<span>${translate(key)}</span>
				<span>${value}</span>
			</div>
		` : ''
	}
	
	renderDetails(){
		return html`
			<details>
				<summary>Details</summary>
				<view-object .object=${this.info} .formatter=${formatter}></view-object> 
			</details>
			
		`
	}
	deleteCb(){
		this.dispatchEvent(new CustomEvent('delete'))
	}
	async logoutCb(){
		const response = await this.db.logout()
    console.log('logout response', response)
	}
	updated(changed){
		if(changed.has('db')) this.fetchDbInfo()
	}
	async fetchDbInfo(){
		if(this.db.info){
			try{
				this.info = await this.db.info()
				//this.name = this.info.db_name
				const hostMatch = this.info.host?.match(/(\w+):\/\/([\w\-\.]+)(:(\d+))?(.*)/)
				if(hostMatch){
					const [all, protocol, name, allPort, port, path] = hostMatch
					this.info.host = {protocol, name, port, path }
				}
			}catch(error){
				this.info = error
			}
		}
		else this.info = this.db
		this.requestUpdate()
	}
}

customElements.define('view-db', ViewDb)
