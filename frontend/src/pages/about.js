import { html, css } from 'lit'
import { Page } from './base'

const dbOptions = [
	
	'https://couchdb.chr.ddnss.de/upupa',
	'http://localhost:5984/dev',
	window.location.origin + '/api/couch/db',
]
export class PageAbout extends Page {
	static get styles() {
		return css`
      :host {
				flex:1;
        display: flex;
        align-items: center;
        justify-content: center;
				flex-direction: column;
      }
      :host > div {
       width: 100%;
			 max-width: 20em;
      }
			:host > div > div {
				display: flex;
				flex-direction: row;
				justify-content: space-between
			}
     
			
    `
  }
	render() {
		return html`
			
			<div>
				<div><span>Version</span><span>__APP_VERSION__</span></div>
				<div>
				<label for="db">Datenbank</label>
				<select id="db" .value=${this.proxy.dbUrl} @change=${this.dbChangeCb}>
					${dbOptions.map(option => html`
						<option .selected=${option == this.proxy.dbUrl} .value=${option}>${option}</option>
					`)}
				</select>
			</div>
			</div>
			
		`
	}
	dbChangeCb(evt){
		console.log('db', evt.target.value)
		this.proxy.setDb(evt.target.value)
	}
}
	
customElements.define('page-about', PageAbout)
