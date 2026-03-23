// ApiService.ts
import { deleteDataWithToken, getData, getDataWithToken, postData, postDataWithToken, postFormDataWithToken } from './ApiCallFun';
import { store } from '../store/store';

interface SignInResponse {
  data: { token: any; user: any; };
  success: boolean;
  message: string;
  token?: string;
}

// Helper to get auth info from Redux store
const getAuthInfo = () => {
  const state = store.getState();
  return {
    id: state.auth.user?._id,
    role: state.auth.user?.role,
  };
};

const signInEmPPassApi = async (email: string, password: string): Promise<SignInResponse> => {
  const data = await postData<SignInResponse>('/auth/loginEmPwd', { email, password });
  return data;
};

const signInEmOTPApi = async (email: string, password: string): Promise<SignInResponse> => {
  const data = await postData<SignInResponse>('/auth/login', { email, password });
  return data;
};

const verifiOTPApi = async (email: string, otp: string): Promise<any> => {
  const data = await postData<any>('/auth/verifyOtp', { email, otp });
  return data;
};

const adminAllUserApi = async (): Promise<any> => {
  const { id, role } = getAuthInfo();

  const endpoint =
    role === 'admin'
      ? `/auth/adminAllUsers?adminId=${id}`
      : `/auth/adminAllUsers`;

  const data = await getDataWithToken<any>(endpoint);
  return data;
};

const adminAllAdminApi = async (): Promise<any> => {
  const data = await getDataWithToken<any>('/auth/adminAllAdmins');
  return data;
};

const adminAddUserApi = async (formData: any): Promise<any> => {
  const data = await postFormDataWithToken<any>('/auth/adminCreateUser', formData);
  return data;
};

const adminActiveDeactiveApi = async (id: any): Promise<any> => {
  const data = await postDataWithToken<any>(`auth/admin/toggleUser/${id}`, {});
  return data;
};

const adminDeleteUserApi = async (id: any): Promise<any> => {
  const data = await postDataWithToken<any>(`auth/admin/deleteUser/${id}`, {});
  return data;
};

const adminGetAllDevicesApi = async (email: string, otp: string): Promise<any> => {
  const data = await postData<any>('/auth/adminAllUsers', { email, otp });
  return data;
};

const adminAddDevicesApi = async (formData: any): Promise<any> => {
  const data = await postFormDataWithToken<any>('/device/userDevice', formData);
  return data;
};

const adminGetPublicActiveDeviceApi = async (): Promise<any> => {
  const { id, role } = getAuthInfo();

  const endpoint =
    role === 'admin'
      ? `/device/userDevice?adminId=${id}`
      : `/device/userDevice`;

  const data = await getDataWithToken<any>(endpoint);
  return data;
};

const adminGetUserDeviceApi = async (userId: string): Promise<any> => {
  const data = await getDataWithToken<any>(`/device/userDevice/user/${userId}`);
  return data;
};

const adminSearchDeviceApi = async (query: string): Promise<any> => {
  const { role } = getAuthInfo();

  const endpoint =
    role === 'admin'
      ? `/dashboard/searchAdminDevice?query=${encodeURIComponent(query)}`
      : `/dashboard/searchSuperDevcie?query=${encodeURIComponent(query)}`;

  const data = await getDataWithToken<any>(endpoint);
  return data;
};

const adminSearchUserApi = async (query: string): Promise<any> => {
  const { role } = getAuthInfo();

  const endpoint =
    role === 'admin'
      ? `/dashboard/searchAdminUser?query=${encodeURIComponent(query)}`
      : `/dashboard/searchSuperUser?query=${encodeURIComponent(query)}`;

  const data = await getDataWithToken<any>(endpoint);
  return data;
};

const adminGetDeviceDataApi = async (deviceId: any): Promise<any> => {
  const data = await getDataWithToken<any>(`/device/userDevice/${deviceId}`);
  return data;
};

const adminUpdateUserDeviceApi = async (userId: string, payload: any): Promise<any> => {
  const data = await postFormDataWithToken<any>(`/device/userDevice/${userId}`, payload);
  return data;
};

