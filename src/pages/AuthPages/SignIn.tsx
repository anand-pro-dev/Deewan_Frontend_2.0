import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Deewan DashBoard Sign In"
        description="SignIn to DashBoard"
      />

      <div
      
        style={{ backgroundImage: "url('/images/background_image.png')" }}
      >
        <AuthLayout>
          <SignInForm />
        </AuthLayout>
      </div>
    </>
  );
}
