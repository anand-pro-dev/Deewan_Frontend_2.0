import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="SignUp DashboardDeewan DashBoard"
        description="   SignUp Tables Dashboard page for Deewan DashBoard "
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
