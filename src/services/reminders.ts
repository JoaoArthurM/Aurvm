import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { FinancasData } from '../lib/types'

const CHANNEL_ID='aurvm-reminders'
let scheduledIds:number[]=[]

const notificationId=(value:string)=>{
  let hash=2166136261
  for(const char of value){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}
  return Math.abs(hash|0)||1
}
const localDate=(value:string)=>{
  const [year,month,day]=value.split('-').map(Number)
  return new Date(year,month-1,day,9,0,0,0)
}

export const syncReminders=async(data:FinancasData)=>{
  if(!Capacitor.isNativePlatform())return
  try{
    const permission=await LocalNotifications.checkPermissions()
    const granted=permission.display==='granted'?permission:await LocalNotifications.requestPermissions()
    if(granted.display!=='granted')return
    await LocalNotifications.createChannel({id:CHANNEL_ID,name:'Lembretes do Aurvm',description:'Lembretes de cobranças e compromissos',importance:5})
    if(scheduledIds.length)await LocalNotifications.cancel({notifications:scheduledIds.map(id=>({id}))})
    scheduledIds=[]
    if(!data.config.lembrete_mensal)return
    const today=new Date();today.setHours(0,0,0,0)
    const reminders=[
      ...Object.values(data.tabela).flatMap(items=>items.filter(item=>item.lembrete).map(item=>({key:`item:${item.id}`,date:item.lembrete!.data,title:`Lembrete: ${item.label||'item financeiro'}`,body:item.lembrete!.observacao||'Você tem um compromisso financeiro hoje.'}))),
      ...data.emprestimos.pessoas.flatMap(person=>person.lancamentos.filter(item=>item.lembrete).map(item=>({key:`loan:${item.id}`,date:item.lembrete!.data,title:`Cobrança: ${person.nome}`,body:item.lembrete!.observacao||`${item.motivo} · confira este lançamento.`}))),
    ].filter(item=>localDate(item.date)>=today)
    if(!reminders.length)return
    const notifications=reminders.map(item=>({id:notificationId(`${item.key}:${item.date}`),title:item.title,body:item.body,channelId:CHANNEL_ID,schedule:{at:localDate(item.date),allowWhileIdle:true}}))
    await LocalNotifications.schedule({notifications})
    scheduledIds=notifications.map(item=>item.id)
  }catch{
    // Falhas de permissão ou de agendamento não devem impedir a edição dos dados.
  }
}
