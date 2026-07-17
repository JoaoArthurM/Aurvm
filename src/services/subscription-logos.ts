import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'

export type LogoSuggestion = { icon: string; label: string; preview: string; multicolor: boolean }
const API = 'https://api.iconify.design'
const memory = new Map<string,string>()

const iconUrl = (icon: string) => {
  const [prefix,name] = icon.split(':')
  return `${API}/${prefix}/${name}.svg?width=64&height=64&box=1`
}

export const subscriptionLogos = {
  async search(query: string): Promise<LogoSuggestion[]> {
    const raw=query.trim(); if(raw.length<2)return []
    const term=raw.replace(/\b(premium|assinatura|plano|mensal|anual)\b/gi,'').trim()||raw
    const response=await fetch(`${API}/search?query=${encodeURIComponent(term)}&prefix=logos&limit=32`)
    if(!response.ok)throw new Error('Não foi possível buscar logos coloridas')
    const result=await response.json() as {icons:string[]}
    const normalized=term.toLowerCase().replace(/[^a-z0-9]/g,'')
    return (result.icons??[]).map(icon=>{const name=icon.split(':')[1];return{icon,label:name.replace(/-icon$/,'').replace(/-/g,' '),preview:iconUrl(icon),multicolor:true}}).sort((a,b)=>Number(b.label.replace(/\s/g,'')===normalized)-Number(a.label.replace(/\s/g,'')===normalized)).slice(0,12)
  },
  async save(subscriptionId:string,icon:string){
    const response=await fetch(iconUrl(icon));if(!response.ok)throw new Error('Não foi possível baixar a logo')
    const svg=await response.text();const file=`logos/${subscriptionId}.svg`
    await Filesystem.mkdir({path:'logos',directory:Directory.Data,recursive:true}).catch(()=>undefined)
    await Filesystem.writeFile({path:file,data:svg,directory:Directory.Data,encoding:Encoding.UTF8,recursive:true})
    memory.set(file,`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
    return file
  },
  async source(file:string,icon?:string){
    const cached=memory.get(file);if(cached)return cached
    try{const result=await Filesystem.readFile({path:file,directory:Directory.Data,encoding:Encoding.UTF8});const text=String(result.data);const src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;memory.set(file,src);return src}
    catch{if(icon){await this.save(file.split('/').pop()!.replace('.svg',''),icon);return memory.get(file)??iconUrl(icon)}return ''}
  },
  async remove(file?:string){if(!file)return;memory.delete(file);await Filesystem.deleteFile({path:file,directory:Directory.Data}).catch(()=>undefined)},
  fallback(icon:string){return iconUrl(icon)},
  isNative:Capacitor.isNativePlatform(),
}
