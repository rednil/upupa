import { LitElement, html, css } from 'lit'
import { translate } from '../translator'
import { Proxy } from '../proxy'
const PROJECT = 'SETTINGS.PROJECT'
export class SelectProject extends LitElement {

  static get properties() {
    return {
      projects: { Type: Array },
			value: { Type: String }
    }
  }

  static get styles() {
    return css`
			select {
				border: 0;
			}
			
    `
  }
	constructor(){
		super()
		this.proxy = new Proxy()
		this.projects = []
		this.value = localStorage.getItem(PROJECT)
		this.fetchData()
		console.log('subscribe', this.proxy.projectDB.changes)
		this.proxy.projectDB.changes({since: 'now', live: true})
		.on('change', change => {
			console.log('project db change', change)
		})
		.on('error', err => {
			console.log('live change feed error', err)
		})
	}
	async fetchData(){
		let response = await this.proxy.projectDB.allDocs({include_docs: true})
		if(!response.total_rows){
			const writeResponse = await this.proxy.projectDB.put({
				_id: `project-${this.proxy.uuid()}`,
				name: 'Upupa',
				type: 'project',
				remoteDB: 'upupa'
			})
			console.log('writeResponse', writeResponse)
			response = await this.proxy.projectDB.allDocs({include_docs: true})
		}
		this.projects = response.rows.map(({doc}) => doc)
		if(!this.value || !this.projects.find(project => project._id == this.value)) {
			this.value = this.projects[0]._id
			localStorage.setItem(PROJECT, this.value)
		}	
		console.log('projects', this.projects)
	}
  render() {
    return html`
      <select @change=${this.changeCb} .value=${this.value}>
				${this.projects.map(({_id, name, username}) => html`
					<option
						.value=${_id}
						.selected=${_id==this.value}
						>${name}</option>
				`)}
				<option>${translate('LOGOUT')}</option>
			</select>
    `
  }
	
	changeCb(evt){
		this.value = evt.target.value
		this.dispatchEvent(new CustomEvent('change'))
	}
}

customElements.define('select-project', SelectProject)
