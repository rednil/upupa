import { LitElement } from "lit"
import { Proxy } from "../proxy.js"

export class Page extends LitElement {
	constructor(){
		super()
		this.proxy = new Proxy(this)
	}
}
