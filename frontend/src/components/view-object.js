
import { LitElement, html, css } from 'lit'

export class ViewObject extends LitElement {
	static get properties() {
		return {
			object: { type: Object },
			formatter: { type: Object },
			prefix: { type: String }
		}
	}
	static get styles() {
		return css`
			
			:host {
				display: flex;
				flex-direction: column;
				padding-left: 1em;
			}
			div {
				display: flex;
				justify-content: space-between;
			}

		`
	}
	constructor(){
		super()
		this.formatter = value => value
		//this.prefix = ''
	}
	render() {
		return this.renderObject(this.object)
	}
	renderObject(obj){
		return Object.entries(obj).map(([key, value]) => {
			const keyStr = this.prefix ? `${this.prefix}.${key}` : key
			switch(typeof value){
				case 'object':
					return html`
						<details>
							<summary>${key}</summary>
							<view-object .object=${value} .formatter=${this.formatter} prefix=${keyStr}></view-object>
						</details>
					`
				default:
					return html`
						<div>
							<span>${key}</span>
							<span>${this.formatter(keyStr, value)}</span>
						</div>
					`
			}		
		})
	}
}

customElements.define('view-object', ViewObject)
