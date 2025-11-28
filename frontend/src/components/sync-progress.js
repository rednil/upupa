import { LitElement, html, css } from 'lit'

export class SyncProgress extends LitElement {

  static get properties() {
    return {
			project: { type: Object }
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
		this.changeCb = this.changeCb.bind(this)
		this.progress = {
			push: 0,
			pull: 0
		}
	}

	shouldUpdate(){
		return this.project
	}

	subscribe(){
		const { syncHandler } = this.project
		if(syncHandler){
			syncHandler.on('change', this.changeCb)
		}
	}

	changeCb({change, direction}) {
		const { docs_read, pending } = change
		this.progress[direction] = docs_read / (docs_read + pending) * 100
		this.requestUpdate()
	}

	unsubscribe(project){
		project?.syncHandler?.removeListener('change', this.changeCb)
	}

	disconnectedCallback(){
		this.unsubscribe(this.project)
	}

	updated(changed){
		if(changed.has('project')) {
			if(changed.get('project')) this.unsubscribe(changed.get('project'))
			this.subscribe()
		}
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
