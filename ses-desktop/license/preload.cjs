'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('SESActivation',Object.freeze({
  info:()=>ipcRenderer.invoke('ses-license:info'),
  copyDevice:()=>ipcRenderer.invoke('ses-license:copy'),
  saveRequest:()=>ipcRenderer.invoke('ses-license:request'),
  importLicense:()=>ipcRenderer.invoke('ses-license:import'),
  launch:()=>ipcRenderer.invoke('ses-license:launch'),
}));