const adminDeleteUserDeviceApi = async (userId: string): Promise<any> => {
  const data = await deleteDataWithToken<any>(`/device/userDevice/${userId}`);
  return data;
};

const adminDevicesDetailsApi = async (email: string, otp: string): Promise<any> => {
  const data = await postData<any>('/auth/adminAllUsers', { email, otp });
  return data;
};

const adminProfilesApi = async (): Promise<any> => {
  const { id } = getAuthInfo();
  const data = await getData<any>(`/auth/user/getUserProfile/${id}`);
  return data;
};

const updateUserProfileApi = async (formData: any): Promise<any> => {
  const { id } = getAuthInfo();
  const data = await postFormDataWithToken<any>(`auth/user/updateProfile/${id}`, formData);
  return data;
};

const adminAddParameterApi = async (payload: any): Promise<any> => {
  const data = await postDataWithToken<any>('/device/parameter', payload);
  return data;
};

const adminUpdateParameterApi = async (payload: any, id: any): Promise<any> => {
  const data = await postDataWithToken<any>(`/device/parameter/${id}`, payload);
  return data;
};

const adminGetAllParameterApi = async (): Promise<any> => {
 const { id, role } = getAuthInfo();

  const endpoint =
    role === 'admin'
      ? `/device/parameter/admin/${id}`
      : `/device/parameterG`;

  const data = await getDataWithToken<any>(endpoint);
 
  return data;
};

const adminGetParameterDetailsApi = async (id: any): Promise<any> => {
  const data = await getDataWithToken<any>(`/device/parameter/${id}`);
  return data;
};

const adminDeleteParameterApi = async (id: any): Promise<any> => {
  const data = await deleteDataWithToken<any>(`/device/parameter/${id}`);
  return data;
};

const getDeviceLogDataApi = async (id: any): Promise<any> => {
  const data = await getData<any>(`/device/logsG/${id}`);
  return data;
};

const deleteDeviceDataLog = async (id: any): Promise<any> => {
  const data = await deleteDataWithToken<any>(`/device/logs/removelogs/${id}`);
  return data;
};

const getDeviceDataWithTimeDateApi = async (deviceId: string, start: string, end: string): Promise<any> => {
  const url = `/device/logsWithDateTime/${deviceId}?start=${start}&end=${end}`;
  const data = await getData<any>(url);
  return data;
};

const adminUpdateProfileApi = async (deviceId: string, payload: any): Promise<any> => {
  const url = `/auth/user/updateProfileByAdmin/${deviceId}`;
  const data = await postDataWithToken<any>(url, payload);
  return data;
};

const logOuttUsereApi = async (email: string, otp: string): Promise<any> => {
  const data = await postData<any>('/auth/adminAllUsers', { email, otp });
  return data;
};


const verifyToken = async (  token : any ): Promise<any> => {
  const data = await postData<any>('/verify/verifyToken', { token });
  return data;
};

const uploadExcelApi = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return postFormDataWithToken(`/device/logs/updateWithExcel/${id}`, formData);
};

export {
  signInEmPPassApi, adminSearchUserApi, signInEmOTPApi, verifiOTPApi, adminAllUserApi,getDeviceLogDataApi,
  adminAllAdminApi, adminGetAllParameterApi, adminAddParameterApi, adminUpdateUserDeviceApi,
  adminUpdateParameterApi, adminDeleteUserDeviceApi, updateUserProfileApi, adminDeleteUserApi,
  adminGetDeviceDataApi, getDeviceDataWithTimeDateApi, adminAddUserApi, adminActiveDeactiveApi,
  adminGetAllDevicesApi, adminDevicesDetailsApi, adminGetPublicActiveDeviceApi, adminGetUserDeviceApi,
  adminProfilesApi, adminUpdateProfileApi, adminDeleteParameterApi, adminGetParameterDetailsApi,
  uploadExcelApi, adminAddDevicesApi, logOuttUsereApi, adminSearchDeviceApi,
  deleteDeviceDataLog,verifyToken
};