'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('SESOwner',Object.freeze({generate:data=>ipcRenderer.invoke('ses-owner:generate',data),request:()=>ipcRenderer.invoke('ses-owner:request'),issue:data=>ipcRenderer.invoke('ses-owner:issue',data),list:()=>ipcRenderer.invoke('ses-owner:list'),export:data=>ipcRenderer.invoke('ses-owner:export',data),backup:()=>ipcRenderer.invoke('ses-owner:backup'),restore:()=>ipcRenderer.invoke('ses-owner:restore')}));
