
import { deleteDataWithToken,   getDataWithToken, postDataWithToken, postFormDataWithToken } from "./ApiCallFun";


const uploadDeviceFile = async   (formData: any): Promise<any> =>  {
 const data = await postFormDataWithToken<any>('/files/upload', formData);
  return data;
};


const deleteDeviceFile = async   (name: any): Promise<any> =>  {
  const data = await deleteDataWithToken<any>(`/files/${name}` );
  return data;
};

const getAllMqttDevices = async (): Promise<any> => {
  const data = await getDataWithToken<any>('/mqtt/all' );
  return data;
};



const getUserAllMqttDevices = async (userId:any): Promise<any> => {
  const data = await getDataWithToken<any>(`/mqtt/user/${userId}` );
  return data;
};



const getMqttDeviceDetails = async (deviceId:any): Promise<any> => {
  const data = await getDataWithToken<any>(`/mqtt/${deviceId}` );
  return data;
};


const  deleteMqttDeviceDetails = async (deviceId:any): Promise<any> => {
  const data = await deleteDataWithToken<any>(`/mqtt/${deviceId}` );
  return data;
};
 



const controlDigitalPin = async (deviceId:any , send : any): Promise<any> => {
  const data = await postDataWithToken<any>(`/mqtt/${deviceId}/channel/control`, send ); 
  return data;
};
 


const searchDevice = async (query: string): Promise<any> => {

  const data = await getDataWithToken<any>(`/files/search/${encodeURIComponent(query)}`);

  return data;
};


const createMqttDevice = async   (formData: any): Promise<any> =>  {
 const data = await postFormDataWithToken<any>('mqtt/create', formData);
  return data;
};



const updateMqttDevice = async   (formData: any, deviceId : any): Promise<any> =>  {
 const data = await postFormDataWithToken<any>(`mqtt/update/${deviceId}`, formData);
  return data;
};


const addMqttSchedule = async   (outputName: any, timeData: any, deviceId : any): Promise<any> =>  {
 const data = await postDataWithToken<any>(`mqtt/schedule/device/${deviceId}/output/${outputName}`, timeData);
  return data;
};


const getChannelHistory = async (
  deviceId: string,
  channelName: string,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate)   params.set("endDate", endDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return await getDataWithToken<any>(`mqtt/${deviceId}/history/channel/${channelName}${query}`);
};

const getSensorHistory = async (
  deviceId: string,
  sensorName: string,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate)   params.set("endDate", endDate);
  const query = params.toString() ? `?${params.toString()}` : "";
  return await getDataWithToken<any>(`mqtt/${deviceId}/history/sensor/${sensorName}${query}`);
};
 


const deteteMqttSchedule = async   ( deviceId : any, outputName: any,  selectIndex: any): Promise<any> =>  {
 const data = await deleteDataWithToken<any>(`mqtt/schedule/device/${deviceId}/output/${outputName}/${selectIndex}`);
  return data;
};



export { uploadDeviceFile, getMqttDeviceDetails, deleteDeviceFile ,controlDigitalPin,  getAllMqttDevices ,
   searchDevice , createMqttDevice, getChannelHistory, getSensorHistory,
   getUserAllMqttDevices, updateMqttDevice , addMqttSchedule, deteteMqttSchedule , deleteMqttDeviceDetails };

