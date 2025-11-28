
import { ConfigBase } from './base.js'

export class EditProject extends ConfigBase {
	render() {
		return [
			this.renderInput('name'),
			this.renderInput('remoteDB'),
			this.renderNote()
		]
	}
}

customElements.define('config-project', EditProject)
