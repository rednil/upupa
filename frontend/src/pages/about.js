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
			</div>
			
		`
	}
	
}
	
customElements.define('page-about', PageAbout)
