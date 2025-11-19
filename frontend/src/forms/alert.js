import { LitElement, html } from 'lit'
import { translate } from '../translator'
import '../app-dialog'

export class PopupAlert extends LitElement {
	static get properties() {
		return {
			message: { type: String },
		}
	}
	render() {
		return html`
			<app-dialog
				open
				primary="OK"
				discard="primary"
				head="Achtung!"
				@discard=${() => this.dispatchEvent(new Event('discard'))}
			>
				<div>${this.message}</div>
      </app-dialog>
		`
	}
}

customElements.define('popup-alert', PopupAlert)

export const alert = async (message) => {
  return new Promise((resolve) => {
    const alertNode = document.createElement('popup-alert')
    alertNode.message = message
    alertNode.addEventListener('discard', () => {
      alertNode.remove()
      resolve()
    }, { once: true })
    document.body.appendChild(alertNode)
  })
}