import React from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const Signup = () => {
  return (
    <div className="px-2 flex min-h-screen justify-center items-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center block">Signup</h2>

          <form>
            {/* Name Field */}
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                placeholder="Name"
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            {/* Email Field */}
            <div className="form-control w-full max-w-xs mt-4">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Email"
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            {/* Password Field */}
            <div className="form-control w-full max-w-xs mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Password"
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            {/* Submit Button */}
            <input
              type="submit"
              className="btn btn-primary text-white w-full max-w-xs mt-6"
              value="Signup"
            />
          </form>

          {/* Redirect to Login */}
          <p className="text-center font-semibold mt-4">
            <small>
              Already have an account?
              <Link className="text-secondary ml-1" to="/login">
                Please Login
              </Link>
            </small>
          </p>

          {/* Divider */}
          <div className="divider">OR</div>

          {/* Google Signup Button */}
          <button className="btn btn-outline btn-primary w-full">
            <span className="mr-2">
              <FcGoogle size={20} />
            </span>
            Continue With Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
