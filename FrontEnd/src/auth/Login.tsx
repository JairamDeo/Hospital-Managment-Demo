
import { useForm } from "react-hook-form";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: {isSubmitting },
  } = useForm();

  const onSubmit = async (data: any) => {
    console.log("Login Data:", data);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    alert("Login Successful!");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
      <div>
        <label>Email:</label>
        <input
          type="email"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+$/i,
              message: "Invalid email format",
            },
          })}
        />
    
      </div>

      <div>
        <label>Password:</label>
        <input
          type="password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />
    
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

export default LoginForm;
