import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center">
      <SignUp
        appearance={{
          elements: {
            formField__firstName: "hidden", // hide first name
            formField__lastName: "hidden", // hide last name
          },
        }}
      />
    </div>
  );
}
