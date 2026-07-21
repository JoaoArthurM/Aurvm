import { Capacitor, registerPlugin } from '@capacitor/core'

type SystemBarsPlugin = {
  setAppearance(options:{color:string;light:boolean}):Promise<void>
}

const SystemBars=registerPlugin<SystemBarsPlugin>('AurvmSystemBars')

export function syncSystemBars(theme:'light'|'dark'){
  if(!Capacitor.isNativePlatform())return
  const light=theme==='light'
  void SystemBars.setAppearance({
    color:light?'#F7F4F1':'#0C0C10',
    light,
  }).catch(()=>undefined)
}
