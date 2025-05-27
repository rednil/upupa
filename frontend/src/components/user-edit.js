
import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js' 

export class UsersEdit extends LitElement {
	static get properties() {
			return {
				item: { type: Object },
			}
		}
		static get styles() {
			return css`
				:host > * {
					display: flex;
					justify-content: space-between;
				}
			`
		}
		render() {
			return [
				this.renderInput('username'),
				this.renderInput('password', this.item._id ? 'beibehalten' : ''),
				html`
					<div>
						<label for="rolw">${translate('USERS.ROLE')}</label>
						<select id="role" label=${this.getLabel('role')} .value=${this.item?.role || 'USER'}>
							<option value='USER'>${translate('USERS.ROLE.USER')}</option>
							<option value='ADMIN'>${translate('USERS.ROLE.ADMIN')}</option>   
						</select>
					</div>
				`
			]
		}
		renderInput(prop, placeholder){
			return html`
				<div>
					<label for=${prop}>${this.getLabel(prop)}</label>
					<input id=${prop} placeholder=${placeholder} .value=${this.item[prop] || ''} @change=${this.changeCb}>
				</div>
			`
		}
		getLabel(prop){
			return translate(`USERS.${prop.toUpperCase()}`)
		}
		changeCb(evt){
			const { id, value } = evt.target
			this.item[id] = value
		}
}

customElements.define('users-edit', UsersEdit)
