import { html, css, LitElement } from 'lit'
import { mcp } from '../mcp'
import '../view/db'

export class PageDatabase extends LitElement {
  
  static get properties() {
    return {
      
    }
  }

  static get styles() {
    return css`
      :host {
				flex:1;
        display: flex;
        justify-content: center;
        overflow-y: auto;
        
      }
      :host > div {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 30em;
      }
      
      view-db {
        padding: 1em;
      }
			
    `
  }
 

  

  render() {
    return html`
      <div>
        <view-db .db=${mcp.db('project')} label="projectDB" deletable @delete=${this.deleteCb}></view-db>
        ${this.renderProject()}
      </div>
    `
  }
  renderProject(){
    if(!mcp.project) return ''
    return html`
      ${['localDB', 'remoteDB', 'userDB'].map(db => html`
        <view-db 
          .db=${mcp.project[db]}
          label=${db}
          .deletable=${db!='remoteDB'}
          @delete=${this.deleteCb}
          @logout=${this.logoutCb}
        ></view-db>
      `)}
      
    `
  }
  
  async deleteCb(evt){
    const {label, db, info} = evt.target
    //console.log(evt.target.label, db)
    const response = await db.destroy()
    console.log('destroy response', response)
    if(label == 'local'){
      const dbs = await window.indexedDB.databases()
      dbs.forEach(db => { 
        //console.log('db', db)
        if(db.name.startsWith(`_pouch_${info.db_name}-`)){
          console.log('delete', db.name)
          window.indexedDB.deleteDatabase(db.name)
        }
        
      })
    }
    window.location.reload()
  }
  logoutCb(){
    mcp.project.logout()
  }
  async cleanupViews(){
    const response = await getLocalDb().viewCleanup()
    console.log('viewCleanup response', response)
    
  }

}

customElements.define('page-database', PageDatabase)
