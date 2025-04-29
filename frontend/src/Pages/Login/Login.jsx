import React from "react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div className="px-2 flex min-h-screen justify-center items-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center block">Login</h2>

          <form>
            {/* Email Field Starts */}
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Email"
                className="input input-bordered w-full max-w-xs"
                name="email"
              />
            </div>
            {/* Email Field Ends */}

            {/* Password Field Starts */}
            <div className="form-control w-full max-w-xs mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Password"
                className="input input-bordered w-full max-w-xs"
                name="password"
              />
            </div>
            {/* Password Field Ends */}

            {/* Login Button */}
            <div className="mt-4">
              <button
                type="submit"
                className="btn btn-primary text-white w-full max-w-xs"
              >
                Login
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <p className="text-center font-semibold mt-2">
            <small>
              New to Weather Monitoring System?{" "}
              <Link className="text-secondary" to="/signup">
                Create New Account
              </Link>
            </small>
          </p>

          {/* Divider */}
          <div className="divider">OR</div>

          {/* Google Button */}
          <button className="btn btn-outline btn-primary w-full">
            <span className="mr-2">
              <FcGoogle />
            </span>
            Continue With Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
