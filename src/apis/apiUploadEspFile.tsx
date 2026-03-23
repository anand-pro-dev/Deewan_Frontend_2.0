
import { deleteDataWithToken,   getDataWithToken, postDataWithToken, postFormDataWithToken } from "./ApiCallFun";


const uploadDeviceFile = async   (formData: any): Promise<any> =>  {
 const data = await postFormDataWithToken<any>('/files/upload', formData);
  return data;
};


const deleteDeviceFile = async   (name: any): Promise<any> =>  {
  const data = await deleteDataWithToken<any>(`/files/${name}` );
  return data;
};

const getAllEspDevices = async (): Promise<any> => {
  const data = await getDataWithToken<any>('/files' );
  return data;
};
 


const searchDevice = async (query: string): Promise<any> => {

  const data = await getDataWithToken<any>(`/files/search/${encodeURIComponent(query)}`);

  return data;
};




const moveToAnotherUser = async   (fields: any): Promise<any> =>  {
 const data = await postDataWithToken<any>('move/moveDevice', fields);
  return data;
};


export { uploadDeviceFile, deleteDeviceFile , getAllEspDevices , searchDevice , moveToAnotherUser};

