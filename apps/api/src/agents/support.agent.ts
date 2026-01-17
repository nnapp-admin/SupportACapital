import { getConversationHistory } from '../tools/conversation.tools'

export async function supportAgent(userId: string) {
    return await getConversationHistory(userId)
}
