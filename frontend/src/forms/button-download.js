import { LitElement, html } from 'lit'

export class ButtonDownload extends LitElement {
	static get properties() {
		return {
			url: { type: String },
		}
	}
	render() {
		return html`
			<a href="/api/download/${encodeURIComponent(this.url)}" download><button>Export</button></a>
		`
	}
}

customElements.define('button-download', ButtonDownload)
