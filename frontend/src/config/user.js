
import { html } from 'lit'
import { translate } from '../translator.js' 
import { ConfigBase } from './base.js'

export class EditUser extends ConfigBase {
	
	render() {
		return [
			this.renderInput('name'),
			this.renderInput('password', {placeholder: this.item._id ? 'beibehalten' : ''}),
			//this.renderRoles()		
		]
	}

	renderRoles(){
		return html`
			<div>
				<label for="role">${translate('USERS.ROLE')}</label>
				<select id="role" label=${this.getLabel('role')} .value=${this.item?.role || 'USER'}>
					<option value='USER'>${translate('USERS.ROLE.USER')}</option>
					<option value='ADMIN'>${translate('USERS.ROLE.ADMIN')}</option>   
				</select>
			</div>
		`
	}
		
}

customElements.define('config-user', EditUser)
