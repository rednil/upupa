import { LitElement, html } from 'lit'

export class ButtonExportSvg extends LitElement {
	static get properties() {
		return {
			name: { type: String } 
		}
	}
	constructor(){
		super()
		this.name = 'chart.svg'
	}
	render() {
		return html`
			<button @click=${this.exportSvgCb}>Export SVG</button>
		`
	}
	exportSvgCb(){
		let node = this
		let svgElement
		do{
			svgElement = node.querySelector('figure > svg')
			node = node.parentNode
		}
		while (!svgElement && node)
		this.exportSvg(svgElement);
	}
	exportSvg(svgElement){
		// Holen des SVG-Inhalts als String
		const svgString = new XMLSerializer().serializeToString(svgElement);

		// Umwandeln des Strings in ein Blob
		const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });

		// Temporäre URL erstellen
		const url = URL.createObjectURL(blob);

		// Unsichtbaren Download-Link erstellen und klicken
		const a = document.createElement("a");
		a.href = url;
		a.download = this.name
		document.body.appendChild(a); // Muss dem Dokument hinzugefügt werden, um klickbar zu sein
		a.click();

		// Aufräumen: URL freigeben und Element entfernen
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
}

customElements.define('button-exportsvg', ButtonExportSvg)
