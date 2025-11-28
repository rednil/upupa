import { LitElement, html } from 'lit'
import { translate } from '../translator'
import './dialog'

export class PopupConfirm extends LitElement {
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
				secondary="Cancel"
				discard="secondary"
				head="Bestätigung"
				@discard=${() => this.dispatchEvent(new Event('cancel'))}
				@primary=${() => this.dispatchEvent(new Event('ok'))}
			>
				<div>${this.message}</div>
      </app-dialog>
		`
	}
}

customElements.define('popup-confirm', PopupConfirm)

export const confirm = async (message) => {
  return new Promise((resolve) => {
    const node = document.createElement('popup-confirm')
    node.message = message
    node.addEventListener('cancel', () => {
      node.remove()
      resolve(false)
    }, { once: true })
		node.addEventListener('ok', () => {
      node.remove()
      resolve(true)
    }, { once: true })
    document.body.appendChild(node)
  })
}