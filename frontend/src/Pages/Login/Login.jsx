import React from "react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";


const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  return (
    <div className="px-2 flex min-h-screen justify-center items-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center block">Login</h2>

          <form
              onSubmit={(e) => {
                e.preventDefault();
                fetch("http://localhost:5000/api/login", {
                  method: "POST",
                  headers: {"Content-Type": "application/json"},
                  credentials: "include",  // optional: for cookies
                  body: JSON.stringify(form),
                })
                    .then((res) => {
                      if (!res.ok) throw new Error("Login failed");
                      return res.json();
                    })
                    .then((data) => {
                      localStorage.setItem("jwt", data.token);
                      localStorage.setItem("email", data.user.email);
                      navigate("/dashboard");
                    })
                    .catch((err) => {
                      alert("Invalid email or password");
                      console.error(err);
                    });
              }}
          >
            {/* Email input */}
            <input
                type="email"
                className="input input-bordered w-full max-w-xs"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
            />

            {/* Password input */}
            <input
                type="password"
                className="input input-bordered w-full max-w-xs mt-4"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
            />

            <button type="submit" className="btn btn-primary mt-4 w-full">Login</button>
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
          <button
              onClick={() => {
                window.location.href = "http://localhost:5000/api/auth/google";
              }}
              className="btn btn-outline btn-primary w-full"
          >
  <span className="mr-2">
    <FcGoogle/>
  </span>
            Continue With Google
          </button>

        </div>
      </div>
    </div>
  );
};

export default Login;
