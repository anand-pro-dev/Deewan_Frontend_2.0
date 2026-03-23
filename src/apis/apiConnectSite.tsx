import { deleteDataWithToken,   getDataWithToken, postDataWithToken } from "./ApiCallFun";
import { store } from '../store/store';


// Helper to get auth info from Redux store
const getAuthInfo = () => {
  const state = store.getState();
  return {
    id: state.auth.user?._id,
    role: state.auth.user?.role,
  };
};

 

const createConnectWithOther = async (payload: any,  ) => {
   
  const data = await postDataWithToken<any>(`/otherSite/plateform`, payload , );
  return data;
};


const updateConnectWithOther = async (id: string, payload : any) => {
  const data = await postDataWithToken<any>(`/otherSite/plateform/update/${id}`, payload  );
  return data;
};


 
const getSingleConnectWtithOther = async (id: string) => {
  const data = await getDataWithToken<any>(`/otherSite/plateform/data/${id}`,  );
  return data;
};


const getWebConnectWtithOther = async (id: any) => {
  const data = await getDataWithToken<any>(`/otherSite/plateform/${id}`,  );
//   const data = await getData<any>(`/otherSite/plateform/${id}`,  );
  return data;
};


const getAllDevicesWtithOther = async ( ) => {
  const { id, role } = getAuthInfo();

   const endpoint = 
   role === 'admin' ?   `/otherSite/plateform/admin/${id}`:   `/otherSite/plateform/all` ;

  const data = await getDataWithToken<any>(endpoint);
  return data;
};



const getHWRAAllDevicesWtithOther = async ( ) => {

  const { id, role } = getAuthInfo();

   const endpoint = 
   role === 'admin' ?   `/otherSite/plateform/admin/${id}/hwra` : `/otherSite/plateform/hwra/all` ;

  const data = await getDataWithToken<any>(endpoint);

 
  return data;
};



const getDPCCAllDevicesWtithOther = async ( ) => {

  const { id, role } = getAuthInfo();

   const endpoint = 
   role === 'admin' ?   `/otherSite/plateform/admin/${id}/dpcc` : `/otherSite/plateform/dpcc/all` ;

  const data = await getDataWithToken<any>(endpoint);
 
  return data;
};

 

const  deleteConnectWtithOther = async (id: string) => {
  const data = await  deleteDataWithToken<any>(`/otherSite/plateform/${id}`,  );
//   const data = await getData<any>(`/otherSite/plateform/${id}`,  );
  return data;
};



export { createConnectWithOther,  
  getHWRAAllDevicesWtithOther, getDPCCAllDevicesWtithOther,  updateConnectWithOther,
   deleteConnectWtithOther, getAllDevicesWtithOther, getSingleConnectWtithOther , getWebConnectWtithOther };