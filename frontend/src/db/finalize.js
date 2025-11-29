import { uuid } from "./uuid"
import { userPrefix } from "./users"

export function finalize(item){
	const now = new Date()
	if(!item.type) throw('MISSING_TYPE')
	if(item._id) {
		item.changedAt = now
	}
	else {
		item._id = item.type == 'user'
		? `${userPrefix}:${user.name}`
		: `${item.type}-${uuid()}`
		item.createdAt = now
	}
	if(item.type == 'user' && !user.roles) user.roles = []
	item.user_id = mcp.project.session.userCtx.name
	return item
}