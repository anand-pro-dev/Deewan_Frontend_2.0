import React from "react";
import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6  z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
<div
  className="
    items-center hidden w-full h-full lg:w-1/2 lg:grid
    bg-cover bg-center bg-no-repeat
    relative
  "
>
  {/* Dark overlay */}
  <div className="absolute inset-0 bg-brand-950/80 dark:bg-black/70" />

  <div className="relative flex items-center justify-center z-10">
    <GridShape />

    <div className="flex flex-col items-center  ">
 
       <img
  src="/images/logo/d_logoT.png"
  alt="Logo"
  className="w-90 lg:w-[420px] xl:w-[480px] mb-6"
/>

<h2 className="text-center text-lg lg:text-xl xl:text-2xl font-medium leading-relaxed text-gray-100 dark:text-white/90">
  "Deewan IoT is leading the way in the Global Internet of Things revolution."
</h2>

    </div>
  </div>
</div>

        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
