import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/UiElements/Charts/LineChart";
import BarChart from "./pages/UiElements/Charts/BarChart";
import Calendar from "./pages/UiElements/Calendar";
import BasicTables from "./pages/UiElements/Tables/BasicTables";
import FormElements from "./pages/UiElements/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { Toaster } from "react-hot-toast";
import AllUsersTable from "./pages/AllUsersList/AllUsersList";
import AllAdminTable from "./pages/AllAdminsList/AllAdminList";
import ParameterList from "./pages/Parameters/Parameters";
import MoveDeviceForm from "./pages/MoveDeviceToOther/MoveDeviceToOther";
import DeviceBinFile from "./pages/DeviceBinFile/DeviceBinFile";
import AllHttpDeviceslist from "./pages/All_http_Devices/AllHttpDevices";
import AllOtherPlateFormDevices from "./pages/AllOtherPlateForm/AllOtherPlateForm";
import DeviceList from "./pages/AllUsersList/UserDeviceList";
import DeviceDataDetails from "./pages/All_http_Devices/DeviceDetailsData";
import DeviceCreateForHttp from "./pages/AllUsersList/CreateHttpUserDevice"; // ← ADD THIS (update path to match your actual file)
import ViewOtherSiteDetails from "./pages/AllOtherPlateForm/viewOtherDetails";
import SeeOtherSiteList from "./pages/AllOtherPlateForm/UserSeeOtherList";
import MqttDeviceDetailsView from "./pages/All_Mqtt_devices/mqttDeviceDetiails";
import MqttDevicesScreen from "./pages/All_Mqtt_devices/ALLListVviewMqttDevice";
import SearchResults from "./layout/SearchResults";
import AccountInfo from "./components/UserProfile/AccountInfo";
import UpdateUserProfile from "./pages/AllUsersList/UpdateUserProfile";
import ViewOtherSiteDetailsAdmin from "./pages/AllOtherPlateForm/viewOtherDetailsAdmin";
import DpccrPlateFormDevices from "./pages/AllOtherPlateForm/DpccPage";
import HwraPlateFormDevices from "./pages/AllOtherPlateForm/HwraPage";
import SubscriptionManager from "./pages/subscription/Subscription";

export default function App() {
  return (
    <>
      {/* Global toast support */}
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/allUsers" element={<AllUsersTable />} />
            <Route path="/userDivice" element={<DeviceList />} />
            <Route path="/UpdateUserProfile/:id" element={<UpdateUserProfile />} />
            <Route path="/deviceList/:userId" element={<DeviceList />} />
            <Route path="/deviceCreateForHttp/:userId" element={<DeviceCreateForHttp />} /> {/* ← ADD THIS */}
            <Route path="/DeviceData" element={<DeviceDataDetails />} />
            <Route path="/DeviceData/:deviceId?" element={<DeviceDataDetails />} />
            <Route path="/allAdmins" element={<AllAdminTable />} />
            <Route path="/parameters" element={<ParameterList />} />
            <Route path="/moveDevice" element={<MoveDeviceForm />} />
            <Route path="/deviceBinFile" element={<DeviceBinFile />} />
            <Route path="/allHttpDeviceslist" element={<AllHttpDeviceslist />} />
            <Route path="/allOtherPlateFormDevice" element={<AllOtherPlateFormDevices />} />
            <Route path="/HwraPlateFormDevices" element={<HwraPlateFormDevices />} />
            <Route path="/DpccrPlateFormDevices" element={< DpccrPlateFormDevices/>} />
            <Route path="/view_other_details" element={<ViewOtherSiteDetails />} />
            <Route path="/view_other_details_admin" element={<ViewOtherSiteDetailsAdmin />} />
            <Route path="/otherApiList" element={<SeeOtherSiteList />} />
            <Route path="/subscription" element={<SubscriptionManager />} />
            {/* mqtt */}
            <Route path="/viewMqttDeviceList" element={<MqttDevicesScreen />} />
            <Route path="/viewMqttDeviceDetails/:deviceId" element={<MqttDeviceDetailsView />} />

            <Route path="/SearchResults" element={<SearchResults />} />
            
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />


            <Route path="/accountInfo" element={<AccountInfo  />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}