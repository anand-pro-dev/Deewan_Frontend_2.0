import { useState, useEffect, FormEvent, ChangeEvent, JSX } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import toast from 'react-hot-toast';
import { signInEmOTPApi, verifiOTPApi, signInEmPPassApi } from "../../apis/adminApi";
import { useAppDispatch } from "../../store/hooks";
import { setCredentials } from "../../store/slices/authSlice";

type TabType = 'password' | 'otp';

export default function SignInForm(): JSX.Element {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('password');
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [otpTimer, setOtpTimer] = useState<number>(0);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // OTP Timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpTimer]);

  // Handle Send OTP
  const handleSendOTP = async (): Promise<void> => {
    if (!emailOrPhone) {
      toast.error('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      const response = await signInEmOTPApi(emailOrPhone, 'D123456');

      if (response.success) {
        setOtpSent(true);
        setOtpTimer(120);
        toast.success('OTP sent successfully');
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('OTP send failed. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Login with OTP
  const handleLoginWithOTP = async (): Promise<void> => {
    if (otp.length !== 6) {
      toast.error('Enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      const response = await verifiOTPApi(emailOrPhone, otp);

      if (response.success && response.data) {
        const { token, user } = response.data;
        dispatch(setCredentials({ token, user }));
        toast.success('OTP verified!');
        navigate('/');
      } else {
        toast.error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      toast.error('OTP verification failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!emailOrPhone || !password) {
      toast.error('Enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await signInEmPPassApi(emailOrPhone, password);

      if (response.success && response.data) {
        const { token, user } = response.data;
        dispatch(setCredentials({ token, user }));
        toast.success(response.message || 'Login successful!');
        navigate('/');
      } else {
        toast.error(response.message || 'Login failed');
      }
    } catch (err) {
      toast.error('Login failed. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset OTP state
  const resetOTP = (): void => {
    setOtp('');
    setOtpSent(false);
    setOtpTimer(0);
  };

  // Format timer display
  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // Handle tab change
  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
    if (tab === 'password') {
      setOtpSent(false);
      setOtp('');
    } else {
      setPassword('');
    }
  };

  return (
    <div className="w-full max-w-md pt-10 mx-auto">
      <div className="z-10 w-full max-w-md p-8 mt-15.5 rounded-2xl shadow-xl transition-all duration-300 bg-white/30 hover:bg-white/50 backdrop-blur-md">
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-6">
          Sign In
        </h2>

        {/* Tabs */}
        <div className="mb-6 flex justify-between border-b border-gray-300">
          <button
            type="button"
            className={`w-1/2 py-2 font-medium text-center transition ${
              activeTab === 'password'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => handleTabChange('password')}
          >
            Email & Password
          </button>
          <button
            type="button"
            className={`w-1/2 py-2 font-medium text-center transition ${
              activeTab === 'otp'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => handleTabChange('otp')}
          >
            OTP
          </button>
        </div>

        <form onSubmit={handlePasswordLogin}>
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 backdrop-blur-sm"
                value={emailOrPhone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmailOrPhone(e.target.value)}
                disabled={otpSent}
              />
            </div>

            {/* Password Mode */}
            {activeTab === 'password' && (
              <>
                <div className="relative">
                  <label className="block mb-1 font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 backdrop-blur-sm"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute top-9 right-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeCloseIcon className="w-5 h-5 text-gray-700 fill-gray-700 stroke-gray-700" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-700 fill-gray-700 stroke-gray-700" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign in'}
                </button>
              </>
            )}

            {/* OTP Mode - Send OTP */}
            {activeTab === 'otp' && !otpSent && (
              <button
                type="button"
                className={`w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                onClick={handleSendOTP}
                disabled={loading || !emailOrPhone}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            )}

            {/* OTP Mode - Verify OTP */}
            {activeTab === 'otp' && otpSent && (
              <>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    Enter OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="------"
                    className="w-full p-3 text-center tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white/50 backdrop-blur-sm"
                    value={otp}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                  />
                </div>

                <button
                  type="button"
                  className={`w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  onClick={handleLoginWithOTP}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  {otpTimer > 0 ? (
                    <span className="text-blue-600">
                      Resend OTP in {formatTime(otpTimer)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-blue-600 hover:text-blue-700 transition"
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetOTP}
                    className="text-blue-600 hover:text-blue-700 transition"
                  >
                    Edit Contact
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}