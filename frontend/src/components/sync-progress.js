import { LitElement, html, css } from 'lit'
import { pm } from '../projectManager'

export class SyncProgress extends LitElement {

  static get properties() {
    return {
			syncHandler: { type: Object }
    }
  }

  static get styles() {
    return css`
			:host{
				display: flex;
				flex-direction: column;
			}
			progress{
				width: 100%;
			}
    `
  }
	constructor(){
		super()
		this.progress = {
			push: 0,
			pull: 0
		}
	}

	async subscribe(){
		if(this.syncHandler){
			this.syncHandler
			.on('change', ({change, direction}) => {
				const { docs_read, pending } = change
				this.progress[direction] = docs_read / (docs_read + pending) * 100
				this.requestUpdate()
			})
		}
	}

	updated(changed){
		if(changed.has('syncHandler')) this.subscribe()
	}

  render() {
    return html`
			<label for="pull">Lesen</label>
			<progress id="pull" max="100" value=${this.progress.pull}></progress>
			<label for="push">Schreiben</label>
			<progress id="push" max="100" value=${this.progress.push}></progress>
    `
  }
}

customElements.define('sync-progress', SyncProgress)
